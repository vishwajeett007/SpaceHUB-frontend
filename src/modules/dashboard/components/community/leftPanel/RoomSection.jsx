import React, { useEffect, useMemo, useState } from 'react';
import { readStoredUser } from '../../../../../shared/services/authStorage';

import {
  deleteChatroom,
  deleteVoiceRoom,
  getChatroomsSummary,
  getVoiceRoomsList,
} from '../../../../../shared/services/API';

const RoomSection = ({ title, open, onToggle, onAdd, channels, isVoice = false, selectedChannel, onSelectChannel, groupName, roomCode, roomId, isLocalGroup = false, canCreate = false, onDeleteChatroom = null, onDeleteVoiceRoom = null, currentUserRole = '', user = null, onSwitchToGeneral = null, onRefreshGroups = null }) => {
  // For Announcement group, include 'general' channel; for others, filter it out
  const isAnnouncement = (title || groupName || '').toLowerCase() === 'announcement';
  const filteredChannels = useMemo(() => {
    const channelList = channels || [];
    return isAnnouncement
      ? channelList // Keep all channels including 'general' for Announcement
      : channelList.filter(ch => ch !== 'general' && ch !== 'General');
  }, [channels, isAnnouncement]);
  const roomType = isVoice ? 'voice' : 'chat';
  const [fetchedChatrooms, setFetchedChatrooms] = useState([]);
  const [fetchedChatroomsData, setFetchedChatroomsData] = useState([]); // Store full chatroom objects
  const [fetchedVoiceRooms, setFetchedVoiceRooms] = useState([]);
  const [fetchedVoiceRoomsData, setFetchedVoiceRoomsData] = useState([]); // Store full voice room objects
  const [loadingChatrooms, setLoadingChatrooms] = useState(false);
  const [loadingVoiceRooms, setLoadingVoiceRooms] = useState(false);
  const [deletingChatroom, setDeletingChatroom] = useState({});
  const [deletingVoiceRoom, setDeletingVoiceRoom] = useState({});
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, roomName: '', roomType: '', roomId: null, roomCode: null });
  const [voiceRoomModal, setVoiceRoomModal] = useState({ isOpen: false, channelName: '', channelId: null, roomCode: null, roomId: null });
  
  const getChannelId = useCallback((channelName) => `${groupName}:${roomType}:${channelName}`, [groupName, roomType]);
  
  useEffect(() => {
    if (open && !isVoice && roomCode) {
      const fetchChatrooms = async () => {
        setLoadingChatrooms(true);
        try {
          const response = await getChatroomsSummary(roomCode);
          const chatroomsData = response?.data || [];
          setFetchedChatroomsData(chatroomsData);
          const chatroomNames = chatroomsData.map((cr) => cr.name || cr.chatRoomCode).filter(Boolean);
          setFetchedChatrooms(chatroomNames);
        } catch (error) {
          console.error('Failed to fetch chatrooms:', error);
          setFetchedChatrooms([]);
          setFetchedChatroomsData([]);
        } finally {
          setLoadingChatrooms(false);
        }
      };
      
      fetchChatrooms();
    } else if (open && isVoice && roomId && !isLocalGroup) {
      const fetchVoiceRooms = async () => {
        setLoadingVoiceRooms(true);
        try {
          const response = await getVoiceRoomsList(roomId);
          const voiceRoomsData = response?.data || response?.voiceRooms || [];
          setFetchedVoiceRoomsData(voiceRoomsData);
          const voiceRoomNames = voiceRoomsData.map((vr) => vr.name).filter(Boolean);
          setFetchedVoiceRooms(voiceRoomNames);
        } catch (error) {
          console.error('Failed to fetch voice rooms:', error);
          setFetchedVoiceRooms([]);
          setFetchedVoiceRoomsData([]);
        } finally {
          setLoadingVoiceRooms(false);
        }
      };
      
      fetchVoiceRooms();
    } else if (!open) {
      setFetchedChatrooms([]);
      setFetchedChatroomsData([]);
      setFetchedVoiceRooms([]);
      setFetchedVoiceRoomsData([]);
    }
  }, [open, isVoice, roomCode, roomId, isLocalGroup]);

  useEffect(() => {
    if (!open) return;

    const refetchChatrooms = async () => {
      if (!isVoice && roomCode) {
        try {
          const response = await getChatroomsSummary(roomCode);
          const chatroomsData = response?.data || [];
          setFetchedChatroomsData(chatroomsData);
          const chatroomNames = chatroomsData.map((cr) => cr.name || cr.chatRoomCode).filter(Boolean);
          setFetchedChatrooms(chatroomNames);
        } catch (error) {
          console.error('Failed to refetch chatrooms:', error);
        }
      }
    };

    const refetchVoiceRooms = async () => {
      if (isVoice && roomId) {
        try {
          const response = await getVoiceRoomsList(roomId);
          const voiceRoomsData = response?.voiceRooms || response?.data || [];
          setFetchedVoiceRoomsData(voiceRoomsData);
          const voiceRoomNames = voiceRoomsData.map((vr) => vr.name).filter(Boolean);
          setFetchedVoiceRooms(voiceRoomNames);
        } catch (error) {
          console.error('Failed to refetch voice rooms:', error);
        }
      }
    };

    const handleChatroomCreated = () => refetchChatrooms();
    const handleVoiceRoomCreated = () => refetchVoiceRooms();

    window.addEventListener('chatroom:created', handleChatroomCreated);
    window.addEventListener('voice-room:created', handleVoiceRoomCreated);
    return () => {
      window.removeEventListener('chatroom:created', handleChatroomCreated);
      window.removeEventListener('voice-room:created', handleVoiceRoomCreated);
    };
  }, [open, isVoice, roomCode, roomId]);

  const handleDeleteChatroom = useCallback(async (chatroomName, e) => {
    e.stopPropagation(); 
    const chatroom = fetchedChatroomsData.find(cr => (cr.name || cr.chatRoomCode) === chatroomName);
    if (!chatroom || !roomCode) return;
    
    const chatroomId = chatroom.id || chatroom.chatRoomId || chatroom.chatRoomCode;
    if (!chatroomId) {
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: 'Chatroom ID not found', type: 'error' }
      }));
      return;
    }

    setDeleteModal({
      isOpen: true,
      roomName: chatroomName,
      roomType: 'chat',
      roomId: chatroomId,
      roomCode: roomCode
    });
  }, [fetchedChatroomsData, roomCode]);

  const confirmDeleteChatroom = useCallback(async () => {
    const { roomName, roomId, roomCode } = deleteModal;
    if (!roomName || !roomId || !roomCode) return;

    const deletedChannelId = getChannelId(roomName);
    const isCurrentlySelected = selectedChannel === deletedChannelId;

    setDeletingChatroom((prev) => ({ ...prev, [roomName]: true }));
    setDeleteModal({ isOpen: false, roomName: '', roomType: '', roomId: null, roomCode: null });

    try {
      await deleteChatroom(roomId, roomCode);
      
      setFetchedChatrooms((prev) => prev.filter(name => name !== roomName));
      setFetchedChatroomsData((prev) => prev.filter(cr => (cr.name || cr.chatRoomCode) !== roomName));
      
      if (onDeleteChatroom) {
        onDeleteChatroom(roomName, roomId);
      }
      
      try {
        const storageKey = `chatroom_${roomCode}_${roomName}`;
        sessionStorage.removeItem(storageKey);
        
        const existingChatrooms = JSON.parse(sessionStorage.getItem('chatrooms') || '[]');
        const updated = existingChatrooms.filter(
          (cr) => !(cr.name === roomName && cr.roomCode === roomCode)
        );
        sessionStorage.setItem('chatrooms', JSON.stringify(updated));
      } catch (storageError) {
        console.warn('Failed to update session storage:', storageError);
      }
      
      if (isCurrentlySelected && onSwitchToGeneral) {
        onSwitchToGeneral();
      }
      
      if (onRefreshGroups) {
        onRefreshGroups();
      }
      
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: 'Chatroom deleted successfully', type: 'success' }
      }));
    } catch (error) {
      console.error('Failed to delete chatroom:', error);
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: error.message || 'Failed to delete chatroom', type: 'error' }
      }));
    } finally {
      setDeletingChatroom((prev) => {
        const updated = { ...prev };
        delete updated[roomName];
        return updated;
      });
    }
  }, [deleteModal, getChannelId, selectedChannel, onDeleteChatroom, onSwitchToGeneral, onRefreshGroups]);

  const handleDeleteVoiceRoom = useCallback(async (voiceRoomName, e) => {
    e.stopPropagation();
    const voiceRoom = fetchedVoiceRoomsData.find(vr => vr.name === voiceRoomName);
    if (!voiceRoom || !roomId) return;
    const chatRoomId = roomId;
    if (!chatRoomId) {
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: 'Chat room ID not found', type: 'error' }
      }));
      return;
    }

    setDeleteModal({
      isOpen: true,
      roomName: voiceRoomName,
      roomType: 'voice',
      roomId: chatRoomId,
      roomCode: null
    });
  }, [fetchedVoiceRoomsData, roomId]);

  const confirmDeleteVoiceRoom = useCallback(async () => {
    const { roomName, roomId } = deleteModal;
    if (!roomName || !roomId) return;

    const deletedChannelId = getChannelId(roomName);
    const isCurrentlySelected = selectedChannel === deletedChannelId;

    let requester = '';
    if (user?.username) {
      requester = user.username;
    } else {
      try {
        const userData = readStoredUser() || {};
        requester = userData?.username || userData?.email?.split('@')[0] || '';
      } catch {
        // Ignore malformed cached user data.
      }
    }

    if (!requester) {
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: 'User username not found', type: 'error' }
      }));
      setDeleteModal({ isOpen: false, roomName: '', roomType: '', roomId: null, roomCode: null });
      return;
    }

    setDeletingVoiceRoom((prev) => ({ ...prev, [roomName]: true }));
    setDeleteModal({ isOpen: false, roomName: '', roomType: '', roomId: null, roomCode: null });

    try {
      await deleteVoiceRoom(roomId, roomName, requester);
      setFetchedVoiceRooms((prev) => prev.filter(name => name !== roomName));
      setFetchedVoiceRoomsData((prev) => prev.filter(vr => vr.name !== roomName));
      
      if (onDeleteVoiceRoom) {
        onDeleteVoiceRoom(roomName, roomId);
      }
      
      if (isCurrentlySelected && onSwitchToGeneral) {
        onSwitchToGeneral();
      }
      
      if (onRefreshGroups) {
        onRefreshGroups();
      }
      
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: 'Voice room deleted successfully', type: 'success' }
      }));
    } catch (error) {
      console.error('Failed to delete voice room:', error);
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: error.message || 'Failed to delete voice room', type: 'error' }
      }));
    } finally {
      setDeletingVoiceRoom((prev) => {
        const updated = { ...prev };
        delete updated[roomName];
        return updated;
      });
    }
  }, [deleteModal, getChannelId, selectedChannel, user, onDeleteVoiceRoom, onSwitchToGeneral, onRefreshGroups]);
  
  const allChannels = useMemo(() => {
    const merged = [...filteredChannels];
    if (isVoice) {
      fetchedVoiceRooms.forEach((name) => {
        if (!merged.includes(name)) {
          merged.push(name);
        }
      });
    } else {
      fetchedChatrooms.forEach((name) => {
        if (!merged.includes(name)) {
          merged.push(name);
        }
      });
    }
    return merged;
  }, [filteredChannels, fetchedChatrooms, fetchedVoiceRooms, isVoice]);
  
  const handleChannelClick = useCallback((channelName) => {
    const channelId = getChannelId(channelName);
    
    if (isVoice) {
      setVoiceRoomModal({
        isOpen: true,
        channelName: channelName,
        channelId: channelId,
        roomCode: roomCode,
        roomId: roomId
      });
    } else {
      onSelectChannel?.(channelId, roomCode, roomId);
    }
  }, [getChannelId, isVoice, roomCode, roomId, onSelectChannel]);
  
  const handleStartVoiceRoom = useCallback(() => {
    const { channelId, roomCode, roomId } = voiceRoomModal;
    setVoiceRoomModal({ isOpen: false, channelName: '', channelId: null, roomCode: null, roomId: null });
    onSelectChannel?.(channelId, roomCode, roomId);
  }, [voiceRoomModal, onSelectChannel]);
  
  const handleExitVoiceRoom = useCallback(() => {
    setVoiceRoomModal({ isOpen: false, channelName: '', channelId: null, roomCode: null, roomId: null });
  }, []);
  
  const hasChannels = allChannels.length > 0;
  
  return (
    <div className="mb-2 ml-4">
      <div className="flex items-center justify-between text-base text-gray-800">
        <button onClick={onToggle} className="flex items-center gap-2">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`text-gray-600 transition-transform ${open ? 'rotate-90' : ''}`}
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
          <span className="text-gray-800">{title}</span>
        </button>
        {canCreate && (
          <button onClick={onAdd} className="text-gray-500 hover:text-gray-700" title={`Create ${title}`}>
            +
          </button>
        )}
      </div>
      {open && (
        <div className="mt-2 pl-5 space-y-1">
          {!hasChannels && !loadingChatrooms && !loadingVoiceRooms && (
            <div className="px-3 py-2 text-xs text-gray-500 italic">
              No {isVoice ? 'voice' : 'chat'} rooms yet.{canCreate ? ' Click + to create one!' : ''}
            </div>
          )}
          {hasChannels && allChannels.map((channel) => {
            const channelId = getChannelId(channel);
            const isSelected = selectedChannel === channelId;
            const isDeleting = isVoice ? deletingVoiceRoom[channel] : deletingChatroom[channel];
            const isAuthorized = currentUserRole === 'ADMIN' || 
                                currentUserRole === 'OWNER' || 
                                currentUserRole === 'WORKSPACE_OWNER';
            const canDeleteChatroom = !isVoice && canCreate && isAuthorized && !(isAnnouncement && channel.toLowerCase() === 'general');
            const canDeleteVoiceRoom = isVoice && canCreate && isAuthorized;
            const canDelete = canDeleteChatroom || canDeleteVoiceRoom;
            
            return (
              <div
                key={channel}
                className={`flex items-center gap-2 group rounded-md px-1 transition-colors ${
                  isSelected
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-300 text-gray-800'
                }`}
              >
                <button
                  onClick={() => handleChannelClick(channel)}
                  className={`flex-1 text-left px-2 py-1.5 rounded-md text-sm flex items-center gap-2 truncate ${
                    isSelected
                      ? 'text-white font-semibold'
                      : 'text-gray-800 hover:text-gray-900'
                  }`}
                >
                  {isVoice ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className={isSelected ? 'text-white' : 'text-gray-700'}>
                      <path d="M12 1c-4.97 0-9 4.03-9 9v7c0 1.66 1.34 3 3 3h3v-8H5c-.55 0-1-.45-1-1V9c0-3.87 3.13-7 7-7s7 3.13 7 7v2c0 .55-.45 1-1 1h-4v8h3c1.66 0 3-1.34 3-3v-7c0-4.97-4.03-9-9-9z" />
                    </svg>
                  ) : (
                    <span className={isSelected ? 'text-white' : 'text-gray-700'}>#</span>
                  )}
                  <span>{channel}</span>
                </button>
                {canDelete && (
                  <button
                    onClick={(e) => isVoice ? handleDeleteVoiceRoom(channel, e) : handleDeleteChatroom(channel, e)}
                    disabled={isDeleting}
                    className={`opacity-0 group-hover:opacity-100 transition-opacity p-1.5 ${
                      isSelected ? 'text-white hover:text-red-600' : 'text-gray-500 hover:text-red-600'
                    } disabled:opacity-50`}
                    title={isVoice ? "Delete voice room" : "Delete chatroom"}
                  >
                    {isDeleting ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white md:bg-black rounded-lg shadow-lg max-w-md w-full border md:border-gray-700">
            <div className="px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900 md:text-white">
                Delete {deleteModal.roomType === 'voice' ? 'Voice Room' : 'Chatroom'}
              </h3>
            </div>
            <div className="px-6 py-4">
              <p className="text-gray-700 md:text-gray-300">
                Are you sure you want to delete <span className="font-semibold md:text-white">"{deleteModal.roomName}"</span>?
                This action cannot be undone.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 md:border-gray-700 flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteModal({ isOpen: false, roomName: '', roomType: '', roomId: null, roomCode: null })}
                className="px-4 py-2 text-gray-700 md:text-gray-300 hover:bg-gray-100 md:hover:bg-gray-800 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (deleteModal.roomType === 'voice') {
                    confirmDeleteVoiceRoom();
                  } else {
                    confirmDeleteChatroom();
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-md transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Voice Room Confirmation Modal */}
      {voiceRoomModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 modal-backdrop">
          <div className="bg-white md:bg-black rounded-lg shadow-lg max-w-md w-full border md:border-gray-700 modal-content">
            <div className="px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900 md:text-white">
                Voice Room: {voiceRoomModal.channelName}
              </h3>
            </div>
            <div className="px-6 py-4">
              <p className="text-gray-700 md:text-gray-300">
                Would you like to start this voice room?
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 md:border-gray-700 flex items-center justify-end gap-3">
              <button
                onClick={handleExitVoiceRoom}
                className="px-4 py-2 text-gray-700 md:text-gray-300 hover:bg-gray-100 md:hover:bg-gray-800 rounded-md transition-colors"
              >
                Exit
              </button>
              <button
                onClick={handleStartVoiceRoom}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors"
              >
                Start Voice Room
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(RoomSection);
