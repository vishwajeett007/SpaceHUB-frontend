import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../../../shared/contexts/AuthContextContext';
import { getCommunityMembers, joinRoom, joinVoiceRoom, BASE_URL } from '../../../../shared/services/API';
import ChatRoom from '../chatRoom/Chatroom';
import VoiceRoom from '../voiceRoom/VoiceRoom';
import { useVoiceRoom } from '../../../../shared/hooks/useVoiceRoom';

const getWsCommunityChatUrl = (wsRoomCode, userEmail) => {
  if (!BASE_URL) {
    return `wss://spacehub.monu14.me/chat?roomCode=${encodeURIComponent(wsRoomCode)}&email=${encodeURIComponent(userEmail)}`;
  }
  try {
    const url = new URL(BASE_URL);
    const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${url.host}/chat?roomCode=${encodeURIComponent(wsRoomCode)}&email=${encodeURIComponent(userEmail)}`;
  } catch (e) {
    console.error('Failed to parse BASE_URL for WebSocket:', e);
    return `wss://spacehub.monu14.me/chat?roomCode=${encodeURIComponent(wsRoomCode)}&email=${encodeURIComponent(userEmail)}`;
  }
};

const CommunityCenterPanel = ({ community, roomCode, onToggleRightPanel = null, onBack = null, isLocalGroup = false }) => {
  const { user } = useAuth();
  const wsRef = useRef(null);

  const communityId = useMemo(() => community?.id || community?.communityId || community?.community_id, [community]);
  const storageKey = useMemo(() => (communityId ? `welcomeShown:community:${communityId}:channel:general` : ''), [communityId]);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [messages, setMessages] = useState([]);
  const [currentUserRole, setCurrentUserRole] = useState('');
  
  // Helper function to get avatar from session storage
  const getAvatarFromStorage = (email) => {
    if (!email || !communityId) return null;
    try {
      const storageKey = `community_avatars_${communityId}`;
      const avatars = JSON.parse(sessionStorage.getItem(storageKey) || '{}');
      return avatars[email.toLowerCase()] || null;
    } catch {
      return null;
    }
  };

  // Helper function to get username from session storage
  const getUsernameFromStorage = (email) => {
    if (!email || !communityId) return null;
    try {
      const storageKey = `community_usernames_${communityId}`;
      const usernames = JSON.parse(sessionStorage.getItem(storageKey) || '{}');
      return usernames[email.toLowerCase()] || null;
    } catch {
      return null;
    }
  };

  const resolveDisplayName = (identifier, fallback = 'Someone') => {
    if (!identifier || typeof identifier !== 'string') return fallback;
    const normalized = identifier.toLowerCase();
    const stored = getUsernameFromStorage(normalized);
    if (stored) return stored;
    if (identifier.includes('@')) {
      return identifier.split('@')[0];
    }
    return identifier || fallback;
  };
  // Get stored channel selection from sessionStorage to persist across remounts
  const getStoredChannel = () => {
    if (!communityId) return null;
    try {
      const stored = sessionStorage.getItem(`community_selected_channel_${communityId}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to parse stored channel:', e);
    }
    return null;
  };

  const storedChannel = getStoredChannel();
  const [currentRoomCode, setCurrentRoomCode] = useState(roomCode || storedChannel?.roomCode || null);
  const [currentMode, setCurrentMode] = useState(storedChannel?.mode || 'chat'); // 'chat' | 'voice'
  const [currentRoomTitle, setCurrentRoomTitle] = useState(storedChannel?.title || '#general');
  const [localMuted, setLocalMuted] = useState(false);
  const [selectedChannelId, setSelectedChannelId] = useState(storedChannel?.channelId || null);

  const [activeChatRoomCode, setActiveChatRoomCode] = useState(storedChannel?.chatRoomCode || null);
  const [voiceRoomData, setVoiceRoomData] = useState(storedChannel?.voiceRoomData || null); // { janusRoomId, sessionId, handleId, userId }
  const currentWsRoomCodeRef = useRef(null); // Track which room we're connected to (using ref to avoid re-renders)

  // Store channel selection in sessionStorage
  const storeChannelSelection = (channelData) => {
    if (!communityId) return;
    try {
      sessionStorage.setItem(`community_selected_channel_${communityId}`, JSON.stringify(channelData));
    } catch (e) {
      console.error('Failed to store channel selection:', e);
    }
  };

  useEffect(() => {
    const handleChannelSelect = (event) => {
      const { channelId, roomCode: newRoomCode, chatRoomCode, janusRoomId } = event.detail || {};

      if (newRoomCode) setCurrentRoomCode(newRoomCode);
      if (chatRoomCode) setActiveChatRoomCode(chatRoomCode);
      else setActiveChatRoomCode(null);
      
      if (channelId && typeof channelId === 'string') {
        setSelectedChannelId(channelId);
        const parts = channelId.split(':');
        if (parts.length >= 3) {
          const kind = parts[1] === 'voice' ? 'voice' : 'chat';
          const roomTitle = `# ${parts[2]}`;
          setCurrentMode(kind);
          setCurrentRoomTitle(roomTitle);
          
          let voiceData = null;
          if (kind === 'voice' && janusRoomId) {
            const userEmail = user?.email || JSON.parse(sessionStorage.getItem('userData') || '{}')?.email;
            const joinResponseKey = `voiceRoomJoin_${janusRoomId}`;
            const joinResponseStr = sessionStorage.getItem(joinResponseKey);
            
            if (joinResponseStr) {
              try {
                const joinResponse = JSON.parse(joinResponseStr);
                const data = joinResponse?.data || joinResponse;
                voiceData = {
                  janusRoomId,
                  sessionId: data?.sessionId,
                  handleId: data?.handleId,
                  userId: userEmail
                };
              } catch (e) {
                console.error('Failed to parse join response:', e);
                voiceData = null;
              }
            } else {
              // No join response in sessionStorage - automatically join the voice room
              const userEmail = user?.email || JSON.parse(sessionStorage.getItem('userData') || '{}')?.email;
              if (userEmail) {
                // Set initial voiceData with null sessionId/handleId (will be updated after join)
                voiceData = {
                  janusRoomId,
                  sessionId: null,
                  handleId: null,
                  userId: userEmail
                };
                
                // Automatically join the voice room
                (async () => {
                  try {
                    const joinResponse = await joinVoiceRoom(janusRoomId, userEmail);
                    console.log('Auto-joined voice room:', joinResponse);
                    
                    sessionStorage.setItem(joinResponseKey, JSON.stringify(joinResponse));
                    const responseData = joinResponse?.data || joinResponse;
                    const sessionId = responseData?.sessionId;
                    const handleId = responseData?.handleId;
                    
                    if (sessionId && handleId) {
                      const updatedVoiceData = {
                        janusRoomId,
                        sessionId,
                        handleId,
                        userId: userEmail
                      };
                      setVoiceRoomData(updatedVoiceData);
                      
                      window.dispatchEvent(new CustomEvent('voice-room:joined', {
                        detail: { janusRoomId, sessionId, handleId, userId: userEmail }
                      }));
                      
                      // Update stored channel selection with updated voice room data
                      const stored = getStoredChannel();
                      if (stored) {
                        storeChannelSelection({
                          ...stored,
                          voiceRoomData: updatedVoiceData
                        });
                      }
                    }
                  } catch (error) {
                    console.error('Failed to auto-join voice room:', error);
                    if (error.message && !error.message.includes('403')) {
                      window.dispatchEvent(new CustomEvent('toast', {
                        detail: { message: error.message || 'Failed to join voice room', type: 'error' }
                      }));
                    }
                    setVoiceRoomData(null);
                  }
                })();
              } else {
                voiceData = null;
              }
            }
          }
          setVoiceRoomData(voiceData);

          // Store the channel selection
          storeChannelSelection({
            channelId,
            roomCode: newRoomCode || currentRoomCode || roomCode,
            chatRoomCode,
            mode: kind,
            title: roomTitle,
            voiceRoomData: voiceData
          });
        } else if (channelId.startsWith('announcement:')) {
          setCurrentMode('chat');
          setCurrentRoomTitle('# general');
          setActiveChatRoomCode(null);
          setVoiceRoomData(null);
          
          // Store the announcement selection
          storeChannelSelection({
            channelId,
            roomCode: newRoomCode || currentRoomCode || roomCode,
            chatRoomCode: null,
            mode: 'chat',
            title: '# general',
            voiceRoomData: null
          });
        }
      }
    };
    window.addEventListener('community:channel-selected', handleChannelSelect);
    return () => {
      window.removeEventListener('community:channel-selected', handleChannelSelect);
    };
  }, [user?.email, communityId, currentRoomCode, roomCode]);

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        try {
          wsRef.current.close(1000, 'Community center unmounted');
        } catch (error) {
          console.warn('Failed to close community WebSocket on unmount:', error);
        } finally {
          wsRef.current = null;
        }
      }
    };
  }, []);
  
  // Listen for voice room join completion
  useEffect(() => {
    const handleVoiceRoomJoin = (event) => {
      const { janusRoomId, sessionId, handleId, userId } = event.detail || {};
      if (janusRoomId && sessionId && handleId && userId) {
        const voiceData = { janusRoomId, sessionId, handleId, userId };
        setVoiceRoomData(voiceData);
        
        // Update stored channel selection with updated voice room data
        const stored = getStoredChannel();
        if (stored) {
          storeChannelSelection({
            ...stored,
            voiceRoomData: voiceData
          });
        }
      }
    };
    
    window.addEventListener('voice-room:joined', handleVoiceRoomJoin);
    return () => {
      window.removeEventListener('voice-room:joined', handleVoiceRoomJoin);
    };
  }, [communityId]);

  useEffect(() => {
    if (currentMode !== 'chat') {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      currentWsRoomCodeRef.current = null;
      setMessages([]);
      return;
    }
    
    const userEmail = user?.email || JSON.parse(sessionStorage.getItem('userData') || '{}')?.email || '';
    const activeRoomCode = currentRoomCode || roomCode;
    if (!userEmail || !activeRoomCode) return;

    const wsRoomCode = activeChatRoomCode || activeRoomCode;
    
    // Don't reconnect if already connected to the same room
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && currentWsRoomCodeRef.current === wsRoomCode) {
      return;
    }
    
    // Don't create new connection if already connecting to the same room
    if (wsRef.current && wsRef.current.readyState === WebSocket.CONNECTING && currentWsRoomCodeRef.current === wsRoomCode) {
      return;
    }
    
    const wsUrl = getWsCommunityChatUrl(wsRoomCode, userEmail);
    
    // Only clear messages when switching to a different room
    if (currentWsRoomCodeRef.current !== wsRoomCode) {
      setMessages([]);
    }
    
    // Close existing connection if switching rooms
    if (wsRef.current && currentWsRoomCodeRef.current !== wsRoomCode) {
      try {
        wsRef.current.close();
      } catch (e) {
        console.warn('Error closing existing WebSocket:', e);
      }
      wsRef.current = null;
    }
    
    try {
      if (!activeChatRoomCode) {
        joinRoom(activeRoomCode, userEmail)
          .catch(() => {})
          .finally(() => {
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;
            currentWsRoomCodeRef.current = wsRoomCode;
            setupWebSocket(ws, wsRoomCode);
          });
      } else {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;
        currentWsRoomCodeRef.current = wsRoomCode;
        setupWebSocket(ws, wsRoomCode);
      }
    } catch (e) {
      console.error('Failed to create WebSocket:', e);
      currentWsRoomCodeRef.current = null;
    }

    return () => {
      // Only cleanup if switching to a different room or unmounting
      if (wsRef.current && currentWsRoomCodeRef.current !== wsRoomCode) {
        try {
          wsRef.current.close();
        } catch (e) {
          console.warn('Error closing WebSocket in cleanup:', e);
        }
        wsRef.current = null;
        currentWsRoomCodeRef.current = null;
      }
    };
  }, [currentRoomCode, roomCode, currentMode, user?.email, activeChatRoomCode]);

  const setupWebSocket = (ws, roomCodeForLog) => {
    const userEmail = user?.email || JSON.parse(sessionStorage.getItem('userData') || '{}')?.email || '';

    ws.onopen = () => {
      console.log('WebSocket connected to room:', roomCodeForLog);
    };

    const normalizedUserEmail = userEmail ? userEmail.toLowerCase() : '';

    const processJoinAnnouncement = (rawText, metadata = {}) => {
      if (!rawText) return false;
      const trimmed = rawText.trim();
      if (!/(joined the chat|joined the voice room)$/i.test(trimmed)) {
        return false;
      }

      const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
      const emailMatch = trimmed.match(emailRegex);
      const joinEmail = emailMatch ? emailMatch[0].toLowerCase() : null;
      const isSelf = joinEmail && normalizedUserEmail && joinEmail === normalizedUserEmail;
      const identifier = joinEmail || trimmed.replace(/joined the (chat|voice room)/i, '').trim();
      const storedName = joinEmail ? getUsernameFromStorage(joinEmail) : null;
      const displayName = storedName || metadata.senderName || metadata.username || resolveDisplayName(identifier, 'Someone');
      const isVoiceAnnouncement = /joined the voice room$/i.test(trimmed);
      const suffix = isVoiceAnnouncement ? 'joined the voice room' : 'joined the chat';
      const messageText = `${displayName} ${suffix}`;
      const createdAt = metadata.timestamp || metadata.createdAt || new Date().toISOString();
      const messageId = metadata.id || `system-${isVoiceAnnouncement ? 'voice' : 'chat'}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      setMessages((prev) => {
        const createdTs = new Date(createdAt).getTime();
        if (prev.some((msg) => {
          if (msg.type !== 'system' || msg.text !== messageText) return false;
          const msgTs = new Date(msg.createdAt).getTime();
          return Math.abs(msgTs - createdTs) < 2000;
        })) {
          return prev;
        }
        const updated = [
          ...prev,
          {
            id: messageId,
            type: 'system',
            systemVariant: isVoiceAnnouncement ? 'voice-join' : 'chat-join',
            text: messageText,
            createdAt,
          },
        ];
        updated.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        return updated;
      });

      if (!isSelf) {
        window.dispatchEvent(new CustomEvent('toast', {
          detail: { message: messageText, type: 'info' }
        }));
      }

      return true;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
                if (data?.type === 'history' || data?.history || (Array.isArray(data) && data.length > 0 && data[0]?.senderEmail)) {
          const historyArray = data?.type === 'history' 
            ? (data.messages || data.history || [])
            : (Array.isArray(data) ? data : []);
          
          if (Array.isArray(historyArray) && historyArray.length > 0) {
            const historyMessages = historyArray
              .map((msg, index) => {
                const senderEmail = msg?.senderEmail || msg?.email || msg?.sender || '';
                const timestamp = msg?.timestamp || msg?.createdAt || msg?.sentAt || msg?.time || new Date().toISOString();
                const senderName = msg?.senderName || msg?.author || msg?.username || '';
                
           
                const storedUsername = getUsernameFromStorage(senderEmail);
                const displayName = senderName || storedUsername || (senderEmail ? senderEmail.split('@')[0] : 'Unknown');
                
               
                const storedAvatar = getAvatarFromStorage(senderEmail);
                const avatar = storedAvatar || msg?.avatar || msg?.avatarUrl || msg?.avatarPreviewUrl || msg?.profileImage || '/avatars/avatar-1.png';
                
          
                if (msg?.type === 'FILE' || msg?.fileUrl || msg?.file_url) {
                  const fileUrl = msg?.fileUrl || msg?.file_url || '';
                  const fileName = msg?.fileName || msg?.file_name || msg?.text || 'file';
                  const contentType = msg?.contentType || msg?.content_type || '';
                  
          
                  const isImageFile = (contentType, fileName) => {
                    if (contentType) {
                      return contentType.startsWith('image/');
                    }
                    if (fileName) {
                      const ext = fileName.toLowerCase().split('.').pop();
                      return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext);
                    }
                    return false;
                  };
                  
                  const isImage = isImageFile(contentType, fileName);
                  
                  return {
                    id: msg?.id || msg?.messageId || msg?._id || `history-file-${index}-${timestamp}`,
                    author: displayName,
                    email: senderEmail,
                    text: fileName,
                    createdAt: timestamp,
                    avatar: avatar,
                    isSelf: senderEmail && senderEmail.toLowerCase() === userEmail.toLowerCase(),
                    images: isImage ? [fileUrl] : [],
                    fileUrl: fileUrl,
                    fileName: fileName,
                    contentType: contentType,
                    isFile: true,
                    isImage: isImage
                  };
                }
                
                // Regular text message
                const content = msg?.content || msg?.message || msg?.text || '';
                
                return {
                  id: msg?.id || msg?.messageId || msg?._id || `history-${index}-${timestamp}`,
                  author: displayName,
                  email: senderEmail,
                  text: content,
                  createdAt: timestamp,
                  avatar: avatar,
                  isSelf: senderEmail && senderEmail.toLowerCase() === userEmail.toLowerCase(),
                  images: Array.isArray(msg?.images) ? msg.images : (msg?.image ? [msg.image] : []),
                };
              })
              .filter(msg => msg.text || (msg.images && msg.images.length > 0) || msg.isFile)
              .sort((a, b) => {
                const timeA = new Date(a.createdAt).getTime();
                const timeB = new Date(b.createdAt).getTime();
                return timeA - timeB;
              });
            
            console.log('Received chat history:', historyMessages.length, 'messages');
            setMessages(historyMessages);
            return;
          }
        }
                const isLegacy = typeof data?.message === 'string';
        const isTyped = data?.type === 'message' || data?.type === 'chat';
        if (isLegacy || isTyped) {
          const text = isLegacy ? data.message : (data.text || data.content || '');
          if (typeof text === 'string' && processJoinAnnouncement(text, data)) {
            return;
          }
          const senderEmail = data.senderEmail || data.email || '';
          
          const storedUsername = getUsernameFromStorage(senderEmail);
          const displayName = data.author || data.username || data.senderName || storedUsername || (senderEmail ? senderEmail.split('@')[0] : 'Unknown');
          
          const storedAvatar = getAvatarFromStorage(senderEmail);
          const avatar = storedAvatar || data.avatar || data.avatarUrl || data.avatarPreviewUrl || '/avatars/avatar-1.png';
          
          const receivedMsg = {
            id: data.id || `m-${Date.now()}-${Math.random()}`,
            author: displayName,
            email: senderEmail,
            text,
            createdAt: data.timestamp || data.createdAt || new Date().toISOString(),
            avatar: avatar,
            isSelf: senderEmail && senderEmail.toLowerCase() === userEmail.toLowerCase(),
            images: Array.isArray(data.images) ? data.images : [],
          };
          
          setMessages((prev) => {
            // Check if message already exists to avoid duplicates
            const existingIndex = prev.findIndex(m => {
              // Check by ID if available
              if (receivedMsg.id && m.id === receivedMsg.id) return true;
              // Check by text, email, and timestamp (within 3 seconds)
              if (m.text === receivedMsg.text && m.email === receivedMsg.email) {
                const timeDiff = Math.abs(new Date(m.createdAt).getTime() - new Date(receivedMsg.createdAt).getTime());
                if (timeDiff < 3000) {
                  // Also check if images match (if both have images)
                  const mImages = Array.isArray(m.images) ? m.images : [];
                  const receivedImages = Array.isArray(receivedMsg.images) ? receivedMsg.images : [];
                  if (mImages.length === 0 && receivedImages.length === 0) return true;
                  if (mImages.length === receivedImages.length && mImages.length > 0) {
                    // Check if image arrays match
                    const imagesMatch = mImages.every((img, idx) => img === receivedImages[idx]);
                    if (imagesMatch) return true;
                  }
                  // If text matches and within time window, consider it duplicate even if images differ slightly
                  return true;
                }
              }
              return false;
            });
            
            if (existingIndex !== -1) {
              const existing = prev[existingIndex];
              // Replace optimistic message (temp ID) with server message (real ID)
              if (existing.id?.startsWith('temp-') && receivedMsg.id && !receivedMsg.id.startsWith('temp-')) {
                console.log('Replacing optimistic message with server message');
                const updated = [...prev];
                updated[existingIndex] = receivedMsg;
                return updated.sort((a, b) => {
                  const timeA = new Date(a.createdAt).getTime();
                  const timeB = new Date(b.createdAt).getTime();
                  return timeA - timeB;
                });
              }
              console.log('Message already exists, skipping duplicate');
              return prev;
            }
            
            const updated = [...prev, receivedMsg];
            return updated.sort((a, b) => {
              const timeA = new Date(a.createdAt).getTime();
              const timeB = new Date(b.createdAt).getTime();
              return timeA - timeB;
            });
          });
        }
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      
    };

    ws.onclose = (event) => {
      console.log('WebSocket disconnected', event.code, event.reason);
      
     
      const userEmail = user?.email || JSON.parse(sessionStorage.getItem('userData') || '{}')?.email || '';
      const activeRoomCode = currentRoomCode || roomCode;
      const wsRoomCode = activeChatRoomCode || activeRoomCode;
      
      if (event.code !== 1000 && userEmail && wsRoomCode && currentMode === 'chat') {
        console.log('Attempting to reconnect WebSocket for community chat...');
        setTimeout(() => {
          // Only reconnect if we're still supposed to be connected to this room
          if (userEmail && wsRoomCode && currentMode === 'chat' && currentWsRoomCodeRef.current === wsRoomCode && (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED)) {
            try {
              const wsUrl = getWsCommunityChatUrl(wsRoomCode, userEmail);
              const newWs = new WebSocket(wsUrl);
              wsRef.current = newWs;
              currentWsRoomCodeRef.current = wsRoomCode;
              setupWebSocket(newWs, wsRoomCode);
            } catch (e) {
              console.error('Failed to reconnect WebSocket:', e);
            }
          }
        }, 10000);
      } else {
        // If it was a normal close, clear the ref
        if (event.code === 1000) {
          currentWsRoomCodeRef.current = null;
        }
      }
    };
  };

  useEffect(() => {
    const checkAdminAndMaybeShow = async () => {
      if (!communityId || !user?.email) return;
      if (isLocalGroup) return;

      try {
        const data = await getCommunityMembers(communityId);

        const members = data?.data?.members || data?.members || [];
        const me = members.find((m) => (m.email || m.username) === user.email);
        const myRole = (me?.role || '').toUpperCase();
        setCurrentUserRole(myRole);

        const seen = localStorage.getItem(storageKey);
        if (seen === '1') return;

        if (myRole === 'ADMIN') {
          setShowWelcomeModal(true);
        }
      } catch (e) {
        console.error('Failed to decide welcome modal visibility:', e);
      }
    };

    checkAdminAndMaybeShow();
  }, [communityId, user?.email, storageKey, isLocalGroup]);

  const closeWelcomeModal = () => {
    setShowWelcomeModal(false);
    try {
      if (storageKey) localStorage.setItem(storageKey, '1');
    } catch {}
  };

  const openInviteModal = () => {
    closeWelcomeModal();
    try {
      window.dispatchEvent(new Event('community:open-invite'));
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Invite people to your community', type: 'info' } }));
    } catch (e) {
      console.error('Failed to open invite modal:', e);
    }
  };

  const startConversation = () => {
    closeWelcomeModal();
  };

  return (
    <div className="flex-1 min-w-0 bg-white h-full flex flex-col rounded-xl border border-gray-500 overflow-hidden md:bg-white">
      {currentMode === 'voice' ? (
        <VoiceRoomWithWebRTC
          key={`voice-room-${voiceRoomData?.janusRoomId || 'none'}-${selectedChannelId || 'no-channel'}`}
          title={currentRoomTitle}
          voiceRoomData={voiceRoomData}
          communityId={communityId}
          onBack={onBack}
        />
      ) : (
        <ChatRoom
          key={`${currentRoomCode || 'no-room'}-${currentRoomTitle}`}
          title={currentRoomTitle}
          currentUser={{ email: user?.email, username: user?.username, avatarUrl: JSON.parse(sessionStorage.getItem('userData') || '{}')?.avatarUrl }}
          messages={messages}
          isGroupChat={true}
          onToggleRightPanel={onToggleRightPanel}
          onBack={onBack}
          isReadOnly={(() => {
            // Check if we're in the general room of Announcement group
            const isGeneralAnnouncementRoom = selectedChannelId === 'announcement:general' || 
                                             (currentRoomTitle === '# general' && selectedChannelId?.startsWith('announcement:'));
            return isGeneralAnnouncementRoom && currentUserRole !== 'ADMIN';
          })()}
          onSend={async (msg) => {
            // Check if we're in the general room of Announcement group
            const isGeneralAnnouncementRoom = selectedChannelId === 'announcement:general' || 
                                             (currentRoomTitle === '# general' && selectedChannelId?.startsWith('announcement:'));
            
            if (isGeneralAnnouncementRoom && currentUserRole !== 'ADMIN') {
              window.dispatchEvent(new CustomEvent('toast', {
                detail: { message: 'Only admins can send messages in the general announcement room', type: 'error' }
              }));
              return;
            }
            
            try {
              if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                if (Array.isArray(msg.attachments) && msg.attachments.length > 0) {
                  const fileMessages = msg.attachments
                    .filter(att => att.s3Url && !att.uploading)
                    .map(att => ({
                      type: 'FILE',
                      fileName: att.fileName || att.file?.name || 'file',
                      fileUrl: att.s3Url,
                      contentType: att.contentType || att.file?.type || 'application/octet-stream'
                    }));
                  
                  // Send file messages first
                  for (const fileMsg of fileMessages) {
                    wsRef.current.send(JSON.stringify(fileMsg));
                  }
                }
                
                if (msg.text && msg.text.trim()) {
                  const payload = { message: msg.text };
                  if (Array.isArray(msg.images) && msg.images.length > 0) {
                    const out = [];
                    for (const url of msg.images) {
                      try {
                        const res = await fetch(url);
                        const blob = await res.blob();
                        const reader = new FileReader();
                        const dataUrl = await new Promise((resolve, reject) => {
                          reader.onload = () => resolve(reader.result);
                          reader.onerror = reject;
                          reader.readAsDataURL(blob);
                        });
                        out.push(dataUrl);
                      } catch (err) {
                        console.error('Failed to process image:', err);
                      }
                    }
                    if (out.length > 0) payload.images = out;
                  }
                  wsRef.current.send(JSON.stringify(payload));
                }
              }
            } catch (err) {
              console.error('Failed to send message:', err);
            }

          }}
        />
      )}

      {showWelcomeModal && currentMode === 'chat' && currentRoomTitle === '# general' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
          <div className="bg-[#282828] text-white rounded-xl p-6 w-[min(90%,560px)] shadow-2xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-semibold">Welcome</h3>
              <button onClick={closeWelcomeModal} className="text-white/80 hover:text-white" title="Close">✕</button>
        </div>
            <h2 className="text-2xl font-bold text-center">Welcome to</h2>
            <p className="mt-1 text-lg font-semibold text-center">{currentRoomTitle}</p>
          <div className="mt-6 space-y-3 text-gray-900">
              <button onClick={openInviteModal} className="w-full bg-white rounded-md px-4 py-3 flex items-center justify-between">
              <span>Invite your friends</span>
              <span>›</span>
            </button>
              <button onClick={startConversation} className="w-full bg-white rounded-md px-4 py-3 flex items-center justify-between">
              <span>Send hey to start the convo!</span>
              <span>›</span>
            </button>
          </div>
            <div className="mt-6 flex justify-end">
              <button onClick={closeWelcomeModal} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md">Got it</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Voice Room Component with WebRTC
function VoiceRoomWithWebRTC({ title, voiceRoomData, communityId, onBack = null }) {
  const hasConnectionParams = Boolean(
    voiceRoomData &&
    voiceRoomData.janusRoomId &&
    voiceRoomData.sessionId &&
    voiceRoomData.handleId &&
    voiceRoomData.userId
  );
  const [callActive, setCallActive] = React.useState(hasConnectionParams);
  const [callEnded, setCallEnded] = React.useState(false);
  const [hasConnectedOnce, setHasConnectedOnce] = React.useState(false);
  const previousJanusRoomIdRef = React.useRef(voiceRoomData?.janusRoomId);

  React.useEffect(() => {
    const currentJanusRoomId = voiceRoomData?.janusRoomId;
    const previousJanusRoomId = previousJanusRoomIdRef.current;
    
    // If janusRoomId changed, reset state before setting new values
    if (previousJanusRoomId && currentJanusRoomId && previousJanusRoomId !== currentJanusRoomId) {
      // Room changed - reset state
      setCallActive(false);
      setCallEnded(false);
      setHasConnectedOnce(false);
      
      // Update ref
      previousJanusRoomIdRef.current = currentJanusRoomId;
      
      // Small delay to allow cleanup, then activate if we have connection params
      const timer = setTimeout(() => {
        if (hasConnectionParams) {
          setCallActive(true);
        }
      }, 100);
      return () => clearTimeout(timer);
    } else {
      // Normal state update when connection params change (but room hasn't changed)
      previousJanusRoomIdRef.current = currentJanusRoomId;
      if (hasConnectionParams) {
        setCallActive(true);
        setCallEnded(false);
        setHasConnectedOnce(false);
      } else {
        setCallActive(false);
        setCallEnded(false);
        setHasConnectedOnce(false);
      }
    }
  }, [
    hasConnectionParams,
    voiceRoomData?.janusRoomId,
    voiceRoomData?.sessionId,
    voiceRoomData?.handleId,
    voiceRoomData?.userId
  ]);

  const enabled = hasConnectionParams && callActive;

  const {
    isConnected, participants, isMuted, error, toggleMute, leave
  } = useVoiceRoom(
    voiceRoomData?.janusRoomId,
    voiceRoomData?.sessionId,
    voiceRoomData?.handleId,
    voiceRoomData?.userId,
    enabled,
    communityId
  );

  React.useEffect(() => {
    if (enabled && isConnected) {
      setHasConnectedOnce(true);
      setCallEnded(false);
    }
  }, [enabled, isConnected]);

  React.useEffect(() => {
    if (!callActive && hasConnectedOnce) {
      setCallEnded(true);
    }
  }, [callActive, hasConnectedOnce]);

  React.useEffect(() => {
    return () => {
      leave();
    };
  }, [leave]);

  // Helper function to get avatar from session storage
  const getAvatarFromStorage = (email) => {
    if (!email || !communityId) return null;
    try {
      const storageKey = `community_avatars_${communityId}`;
      const avatars = JSON.parse(sessionStorage.getItem(storageKey) || '{}');
      return avatars[email.toLowerCase()] || null;
    } catch {
      return null;
    }
  };

  const getUsernameFromStorage = (email) => {
    if (!email || !communityId) return null;
    try {
      const storageKey = `community_usernames_${communityId}`;
      const usernames = JSON.parse(sessionStorage.getItem(storageKey) || '{}');
      return usernames[email.toLowerCase()] || null;
    } catch {
      return null;
    }
  };

  const enrichedParticipants = React.useMemo(() => {
    return participants.map((p) => {
      const userId = p.userId || p.email || '';
      const storedAvatar = getAvatarFromStorage(userId);
      const storedUsername = getUsernameFromStorage(userId);
      const displayName = p.name || storedUsername || (userId ? userId.split('@')[0] : 'Member');
      return {
        ...p,
        avatarUrl: storedAvatar || p.avatarUrl || '/avatars/avatar-1.png',
        name: displayName,
        email: userId
      };
    });
  }, [participants, communityId]);

  React.useEffect(() => {
    if (error) {
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: error, type: 'error' }
      }));
    }
  }, [error]);

  const handleLeave = () => {
    leave();
    setCallActive(false);
    setCallEnded(true);
    setHasConnectedOnce(true);
    try {
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: 'Call has ended', type: 'info' }
      }));
    } catch {}
    if (onBack && typeof window !== 'undefined' && window.innerWidth <= 640) {
      setTimeout(() => {
        onBack();
      }, 100);
    }
  };

  const handleStartCall = () => {
    setCallEnded(false);
    setCallActive(true);
  };

  return (
    <VoiceRoom
      title={title}
      participants={enrichedParticipants}
      localMuted={isMuted}
      isConnected={isConnected}
      callActive={callActive}
      callEnded={callEnded}
      onToggleMute={toggleMute}
      onLeave={handleLeave}
      onStartCall={handleStartCall}
      onBack={onBack} />
  );
}

export default CommunityCenterPanel;
