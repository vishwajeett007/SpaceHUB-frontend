import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../../../shared/contexts/AuthContextContext';
import { getStoredUserEmail } from '../../../../shared/services/authStorage';
import {
  createNewChatroom,
  createVoiceRoom,
  getChatroomsSummary,
  getCommunityMembers,
  getCommunityRooms,
  getLocalGroupById,
  getVoiceRoomsList,
  joinVoiceRoom,
  leaveCommunity,
} from '../../../../shared/services/API';
import {
  CreateChannelModal,
  CreateGroupModal,
  GroupSection,
  InviteModal,
} from './leftPanel';

const CommunityLeftPanel = ({ community, onBack, isLocalGroup = false }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const title = community?.name || 'Community';
  const communityId = community?.id || community?.communityId || community?.community_id;

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedChannel, setSelectedChannel] = useState(null);

  const handleChannelSelect = useCallback(async (channelId, roomCode, roomId) => {
    setSelectedChannel(channelId);
    
    let chatRoomCode = null;
    let janusRoomId = null;
    const userEmail = user?.email || getStoredUserEmail();
    
    const parts = channelId?.split(':') || [];
    if (parts.length >= 3) {
      const groupName = parts[0]; 
      const channelName = parts[2];
      const roomType = parts[1];
      
      if (roomType === 'chat') {
      if (channelName && roomCode) {
        try {
          const storageKey = `chatroom_${roomCode}_${channelName}`;
          const stored = sessionStorage.getItem(storageKey);
          
          if (stored) {
            const parsed = JSON.parse(stored);
            chatRoomCode = parsed?.data?.chatRoomCode || parsed?.chatRoomCode;
          }
          
          if (!chatRoomCode) {
            const response = await getChatroomsSummary(roomCode);
            const chatroomsData = response?.data || [];
            const chatroom = chatroomsData.find((cr) => cr.name === channelName);
            if (chatroom) {
              chatRoomCode = chatroom.chatRoomCode;
              sessionStorage.setItem(storageKey, JSON.stringify({ data: { chatRoomCode } }));
            }
          }
        } catch (error) {
          console.error('Failed to get chatRoomCode:', error);
        }
      }
      } else if (roomType === 'voice') {
        if (channelName && roomId && userEmail) {
          try {
            // Always fetch fresh voice room data from API to get correctly scoped janusRoomId
            try {
              const response = await getVoiceRoomsList(roomId);
              const voiceRoomsData = response?.data || response?.voiceRooms || [];
              const voiceRoom = voiceRoomsData.find((vr) => vr.name === channelName);
              if (voiceRoom && voiceRoom.janusRoomId) {
                janusRoomId = voiceRoom.janusRoomId;
                // Update sessionStorage with fresh data
                const storageKey = `voiceRoom_${roomId}_${channelName}`;
                sessionStorage.setItem(storageKey, JSON.stringify({ data: voiceRoom }));
                
                const voiceRoomsArray = JSON.parse(sessionStorage.getItem('voiceRooms') || '[]');
                const existingIndex = voiceRoomsArray.findIndex(
                  (vr) => vr.name === channelName && (vr.chatRoomId === roomId || vr.chatRoomId === String(roomId))
                );
                if (existingIndex >= 0) {
                  voiceRoomsArray[existingIndex] = { ...voiceRoom, chatRoomId: roomId, groupName };
                } else {
                  voiceRoomsArray.push({ ...voiceRoom, chatRoomId: roomId, groupName });
                }
                sessionStorage.setItem('voiceRooms', JSON.stringify(voiceRoomsArray));
              }
            } catch (error) {
              console.error('Failed to fetch voice room from API:', error);
            }

            // Fallback: check sessionStorage if API failed
            if (!janusRoomId) {
              const storageKey = `voiceRoom_${roomId}_${channelName}`;
              const stored = sessionStorage.getItem(storageKey);
              if (stored) {
                const parsed = JSON.parse(stored);
                janusRoomId = parsed?.data?.janusRoomId || 
                             parsed?.data?.voiceRooms?.[0]?.janusRoomId ||
                             parsed?.janusRoomId ||
                             parsed?.voiceRooms?.[0]?.janusRoomId;
              }
            }

            // Fallback: check voiceRooms array
            if (!janusRoomId) {
              const voiceRoomsArray = JSON.parse(sessionStorage.getItem('voiceRooms') || '[]');
              const voiceRoom = voiceRoomsArray.find(
                (vr) => vr.name === channelName && (vr.chatRoomId === roomId || vr.chatRoomId === String(roomId))
              );
              if (voiceRoom) {
                janusRoomId = voiceRoom.janusRoomId;
              }
            }

            // Last resort: generate scoped janusRoomId matching backend logic
            if (!janusRoomId && channelName) {
              const combined = `${roomId || ''}::${channelName}`;
              const hash = combined.split('').reduce((acc, char) => {
                acc = ((acc << 5) - acc) + char.charCodeAt(0);
                return acc & acc;
              }, 0);
              janusRoomId = `vr_${roomId}_${Math.abs(hash).toString(36)}`;
            }
            
            // Join the voice room if janusRoomId is found
            if (janusRoomId) {
              try {
                const joinResponse = await joinVoiceRoom(janusRoomId, userEmail);
                console.log('Joined voice room:', joinResponse);
                // Save join response if needed
                sessionStorage.setItem(`voiceRoomJoin_${janusRoomId}`, JSON.stringify(joinResponse));
                
                // Extract sessionId and handleId from response
                const responseData = joinResponse?.data || joinResponse;
                const sessionId = responseData?.sessionId;
                const handleId = responseData?.handleId;
                
                if (sessionId && handleId) {
                  window.dispatchEvent(new CustomEvent('voice-room:joined', {
                    detail: { janusRoomId, sessionId, handleId, userId: userEmail }
                  }));
                }
                
                window.dispatchEvent(new CustomEvent('toast', {
                  detail: { message: 'Successfully joined voice room!', type: 'success' }
                }));
              } catch (error) {
                console.error('Failed to join voice room:', error);
                if (error.message && !error.message.includes('403')) {
                  window.dispatchEvent(new CustomEvent('toast', {
                    detail: { message: error.message || 'Failed to join voice room', type: 'error' }
                  }));
                }
              }
            } else {
              console.warn('janusRoomId not found for voice room:', channelName);
            }
          } catch (error) {
            console.error('Failed to get janusRoomId:', error);
          }
        }
      }
    }
    
    try {
      window.dispatchEvent(new CustomEvent('community:channel-selected', {
        detail: { channelId, roomCode, chatRoomCode, janusRoomId }
      }));
    } catch (error) {
      console.error('Error dispatching channel-selected event:', error);
    }
  }, [user]);

  const handleSwitchToGeneral = useCallback(() => {
    const announcementGroup = groups.find(
      (g) => (g.name || '').toLowerCase() === 'announcement'
    );
    const targetRoomCode = announcementGroup?.roomCode || groups[0]?.roomCode || communityId;
    const targetRoomId = announcementGroup?.id || groups[0]?.id || communityId;
    
    handleChannelSelect('announcement:general', targetRoomCode, targetRoomId);
  }, [communityId, groups, handleChannelSelect]);

  const [openGroups, setOpenGroups] = useState({});
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [channelModalContext, setChannelModalContext] = useState({ groupName: null, roomType: null, roomId: null });
  const [imageError, setImageError] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState('');
  const dropdownRef = useRef(null);

  
  useEffect(() => {
    setImageError(false);
  }, [community?.imageUrl]);

  useEffect(() => {
    const determineRole = async () => {
      try {
        const userEmail = user?.email || getStoredUserEmail();
        if (!communityId || !userEmail) return;
        if (isLocalGroup) {
          try {
            const cached = sessionStorage.getItem(`localGroupDetails:${communityId}`);
            const lg = cached ? JSON.parse(cached) : null;
            const creator = lg?.creatorEmail || lg?.createdByEmail || lg?.creator || '';
            setCurrentUserRole(creator && creator.toLowerCase() === userEmail.toLowerCase() ? 'ADMIN' : 'MEMBER');
          } catch {
            // Ignore unavailable or malformed cached local-group details.
          }
        } else {
          const data = await getCommunityMembers(communityId);
          const members = data?.data?.members || data?.members || [];
          const me = members.find((m) => (m.email || m.username) && (m.email || m.username).toLowerCase() === userEmail.toLowerCase());
          setCurrentUserRole(((me?.role || '').toUpperCase()) || '');
          
          const avatarMap = {};
          const usernameMap = {};
          members.forEach((member) => {
            const email = member?.email || member?.username || '';
            if (email) {
              if (member?.avatarPreviewUrl) {
                avatarMap[email.toLowerCase()] = member.avatarPreviewUrl;
              }
              if (member?.username) {
                usernameMap[email.toLowerCase()] = member.username;
              }
            }
          });
          
          if (Object.keys(avatarMap).length > 0) {
            const storageKey = `community_avatars_${communityId}`;
            const existingAvatars = JSON.parse(sessionStorage.getItem(storageKey) || '{}');
            sessionStorage.setItem(storageKey, JSON.stringify({ ...existingAvatars, ...avatarMap }));
          }
          
          if (Object.keys(usernameMap).length > 0) {
            const storageKey = `community_usernames_${communityId}`;
            const existingUsernames = JSON.parse(sessionStorage.getItem(storageKey) || '{}');
            sessionStorage.setItem(storageKey, JSON.stringify({ ...existingUsernames, ...usernameMap }));
          }
        }
      } catch {
        // Role lookup failures leave the user without elevated permissions.
      }
    };
    determineRole();
  }, [communityId, isLocalGroup, user?.email]);

  const openGroupsRef = useRef(openGroups);
  useEffect(() => {
    openGroupsRef.current = openGroups;
  }, [openGroups]);

  const fetchGroups = useCallback(async (preserveOpenState = false) => {
    if (!communityId) {
      console.warn('Community ID not available');
      return;
    }

    // Preserve current open state if requested
    const previousOpenGroups = preserveOpenState ? { ...openGroupsRef.current } : null;

    setLoading(true);
    setError('');
    try {
      if (isLocalGroup) {
        let lg = null;
        try {
          const cached = sessionStorage.getItem(`localGroup:${communityId}`);
          if (cached) {
            lg = JSON.parse(cached);
          }
        } catch {
          // Ignore unavailable or malformed cached local-group data and fetch it below.
        }
        
        if (!lg) {
          const data = await getLocalGroupById(communityId);
          lg = data?.data || data || {};
        }

        try {
          sessionStorage.setItem(`localGroupDetails:${communityId}`, JSON.stringify(lg));
        } catch {
          // Caching is optional when session storage is unavailable.
        }
  
        const chatRoomCode = lg.chatRoomCode || lg.roomCode || lg.code;
        const chatRoomId = lg.chatRoomId || lg.chatroomId || lg.primaryChatRoomId || lg.roomId || lg.id;
              if (chatRoomCode) {
          try {
            sessionStorage.setItem(`localGroupChatRoomCode:${communityId}`, chatRoomCode);
          } catch {
            // Caching is optional when session storage is unavailable.
          }
        }
        if (chatRoomId) {
          try {
            sessionStorage.setItem(`localGroupChatRoomId:${communityId}`, String(chatRoomId));
          } catch {
            // Caching is optional when session storage is unavailable.
          }
        }

        const transformedGroups = [
          {
            id: lg.id || lg.groupId || communityId,
            chatRoomId: chatRoomId || lg.id || communityId,
            name: lg.name || lg.groupName || title || 'Local Group',
            chatRooms: ['general'], 
            voiceRooms: ['general'],
            roomCode: chatRoomCode, // Use chatRoomCode from response
          },
        ];

        setGroups(transformedGroups);
        if (preserveOpenState && previousOpenGroups) {
          setOpenGroups(() => {
            const newState = transformedGroups.reduce((acc, g) => {
              acc[g.name] = previousOpenGroups[g.name] !== undefined ? previousOpenGroups[g.name] : true;
              return acc;
            }, {});
            return newState;
          });
        } else {
          setOpenGroups(
            transformedGroups.reduce((acc, g) => ({ ...acc, [g.name]: true }), {})
          );
        }
      } else {
        const data = await getCommunityRooms(communityId);
        const roomsList = data?.data || [];

        try {
          sessionStorage.setItem(`communityRooms:${communityId}`, JSON.stringify(data));
        } catch (err) {
          console.warn('Failed to save community rooms to sessionStorage:', err);
        }

        const transformedGroups = roomsList
          .filter((room) => {
            const name = (room.name || room.roomName || '').toLowerCase();
            return name !== 'general' && name !== 'announcement';
          })
          .map((room) => {
            const chatRooms = (room.chatRooms || []).filter(ch => ch.toLowerCase() !== 'general');
            const voiceRooms = (room.voiceRooms || []).filter(ch => ch.toLowerCase() !== 'general' && ch.toLowerCase() !== 'voice-lounge');
            return {
              id: room.id,
              name: room.name || room.roomName,
              chatRooms,
              voiceRooms,
              roomCode: room.roomCode
            };
          });

        setGroups(transformedGroups);
        if (preserveOpenState && previousOpenGroups) {
          // Preserve open state for existing groups, defaulting new ones to open
          setOpenGroups(() => {
            const newState = transformedGroups.reduce((acc, g) => {
              acc[g.name] = previousOpenGroups[g.name] !== undefined ? previousOpenGroups[g.name] : true;
              return acc;
            }, {});
            return newState;
          });
        } else {
          setOpenGroups(
            transformedGroups.reduce((acc, g) => ({ ...acc, [g.name]: true }), {})
          );
        }
      }
    } catch (err) {
      console.error('Error fetching groups:', err);
      setError(err.message || 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  }, [communityId, isLocalGroup, title]);

  useEffect(() => {
    if (communityId) {
      fetchGroups();
    }
  }, [communityId, fetchGroups]);

  useEffect(() => {
    const onRefresh = () => {
      if (communityId) {
        fetchGroups();
      }
    };
    window.addEventListener('community:refresh-groups', onRefresh);
    const onOpenInvite = () => {
      // Only allow workspace owners and admins to generate invite links
      const isAuthorized = currentUserRole === 'ADMIN' || 
                          currentUserRole === 'OWNER' || 
                          currentUserRole === 'WORKSPACE_OWNER';
      if (isAuthorized) {
        setShowInviteModal(true);
      } else {
        window.dispatchEvent(new CustomEvent('toast', {
          detail: { message: 'Only workspace owners and admins can generate invite links', type: 'error' }
        }));
      }
    };
    window.addEventListener('community:open-invite', onOpenInvite);
    return () => {
      window.removeEventListener('community:refresh-groups', onRefresh);
      window.removeEventListener('community:open-invite', onOpenInvite);
    };
  }, [communityId, fetchGroups, currentUserRole]);

  const handleAddChatRoom = (groupName) => {
    setChannelModalContext({ groupName, roomType: 'chat' });
    setShowCreateChannelModal(true);
  };

  const handleDeleteVoiceRoom = useCallback(() => undefined, []);

  const handleAddVoiceRoom = (groupName) => {
    const targetGroup = groups.find((g) => g.name === groupName);
    const roomId = targetGroup?.id;
    setChannelModalContext({ groupName, roomType: 'voice', roomId });
    setShowCreateChannelModal(true);
  };

  const handleChannelCreated = async (channelName) => {
    const { groupName, roomType, roomId } = channelModalContext;
    if (!groupName || !channelName) return;

    const clean = channelName.trim();
    const userEmail = user?.email || getStoredUserEmail();
    
    if (roomType === 'chat') {
      const targetGroup = groups.find((g) => g.name === groupName);
      let roomCode = targetGroup?.roomCode;
      
      if (isLocalGroup && !roomCode) {
        try {
          roomCode = sessionStorage.getItem(`localGroupChatRoomCode:${communityId}`);
        } catch {
          // Continue without a cached room code when session storage is unavailable.
        }
      }
      
      if (roomCode) {
        try {
          const response = await createNewChatroom(roomCode, clean);
          
          // Save response to session storage
          const storageKey = `chatroom_${roomCode}_${clean}`;
          const existingChatrooms = JSON.parse(sessionStorage.getItem('chatrooms') || '[]');
          const chatroomData = {
            id: response?.data?.id || response?.id,
            name: response?.data?.name || clean,
            createdAt: response?.data?.createdAt || Date.now(),
            chatRoomCode: response?.data?.chatRoomCode || response?.data?.id,
            roomCode: roomCode,
            groupName: groupName,
            created: new Date().toISOString()
          };
          
          // Check if already exists, update if found, otherwise add
          const existingIndex = existingChatrooms.findIndex(
            (cr) => cr.chatRoomCode === chatroomData.chatRoomCode || 
                    (cr.name === clean && cr.roomCode === roomCode)
          );
          
          if (existingIndex >= 0) {
            existingChatrooms[existingIndex] = chatroomData;
          } else {
            existingChatrooms.push(chatroomData);
          }
          
          sessionStorage.setItem('chatrooms', JSON.stringify(existingChatrooms));
          sessionStorage.setItem(storageKey, JSON.stringify(response));
          
          // Show success toast
          window.dispatchEvent(new CustomEvent('toast', {
            detail: { message: 'Chatroom created successfully!', type: 'success' }
          }));
          
          // Dispatch event to refresh chatrooms in RoomSection
          window.dispatchEvent(new CustomEvent('chatroom:created', {
            detail: { roomCode, chatroomName: clean, groupName }
          }));
          
          // Refresh groups to get updated chatrooms list
          fetchGroups(true);
        } catch (error) {
          console.error('Failed to create chatroom:', error);
          window.dispatchEvent(new CustomEvent('toast', {
            detail: { message: error.message || 'Failed to create chatroom', type: 'error' }
          }));
        }
      }
      
      setGroups((prev) =>
        prev.map((g) =>
          g.name === groupName
            ? { ...g, chatRooms: [...(g.chatRooms || []), clean] }
            : g
        )
      );
    } else if (roomType === 'voice') {
      let chatRoomId = roomId;
      if (isLocalGroup) {
        // Prioritize chatRoomId from group data or session storage
        const targetGroup = groups.find((g) => g.name === groupName);
        chatRoomId = targetGroup?.chatRoomId || chatRoomId;
        if (!chatRoomId) {
          try {
            const storedChatRoomId = sessionStorage.getItem(`localGroupChatRoomId:${communityId}`);
            if (storedChatRoomId) {
              chatRoomId = storedChatRoomId;
            }
          } catch {
            // Continue with the remaining room ID fallbacks when storage is unavailable.
          }
        }
        if (!chatRoomId) {
          chatRoomId = targetGroup?.id || communityId;
        }
      }
      
      if (chatRoomId && userEmail) {
        try {
          const response = await createVoiceRoom(chatRoomId, clean, userEmail);
          
          // Save response to session storage
          const storageKey = `voiceRoom_${roomId}_${clean}`;
          const existingVoiceRooms = JSON.parse(sessionStorage.getItem('voiceRooms') || '[]');
          
          const voiceRoomFromResponse = response?.data || response;
          const actualVoiceRoom = voiceRoomFromResponse?.voiceRooms?.[0] || voiceRoomFromResponse;
          
          const voiceRoomData = {
            id: actualVoiceRoom?.id || response?.data?.id || response?.id,
            janusRoomId: actualVoiceRoom?.janusRoomId || response?.data?.janusRoomId || response?.janusRoomId,
            name: actualVoiceRoom?.name || response?.data?.name || clean,
            createdBy: actualVoiceRoom?.createdBy || response?.data?.createdBy || userEmail,
            createdAt: actualVoiceRoom?.createdAt || response?.data?.createdAt || new Date().toISOString(),
            active: actualVoiceRoom?.active !== undefined ? actualVoiceRoom?.active : (response?.data?.active !== undefined ? response?.data?.active : true),
            roomCode: actualVoiceRoom?.roomCode || response?.data?.roomCode || response?.roomCode,
            chatRoomId: roomId,
            groupName: groupName,
            created: new Date().toISOString()
          };
          
          const existingIndex = existingVoiceRooms.findIndex(
            (vr) => (vr.id === voiceRoomData.id && (vr.chatRoomId === roomId || vr.chatRoomId === String(roomId))) || 
                    (vr.name === clean && (vr.chatRoomId === roomId || vr.chatRoomId === String(roomId)))
          );
          
          if (existingIndex >= 0) {
            existingVoiceRooms[existingIndex] = voiceRoomData;
          } else {
            existingVoiceRooms.push(voiceRoomData);
          }
          
          sessionStorage.setItem('voiceRooms', JSON.stringify(existingVoiceRooms));
          sessionStorage.setItem(storageKey, JSON.stringify(response));
          

          window.dispatchEvent(new CustomEvent('toast', {
            detail: { message: 'Voice room created successfully!', type: 'success' }
          }));
          
          // Dispatch event to refresh voice rooms in GroupSection
          window.dispatchEvent(new CustomEvent('voice-room:created', {
            detail: { roomId, voiceRoomName: clean }
          }));
          
          // Refresh groups to get updated voice rooms list, but preserve open state
          fetchGroups(true);
        } catch (error) {
          console.error('Failed to create voice room:', error);
          window.dispatchEvent(new CustomEvent('toast', {
            detail: { message: error.message || 'Failed to create voice room', type: 'error' }
          }));
        }
      } else {
        window.dispatchEvent(new CustomEvent('toast', {
          detail: { message: 'Room ID or user email not found', type: 'error' }
        }));
      }
      
      // Update local state immediately for better UX
      setGroups((prev) =>
        prev.map((g) =>
          g.name === groupName
            ? { ...g, voiceRooms: [...(g.voiceRooms || []), clean] }
            : g
        )
      );
    }
    
    try {
      window.dispatchEvent(new CustomEvent('community:add-channel', {
        detail: { community, groupName, kind: roomType === 'chat' ? 'chat-room' : 'voice-room', name: clean }
      }));
    } catch (error) {
      console.error('Error dispatching add-channel event:', error);
    }
  };

  const toggleGroup = (groupName) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  const handleDropdownAction = (action) => {
    setShowDropdown(false);
    if (action === 'invite') {
      // Only allow workspace owners and admins to generate invite links
      const isAuthorized = currentUserRole === 'ADMIN' || 
                          currentUserRole === 'OWNER' || 
                          currentUserRole === 'WORKSPACE_OWNER';
      if (isAuthorized) {
        setShowInviteModal(true);
      } else {
        window.dispatchEvent(new CustomEvent('toast', {
          detail: { message: 'Only workspace owners and admins can generate invite links', type: 'error' }
        }));
      }
    } else if (action === 'create-group') {
      // Only allow workspace owners and admins to create groups
      const isAuthorized = currentUserRole === 'ADMIN' || 
                          currentUserRole === 'OWNER' || 
                          currentUserRole === 'WORKSPACE_OWNER';
      if (isAuthorized) {
        setShowCreateGroupModal(true);
      } else {
        window.dispatchEvent(new CustomEvent('toast', {
          detail: { message: 'Only workspace owners and admins can create groups', type: 'error' }
        }));
      }
    } else if (action === 'settings') {
      // Navigate to settings page
      if (communityId) {
        if (isLocalGroup) {
          navigate(`/dashboard/local-group/${communityId}/settings`);
        } else {
          navigate(`/dashboard/community/${communityId}/settings`);
        }
      }
    } else if (action === 'leave') {
      const userEmail = user?.email || getStoredUserEmail();
      if (isLocalGroup) {
        try { window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Left local-group', type: 'success' } })); } catch {
          // Leaving the group should still complete if toast dispatch is unavailable.
        }
        onBack?.();
      } else if (community?.name && userEmail) {
        leaveCommunity({ communityName: community.name, userEmail })
          .then(() => {
            try { window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Left community', type: 'success' } })); } catch {
              // Leaving the community should still complete if toast dispatch is unavailable.
            }
            onBack?.();
          })
          .catch((err) => {
            try { window.dispatchEvent(new CustomEvent('toast', { detail: { message: err.message || 'Failed to leave', type: 'error' } })); } catch {
              // The leave request error is already handled even if toast dispatch is unavailable.
            }
          });
      }
    }
  };

  const handleCreateGroupSuccess = (newGroup) => {
    if (newGroup) {
      const gName = newGroup.name || newGroup.roomName;
      if (gName) {
        setGroups((prev) => {
          const exists = prev.some(g => g.name === gName);
          if (!exists) {
            return [...prev, {
              id: newGroup.id || `group-${Date.now()}`,
              name: gName,
              chatRooms: newGroup.chatRooms || [],
              voiceRooms: newGroup.voiceRooms || [],
              roomCode: newGroup.roomCode
            }];
          }
          return prev;
        });
        setOpenGroups((prev) => ({
          ...prev,
          [gName]: true
        }));
      }
    }
    fetchGroups(true);
    
    window.dispatchEvent(new CustomEvent('community:refresh-groups', { detail: community }));
    try { window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Group created successfully', type: 'success' } })); } catch {
      // Group refresh should still complete if toast dispatch is unavailable.
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  {/* Community Left Panel */}
  return (
    <div className={`min-w-[80vw] sm:min-w-55 md:min-w-70 bg-gray-200 h-full flex flex-col rounded-r-xl relative ${showDropdown ? 'overflow-visible' : 'overflow-hidden'}`}>
      {/* Header */}
      <div
        ref={dropdownRef}
        className={`px-4 py-3 relative flex-shrink-0 ${
          showDropdown
            ? 'bg-[#282828] rounded-t-md'
            : 'border-b border-gray-500'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 truncate flex-1">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-zinc-400 flex-shrink-0">
              {community?.imageUrl && !imageError ? (
                <img 
                  src={community.imageUrl} 
                  alt={title} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-full bg-zinc-400 flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-800">{title.charAt(0).toUpperCase()}</span>
                </div>
              )}
            </div>
            <span className={`font-semibold text-lg truncate ${showDropdown ? 'text-white' : 'text-gray-900'}`}>{title}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              title="Menu"
              className={`${showDropdown ? 'text-white' : 'text-gray-600 hover:text-gray-900'} transition-transform`}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Dropdown Menu - Absolutely positioned to not expand panel */}
        {showDropdown && (
          <div className="absolute top-full left-0 right-0 bg-[#282828] rounded-b-md overflow-hidden shadow-lg z-50">
            <div className="pt-2 pb-2 border-t border-gray-600">
              {(currentUserRole === 'ADMIN' || currentUserRole === 'OWNER' || currentUserRole === 'WORKSPACE_OWNER') && (
                <>
                  <button
                    onClick={() => handleDropdownAction('invite')}
                    className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white hover:text-black transition-colors"
                  >
                    Invite people
                  </button>
                  <button
                    onClick={() => handleDropdownAction('create-group')}
                    className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white hover:text-black transition-colors"
                  >
                    Create group
                  </button>
                </>
              )}
              <button
                onClick={() => handleDropdownAction('settings')}
                className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white hover:text-black transition-colors"
              >
                Settings
              </button>
              <button
                onClick={() => handleDropdownAction('leave')}
                className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white hover:text-black transition-colors"
              >
                {isLocalGroup ? 'Leave local-group' : 'Leave community'}
              </button>
            </div>
          </div>
        )}
      </div>


      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 relative pb-16">
        {/* Top-level General Channel (Admin/Owner announcement channel) */}
        <div className="mb-3">
          <button
            onClick={handleSwitchToGeneral}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-between transition-all ${
              selectedChannel === 'announcement:general' || selectedChannel === 'general'
                ? 'bg-gray-800 text-white shadow-sm'
                : 'text-gray-800 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={selectedChannel === 'announcement:general' || selectedChannel === 'general' ? 'text-white font-bold text-base' : 'text-gray-700 font-bold text-base'}>#</span>
              <span>general</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-200 text-gray-700 font-medium">Announcements</span>
          </button>
        </div>

        {/* Create Group Button (Only for Admins and Owners) */}
        {(currentUserRole === 'ADMIN' || currentUserRole === 'OWNER' || currentUserRole === 'WORKSPACE_OWNER') && (
          <div className="mb-4">
            <button
              onClick={() => {
                const isAuthorized = currentUserRole === 'ADMIN' || 
                                    currentUserRole === 'OWNER' || 
                                    currentUserRole === 'WORKSPACE_OWNER';
                if (isAuthorized) {
                  setShowCreateGroupModal(true);
                } else {
                  window.dispatchEvent(new CustomEvent('toast', {
                    detail: { message: 'Only community admins and owners can create groups', type: 'error' }
                  }));
                }
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span>Create Group</span>
            </button>
          </div>
        )}

        {loading && (
          <div className="space-y-4">
            {/* Groups skeleton */}
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="mb-3">
                <div className="h-4 w-36 bg-gray-300 rounded animate-pulse mb-2" />
                <div className="pl-4 space-y-2">
                  <div className="h-7 w-48 bg-gray-200 rounded animate-pulse" />
                  <div className="h-7 w-40 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        )}
        {error && (
          <div className="text-red-600 text-sm mb-4">{error}</div>
        )}

        {/* Groups with Chat room and Voice room */}
        {!loading && groups.length === 0 && !error && (
          <div className="text-gray-600 text-sm mt-4">
            {(currentUserRole === 'ADMIN' || currentUserRole === 'OWNER' || currentUserRole === 'WORKSPACE_OWNER')
              ? 'No groups yet. Create a group to get started!'
              : 'No groups created yet.'}
          </div>
        )}
        
        {!loading && groups.map((group) => {
          const canCreate = currentUserRole === 'ADMIN' || 
                            currentUserRole === 'OWNER' || 
                            currentUserRole === 'WORKSPACE_OWNER';
          return (
            <GroupSection
              key={group.id || group.name}
              groupName={group.name}
              open={openGroups[group.name] || false}
              onToggle={() => toggleGroup(group.name)}
              chatRooms={group.chatRooms || []}
              voiceRooms={group.voiceRooms || []}
              onAddChatRoom={handleAddChatRoom}
              onAddVoiceRoom={handleAddVoiceRoom}
              selectedChannel={selectedChannel}
              onSelectChannel={handleChannelSelect}
              roomCode={group.roomCode}
              roomId={group.chatRoomId || group.id}
              isLocalGroup={isLocalGroup}
              canCreate={canCreate}
              currentUserRole={currentUserRole}
              onDeleteVoiceRoom={handleDeleteVoiceRoom}
              user={user}
              onSwitchToGeneral={handleSwitchToGeneral}
              onRefreshGroups={fetchGroups}
            />
          );
        })}
            {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 bg-gray-200 px-4 pb-3 pt-2 border-t border-gray-300 rounded-b-xl">
        <button onClick={onBack} className="w-full text-center text-sm bg-zinc-900 text-white rounded-xl py-3 font-medium">
          Back to Dashboard
        </button>
      </div>
      </div>



      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
        communityName={title}
        communityId={communityId}
        onCreateSuccess={handleCreateGroupSuccess}
      />

      {/* Invite People Modal */}
      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        communityName={title}
        communityId={communityId}
        isLocalGroup={isLocalGroup}
        currentUserRole={currentUserRole}
      />

      {/* Create Channel Modal */}
      <CreateChannelModal
        isOpen={showCreateChannelModal}
        onClose={() => {
          setShowCreateChannelModal(false);
          setChannelModalContext({ groupName: null, roomType: null });
        }}
        groupName={channelModalContext.groupName}
        roomType={channelModalContext.roomType}
        onSuccess={handleChannelCreated}
      />
    </div>
  );
};

export default CommunityLeftPanel;
