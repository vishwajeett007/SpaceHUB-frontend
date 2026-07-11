import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getMyCommunities, getAllLocalGroups, getChatHistory, BASE_URL } from '../../../shared/services/API';
import { useAuth } from '../../../shared/contexts/AuthContextContext';
import ChatRoom from './chatRoom/Chatroom';

const formatFriendName = (friend) => {
  if (friend.username) {
    return friend.username;
  }
  return 'Unknown';
};
import {
  selectCommunities,
  selectLocalGroups,
  selectActiveTab,
  selectDashboardLoading,
  selectDashboardError,
  setCommunities,
  setLocalGroups,
  setActiveTab,
  setLoading,
  setError,
} from '../../../shared/store/slices/dashboardSlice';
import { setSelectedFriend } from '../../../shared/store/slices/uiSlice';

const getWsDirectChatUrl = (sender, receiver) => {
  if (!BASE_URL) {
    return `wss://spacehub.monu14.me/ws/direct-chat?senderEmail=${encodeURIComponent(sender)}&receiverEmail=${encodeURIComponent(receiver)}`;
  }
  try {
    const url = new URL(BASE_URL);
    const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${url.host}/ws/direct-chat?senderEmail=${encodeURIComponent(sender)}&receiverEmail=${encodeURIComponent(receiver)}`;
  } catch (e) {
    console.error('Failed to parse BASE_URL for WebSocket:', e);
    return `wss://spacehub.monu14.me/ws/direct-chat?senderEmail=${encodeURIComponent(sender)}&receiverEmail=${encodeURIComponent(receiver)}`;
  }
};

const DashboardMainSection = ({ selectedFriend, onOpenAddFriends, showRightSidebar }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useAuth();
  
  const activeTab = useSelector(selectActiveTab);
  const loading = useSelector(selectDashboardLoading);
  const error = useSelector(selectDashboardError);
  const communities = useSelector(selectCommunities);
  const localGroups = useSelector(selectLocalGroups);
  
  // Direct chat state - moved outside conditional
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [expandedMessageIds, setExpandedMessageIds] = useState({});
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [wsStatus, setWsStatus] = useState('not-connected'); // 'connecting', 'connected', 'not-connected'
  
  const fileInputRef = useRef(null);
  const messageInputRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const wsRef = useRef(null);
  
  const storedEmail = JSON.parse(sessionStorage.getItem('userData') || '{}')?.email || '';
  const userEmail = user?.email || storedEmail;
  
  const emojis = useMemo(() => ['😊', '😂', '🎉', '🔥', '👍', '❤️'], []);
  
  const friendEmail = selectedFriend?.email;

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        try {
          wsRef.current.close(1000, 'Dashboard main section unmounted');
        } catch (error) {
          console.warn('Failed to close direct chat WebSocket on unmount:', error);
        } finally {
          wsRef.current = null;
        }
      }
    };
  }, []);
 
  
  const sortMessagesByTime = useCallback((messages) => {
    return [...messages].sort(
      (a, b) => {
        const timeA = new Date(a.createdAt || a.timestamp || 0).getTime();
        const timeB = new Date(b.createdAt || b.timestamp || 0).getTime();
        return timeA - timeB;
      }
    );
  }, []);


  const safeUrl = (rawUrl) => {
    if (!rawUrl) return '';

    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
      return rawUrl;
    }
    const absolute = `${BASE_URL}${rawUrl}`;
    try { return encodeURI(absolute); } catch { return absolute; }
  };

  const fetchCommunities = useCallback(async () => {
    dispatch(setLoading(true));
    dispatch(setError(''));
    
    const storedEmail = JSON.parse(sessionStorage.getItem('userData') || '{}')?.email || '';
    const userEmail = user?.email || storedEmail;
    
    if (!userEmail) {
      dispatch(setError('User email not found'));
      dispatch(setLoading(false));
      return;
    }
    
    try {
      const res = await getMyCommunities(userEmail);
      const list = res?.data?.communities || res?.communities || res?.data || [];
      dispatch(setCommunities(list));
    } catch (e) {
      const errorMsg = e.message || 'Failed to load communities';
      dispatch(setError(errorMsg));
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: errorMsg, type: 'error' }
      }));
    }
  }, [user, dispatch]);

  const fetchLocalGroups = useCallback(async () => {
    dispatch(setLoading(true));
    dispatch(setError(''));
    
    const storedEmail = JSON.parse(sessionStorage.getItem('userData') || '{}')?.email || '';
    const userEmail = user?.email || storedEmail;
    
    if (!userEmail) {
      dispatch(setError('User email not found'));
      dispatch(setLoading(false));
      return;
    }
    
    try {
      const res = await getAllLocalGroups(userEmail);
      const list = res?.data?.groups || res?.groups || res?.data || res?.rooms || [];
      dispatch(setLocalGroups(list));
    } catch (e) {
      const errorMsg = e.message || 'Failed to load local groups';
      dispatch(setError(errorMsg));
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: errorMsg, type: 'error' }
      }));
    }
  }, [user, dispatch]);

  const hasLoadedRef = useRef({ community: false, localGroups: false });

  useEffect(() => {
    if (activeTab === 'Community') {
     
      fetchCommunities();
      hasLoadedRef.current.community = true;
    } else {
     
      fetchLocalGroups();
      hasLoadedRef.current.localGroups = true;
    }
  }, [activeTab, fetchCommunities, fetchLocalGroups]);

  useEffect(() => {
    const onRefreshCommunities = () => fetchCommunities();
    const onRefreshLocalGroups = () => fetchLocalGroups();
    window.addEventListener('refresh:communities', onRefreshCommunities);
    window.addEventListener('refresh:local-groups', onRefreshLocalGroups);
    return () => {
      window.removeEventListener('refresh:communities', onRefreshCommunities);
      window.removeEventListener('refresh:local-groups', onRefreshLocalGroups);
    };
  
  }, [fetchCommunities, fetchLocalGroups]);


  const ListCard = ({ item, onSelect }) => {
    const rawUrl = item.imageUrl || item.bannerUrl || item.imageURL || '';
    const title = item.name || 'Untitled';
    const description = item.description || '';
    const imgSrc = safeUrl(rawUrl);
    const members = item.memberCount ?? item.totalMembers ?? item.members ?? 0;
    const online = item.onlineMembers || item.online || 0;
    const [imageError, setImageError] = useState(false);
    const isCommunity = activeTab === 'Community';
    const isLocalGroup = activeTab === 'Local-Groups';
    const showMembers = members !== null && members !== undefined;
    
    useEffect(() => {
      setImageError(false);
    }, [imgSrc]);

    return (
      <button onClick={() => onSelect(item)} className="text-left w-full">
        {/* Mobile Design - White card with light gray border */}
        <div className="md:hidden flex items-center gap-3 bg-white rounded-lg border border-gray-200 p-3 hover:bg-gray-50 transition-colors">
          {/* Left - Square Image */}
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
            {imgSrc && !imageError ? (
              <img 
                src={imgSrc} 
                alt={title} 
                referrerPolicy="no-referrer" 
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <div className="text-xl font-bold text-gray-400">
                  {title.charAt(0).toUpperCase()}
                </div>
              </div>
            )}
          </div>
          
          {/* Middle - Title and Description */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-gray-900 mb-1 truncate">{title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">{description || 'No description'}</p>
          </div>
          
          {/* Right - Members and Online Status */}
          {showMembers && (
            <div className="flex-shrink-0 text-right">
              <div className="text-xs text-gray-600 mb-1 flex items-center gap-1 justify-end">
                <img src="/icons/user-friends.svg" alt="Members" className="w-4 h-4" />
                <span>Members: {members}</span>
              </div>
            </div>
          )}
        </div>

        <div className="hidden md:flex items-stretch rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow transform transition-transform hover:scale-[1.02] w-full">
          <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-l-xl overflow-hidden bg-zinc-400 flex-shrink-0">
            {imgSrc && !imageError ? (
              <img 
                src={imgSrc} 
                alt={title} 
                referrerPolicy="no-referrer" 
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full bg-zinc-400 flex items-center justify-center">
                <div className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800">
                  {title.charAt(0).toUpperCase()}
                </div>
              </div>
            )}
          </div>
          
          {/* Right Section - Content */}
          <div className="flex-1 min-w-0 bg-[#282828] text-white rounded-r-xl p-3 sm:p-4 relative">
            {/* Member Status - Top Right */}
            {showMembers && (
              <div className="absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4 text-right text-xs sm:text-sm">
                <div className="text-gray-300 flex items-center gap-1 justify-end">
                  <img src="/icons/user-friends.svg" alt="Members" className="w-4 h-4" />
                  <span>Members: {members}</span>
                </div>
              </div>
            )}
            
            {/* Title and Description */}
            <div className={isCommunity ? "" : "pr-16 sm:pr-20 md:pr-24 lg:pr-32"}>
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-1 sm:mb-2">{title}</h3>
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed line-clamp-1">{description}</p>
          </div>
          </div>
        </div>
      </button>
    );
  };

  const handleSelectCommunity = (item) => {
    const itemId = item.id || item.communityId || item.community_id || item.groupId || item.roomId;
    if (!itemId) {
      console.error('No ID found for item:', item);
      return;
    }
    const idString = String(itemId);
    if (activeTab === 'Community') {
      navigate(`/dashboard/community/${idString}`);
    } else {
      navigate(`/dashboard/local-group/${idString}`);
    }
  };

  const renderList = (items, emptyTitle, emptySub) => {
    if (loading) {
      return (
        <div className="w-full flex flex-col gap-3">
          {/* Mobile Skeleton */}
          <div className="md:hidden space-y-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 p-3">
                <div className="w-16 h-16 rounded-lg bg-gray-200 animate-pulse" />
                <div className="flex-1 min-w-0">
                  <div className="h-4 w-32 bg-gray-200 rounded mb-2 animate-pulse" />
                  <div className="h-3 w-full bg-gray-200 rounded mb-1 animate-pulse" />
                  <div className="h-3 w-3/4 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="flex-shrink-0 text-right">
                  <div className="h-3 w-16 bg-gray-200 rounded mb-1 animate-pulse" />
                  <div className="h-3 w-12 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
          {/* Desktop Skeleton */}
          <div className="hidden md:block">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="w-full">
              <div className="flex items-stretch rounded-xl overflow-hidden w-full">
                {/* Left shimmer */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 bg-zinc-300 animate-pulse rounded-l-xl" />
                {/* Right shimmer */}
                <div className="flex-1 min-w-0 bg-[#282828] rounded-r-xl p-3 sm:p-4 relative">
                  <div className="absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4 text-right">
                    <div className="h-3 w-20 bg-gray-500/40 rounded mb-1 animate-pulse" />
                    <div className="h-3 w-16 bg-green-500/40 rounded animate-pulse" />
                  </div>
                  <div className="pr-16 sm:pr-20 md:pr-24 lg:pr-32">
                    <div className="h-5 sm:h-6 w-40 bg-gray-500/60 rounded mb-2 animate-pulse" />
                    <div className="h-3 w-5/6 bg-gray-500/40 rounded mb-1 animate-pulse" />
                    <div className="h-3 w-3/5 bg-gray-500/30 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          ))}
          </div>
        </div>
      );
    }
    if (error) return <div className="text-red-600">{error}</div>;
    if (!items.length) {
      return (
        <div className="text-center py-8">
          <h2 className="text-xl md:text-3xl font-bold text-gray-800 mb-2 md:mb-4">{emptyTitle}</h2>
          <p className="text-sm md:text-lg text-gray-600 max-w-md mx-auto px-4">{emptySub}</p>
        </div>
      );
    }
    return (
      <div className="w-full flex flex-col gap-3">
        {items.map((it) => (
          <ListCard 
            key={it.id || it.groupId || it.roomId || it.communityId || it.name} 
            item={it}
            onSelect={handleSelectCommunity}
          />
        ))}
      </div>
    );
  };


  // WebSocket connection for direct messaging
  useEffect(() => {
    if (!friendEmail || !userEmail) {
      setMessages([]);
      setLoadingMessages(false);
      // Close WebSocket if no friend selected
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
        setWsConnected(false);
      }
      return;
    }

    let cancelled = false;
    const friendName = formatFriendName(selectedFriend || {});
    const friendAvatar = selectedFriend?.avatar || selectedFriend?.avatarUrl || selectedFriend?.profileImage || '/avatars/avatar-1.png';
    const selfAvatar = user?.avatarUrl || '/avatars/avatar-1.png';

    const loadHistory = async () => {
      setLoadingMessages(true);
      try {
        const response = await getChatHistory(userEmail, friendEmail);
        const rawMessages = response?.data || response?.messages || response?.history || response?.chat || response || [];

        if (cancelled) return;

        const normalized = Array.isArray(rawMessages)
          ? rawMessages
              .filter((msg, idx, arr) => {
                if (msg.type && msg.type.toUpperCase() === 'CONFIRM') {
                  return false;
                }
            
                if (msg.messageId === null && msg.optimistic === true) {
                  return false;
                }

                if (msg.messageUuid) {
                  const firstIndex = arr.findIndex(m => m.messageUuid === msg.messageUuid);
                  if (firstIndex !== idx) {
                    return false; 
                  }
                }
                return true;
              })
              .map((msg, idx) => {
              const senderEmail = msg.senderEmail || msg.sender || msg.from || msg.userEmail || msg.email || '';
              const timestamp = msg.timestamp || msg.createdAt || msg.sentAt || msg.time || new Date().toISOString();
              const isSelf = senderEmail && senderEmail.toLowerCase() === userEmail.toLowerCase();
              
              // Handle FILE type messages
              if (msg.type === 'FILE' || msg.fileUrl || msg.fileKey) {
                const fileKey = msg.fileKey || msg.file_key || '';
                const fileUrl = msg.fileUrl || msg.file_url || '';
                // Use fileKey if available, otherwise fall back to fileUrl
                const fileIdentifier = fileKey || fileUrl;
                const fileName = msg.fileName || msg.file_name || msg.text || 'file';
                const contentType = msg.contentType || msg.content_type || '';
                
                // Check if file is an image
                const isImage = contentType?.startsWith('image/') || 
                  ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(
                    fileName?.toLowerCase().split('.').pop()
                  );
                
                return {
                  id: msg.id || msg.messageId || msg._id || `history-file-${idx}`,
                  messageUuid: msg.messageUuid,
                  author: isSelf ? (user?.username || userEmail) : friendName,
                  email: senderEmail,
                  text: fileName,
                  createdAt: timestamp,
                  avatar: isSelf ? selfAvatar : friendAvatar,
                  isSelf,
                  images: isImage ? [fileIdentifier] : [],
                  fileKey: fileKey || null,
                  fileUrl: fileUrl || null,
                  fileName: fileName,
                  contentType: contentType,
                  isFile: true,
                  isImage: isImage
                };
              }
              
              // Regular text message
              const text = msg.content || msg.message || msg.text || '';
              const rawImages = Array.isArray(msg.images)
                ? msg.images
                : msg.image
                  ? [msg.image]
                  : [];

              const resolvedImages = rawImages.map((img) => safeUrl(img));

              return {
                id: msg.id || msg.messageId || msg._id || `history-${idx}`,
                messageUuid: msg.messageUuid,
                author: isSelf ? (user?.username || userEmail) : friendName,
                email: senderEmail,
                text,
                createdAt: timestamp,
                avatar: isSelf ? selfAvatar : friendAvatar,
                isSelf,
                images: resolvedImages,
              };
            })
          : [];
        const sortedNormalized = sortMessagesByTime(normalized);
        setMessages(sortedNormalized);
      } catch (historyError) {
        console.error('Failed to load chat history:', historyError);
        if (!cancelled) {
          setMessages([]);
          window.dispatchEvent(new CustomEvent('toast', {
            detail: { message: 'Unable to load chat history.', type: 'error' }
          }));
        }
      } finally {
        if (!cancelled) {
          setLoadingMessages(false);
        }
      }
    };

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, [friendEmail, userEmail, selectedFriend, user]);

  // Helper function to set up WebSocket handlers
  const setupWebSocketHandlers = useCallback((ws, friendName, friendAvatar, wsUrl, currentFriendEmail, currentUserEmail, onOpenCallback) => {
      ws.onopen = (event) => {
        // console.log('WebSocket connected for direct chat', { currentFriendEmail, currentUserEmail });
        setWsConnected(true);
        setWsStatus('connected');
        // Call additional callback if provided (e.g., to clear timeout)
        if (onOpenCallback) {
          onOpenCallback();
        }
      };

      ws.onmessage = (event) => {
        try {
          // console.log('WebSocket message received:', event.data);
          const data = JSON.parse(event.data);
          // console.log('Parsed WebSocket data:', data);
        
          const mapMessage = (msg) => {
            // Handle FILE type messages
            if (msg.type === 'FILE' || msg.fileUrl || msg.fileKey) {
              const fileKey = msg.fileKey || msg.file_key || '';
              const fileUrl = msg.fileUrl || '';
              const fileIdentifier = fileKey || fileUrl;
              const isImage = msg.contentType?.startsWith('image/') || 
                ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(
                  msg.fileName?.toLowerCase().split('.').pop()
                );
              
              return {
                id: msg.id || msg.messageId || `msg-file-${Date.now()}-${Math.random()}`,
                messageUuid: msg.messageUuid,
                author: msg.senderEmail === currentUserEmail 
                  ? (user?.username || currentUserEmail) 
                  : friendName,
                email: msg.senderEmail || msg.sender || '',
                text: msg.fileName || 'file',
                createdAt: msg.timestamp || msg.createdAt || msg.sentAt || new Date().toISOString(),
                avatar: msg.senderEmail === currentUserEmail
                  ? (user?.avatarUrl || '/avatars/avatar-1.png')
                  : friendAvatar,
                isSelf: msg.senderEmail === currentUserEmail || (msg.sender && msg.sender === currentUserEmail),
                images: isImage ? [fileIdentifier] : [],
                fileKey: fileKey || null,
                fileUrl: fileUrl || null,
                fileName: msg.fileName,
                contentType: msg.contentType,
                isFile: true,
                isImage: isImage
              };
            }
            
            const getTextContent = (msg) => {
              const content = msg.content || msg.message || msg.text;
              if (typeof content === 'string') return content;
              if (typeof content === 'number') return String(content);
              if (content && typeof content === 'object') {
                if (content.text) return String(content.text);
                if (content.message) return String(content.message);
                if (content.content) return String(content.content);
                return '';
              }
              return '';
            };
            
            return {
              id: msg.id || msg.messageId || `msg-${Date.now()}-${Math.random()}`,
              messageUuid: msg.messageUuid,
              author: msg.senderEmail === currentUserEmail 
                ? (user?.username || currentUserEmail) 
                : friendName,
              email: msg.senderEmail || msg.sender || '',
              text: getTextContent(msg),
              createdAt: msg.timestamp || msg.createdAt || msg.sentAt || new Date().toISOString(),
              avatar: msg.senderEmail === currentUserEmail
                ? (user?.avatarUrl || '/avatars/avatar-1.png')
                : friendAvatar,
              isSelf: msg.senderEmail === currentUserEmail || (msg.sender && msg.sender === currentUserEmail),
              images: []
            };
          };

          if (data?.type === 'history' && Array.isArray(data.messages)) {
            console.log('Received history messages:', data.messages.length);
            // Sort raw messages first
            const sorted = sortMessagesByTime(data.messages);
            const historyMessages = sorted
              .filter((msg, idx, arr) => {
                // Filter out CONFIRM type messages (case-insensitive)
                if (msg.type && msg.type.toUpperCase() === 'CONFIRM') {
                  return false;
                }
                // Filter out optimistic messages with null messageId (duplicates)
                if (msg.messageId === null && msg.optimistic === true) {
                  return false;
                }
                // Deduplicate by messageUuid - keep only the first occurrence
                if (msg.messageUuid) {
                  const firstIndex = arr.findIndex(m => m.messageUuid === msg.messageUuid);
                  if (firstIndex !== idx) {
                    return false; // This is a duplicate
                  }
                }
                const sender = msg.senderEmail || msg.sender;
                const receiver = msg.receiverEmail || msg.receiver;
                return (
                  (sender === currentUserEmail && receiver === currentFriendEmail) ||
                  (sender === currentFriendEmail && receiver === currentUserEmail)
                );
              })
              .map((msg) => {
                // Handle FILE type messages in history
                if (msg.type === 'FILE' || msg.fileUrl || msg.fileKey) {
                  const fileKey = msg.fileKey || msg.file_key || '';
                  const fileUrl = msg.fileUrl || '';
                  const fileIdentifier = fileKey || fileUrl;
                  const isImage = msg.contentType?.startsWith('image/') || 
                    ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(
                      msg.fileName?.toLowerCase().split('.').pop()
                    );
                  
                  return {
                    id: msg.id || msg.messageId || `msg-file-${Date.now()}-${Math.random()}`,
                    messageUuid: msg.messageUuid,
                    author: msg.senderEmail === currentUserEmail 
                      ? (user?.username || currentUserEmail) 
                      : friendName,
                    email: msg.senderEmail || msg.sender || '',
                    text: msg.fileName || 'file',
                    createdAt: msg.timestamp || msg.createdAt || msg.sentAt || new Date().toISOString(),
                    avatar: msg.senderEmail === currentUserEmail
                      ? (user?.avatarUrl || '/avatars/avatar-1.png')
                      : friendAvatar,
                    isSelf: msg.senderEmail === currentUserEmail || (msg.sender && msg.sender === currentUserEmail),
                    images: isImage ? [fileIdentifier] : [],
                    fileKey: fileKey || null,
                    fileUrl: fileUrl || null,
                    fileName: msg.fileName,
                    contentType: msg.contentType,
                    isFile: true,
                    isImage: isImage
                  };
                }
                return mapMessage(msg);
              });
            console.log('Mapped history messages:', historyMessages);
            // Ensure final messages are sorted chronologically
            const sortedHistoryMessages = sortMessagesByTime(historyMessages);
            setMessages(sortedHistoryMessages);
            return;
          }
          
          // Handle single message
          // Filter out CONFIRM type messages (case-insensitive)
          if (data.type && data.type.toUpperCase() === 'CONFIRM') {
            return; // Skip this message
          }
          // Filter out optimistic messages with null messageId (duplicates)
          if (data.messageId === null && data.optimistic === true) {
            return; // Skip this message
          }

          const sender = data.senderEmail || data.sender;
          const receiver = data.receiverEmail || data.receiver;
          const isForCurrentChat = 
            (sender === currentUserEmail && receiver === currentFriendEmail) ||
            (sender === currentFriendEmail && receiver === currentUserEmail);

          // console.log('Message check:', { sender, receiver, currentUserEmail, currentFriendEmail, isForCurrentChat });

          if (isForCurrentChat || !sender || !receiver) {
            const receivedMsg = mapMessage(data);
            // console.log('Adding message to state:', receivedMsg);
            setMessages((prev) => {
              const existingIndex = prev.findIndex(m => {
                // Check by messageUuid if available
                if (data.messageUuid && m.messageUuid === data.messageUuid) {
                  return true;
                }
                if (m.id === receivedMsg.id) return true;
                if (m.text === receivedMsg.text && m.email === receivedMsg.email) {
                  const timeDiff = Math.abs(new Date(m.createdAt).getTime() - new Date(receivedMsg.createdAt).getTime());
                  if (timeDiff < 3000) return true; // Within 3 seconds
                }
                return false;
              });
            
              if (existingIndex !== -1) {
                const existing = prev[existingIndex];
                const existingIdStr = existing.id ? String(existing.id) : '';
                const receivedIdStr = receivedMsg.id ? String(receivedMsg.id) : '';
                if (existingIdStr.startsWith('temp-') && receivedIdStr && !receivedIdStr.startsWith('temp-')) {
                  console.log('Replacing optimistic message with server message');
                  const updated = [...prev];
                  updated[existingIndex] = receivedMsg;
                  return sortMessagesByTime(updated);
                }
                console.log('Message already exists, skipping duplicate');
                return prev;
              }
            
              const next = [...prev, receivedMsg];
              const sorted = sortMessagesByTime(next);
              // console.log('Updated messages array length:', sorted.length);
              return sorted;
            });
          } else {
            console.log('Message not for current chat, ignoring:', { sender, receiver, currentUserEmail, currentFriendEmail });
          }
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e, event.data);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error, 'URL:', wsUrl);
        setWsConnected(false);
        setWsStatus('not-connected');
        // Only show error toast on desktop to avoid spam on mobile
        if (window.innerWidth >= 768) {
          window.dispatchEvent(new CustomEvent('toast', {
            detail: { message: 'Connection error. Please try again.', type: 'error' }
          }));
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected', { code: event.code, reason: event.reason, wasClean: event.wasClean, currentFriendEmail, currentUserEmail });
        setWsConnected(false);
        setWsStatus('not-connected');
      
        if (event.code !== 1000 && event.code !== 1001 && currentFriendEmail && currentUserEmail) {
          // Only show toast on desktop
          if (window.innerWidth >= 768) {
            window.dispatchEvent(new CustomEvent('toast', {
              detail: { message: 'Connection closed. Reconnecting...', type: 'warning' }
            }));
          }
        
          setTimeout(() => {
            if (currentFriendEmail && currentUserEmail && 
                (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED)) {
              try {
                console.log('Attempting to reconnect WebSocket for direct chat...');
                setWsStatus('connecting');
                const reconnectUrl = getWsDirectChatUrl(currentUserEmail, currentFriendEmail);
                const newWs = new WebSocket(reconnectUrl);
                wsRef.current = newWs;
                setupWebSocketHandlers(newWs, friendName, friendAvatar, reconnectUrl, currentFriendEmail, currentUserEmail, null);
              } catch (e) {
                console.error('Failed to reconnect WebSocket:', e);
                setWsStatus('not-connected');
              }
            }
          }, 3000); // Reconnect after 3 seconds
        }
      };
  }, [user]);

  useEffect(() => {
    if (!friendEmail || !userEmail) {
      if (wsRef.current) {
        console.log('Closing WebSocket: no friend or user email');
        wsRef.current.close(1000, 'No friend selected');
        wsRef.current = null;
        setWsConnected(false);
        setWsStatus('not-connected');
      }
      return;
    }

    const friendName = formatFriendName(selectedFriend);
    const friendAvatar = selectedFriend?.avatar || selectedFriend?.avatarUrl || selectedFriend?.profileImage || '/avatars/avatar-1.png';

    // Always close existing connection when friend changes to ensure clean state
    if (wsRef.current) {
      const currentState = wsRef.current.readyState;
      console.log('Existing WebSocket state:', currentState, 'for friend:', friendEmail);
      
      // Close existing connection if it's open/connecting/closing
      if (currentState === WebSocket.CONNECTING || currentState === WebSocket.OPEN || currentState === WebSocket.CLOSING) {
        console.log('Closing existing WebSocket connection');
        wsRef.current.close(1000, 'Switching friend');
        wsRef.current = null;
        setWsConnected(false);
        setWsStatus('not-connected');
      }
      // If already closed, just clear the reference
      if (currentState === WebSocket.CLOSED) {
        wsRef.current = null;
      }
    }

    const wsUrl = getWsDirectChatUrl(userEmail, friendEmail);
    // console.log('Creating new WebSocket connection:', wsUrl);
    
    let connectionTimeout = null;
    
    try {
      setWsStatus('connecting');
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      // Add connection timeout that will close if connection doesn't open in time
      connectionTimeout = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN && ws.readyState !== WebSocket.CLOSED) {
          console.error('WebSocket connection timeout');
          ws.close();
          setWsStatus('not-connected');
          setWsConnected(false);
          window.dispatchEvent(new CustomEvent('toast', {
            detail: { message: 'Connection timeout. Please try again.', type: 'error' }
          }));
        }
      }, 10000); // 10 second timeout

      // Set up handlers with callback to clear timeout on open
      setupWebSocketHandlers(ws, friendName, friendAvatar, wsUrl, friendEmail, userEmail, () => {
        if (connectionTimeout) {
          clearTimeout(connectionTimeout);
          connectionTimeout = null;
        }
      });

      return () => {
        if (connectionTimeout) {
          clearTimeout(connectionTimeout);
        }
        if (wsRef.current && wsRef.current === ws) {
          console.log('Cleaning up WebSocket connection');
          if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
            ws.close(1000, 'Component unmounting');
          }
          wsRef.current = null;
          setWsConnected(false);
          setWsStatus('not-connected');
        }
      };
    } catch (e) {
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
      }
      console.error('Failed to create WebSocket:', e);
      setWsConnected(false);
      setWsStatus('not-connected');
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: e.message || 'Failed to connect to chat', type: 'error' }
      }));
    }
  }, [friendEmail, userEmail, selectedFriend, setupWebSocketHandlers]);
    
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages]);
  
  const formatTime = (date) => {
      const d = new Date(date);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase();
    };
    
  const formatDateChip = (date) => {
    const d = new Date(date);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    if (isToday) return 'Today';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };
  
  const shouldClampMessage = (text) => {
    if (!text) return false;
    const approxLineBreaks = (text.match(/\n/g) || []).length + 1;
    if (approxLineBreaks > 15) return true;
    return text.length > 900;
  };
  
  const toggleExpand = (id) => {
    setExpandedMessageIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };
  
  const onPickFiles = () => fileInputRef.current?.click();
  
  const onFilesSelected = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const withUrls = files.map((file) => ({ file, url: URL.createObjectURL(file) }));
    setAttachments((prev) => [...prev, ...withUrls]);
    e.target.value = '';
  };
  
  const onEmojiClick = (e) => {
    setMessage((prev) => prev + e);
    setShowEmoji(false);
  };
  
  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed && attachments.length === 0) return;
    if (!friendEmail || !userEmail) return;

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        const payload = { 
          content: trimmed,
          senderEmail: userEmail,
          receiverEmail: friendEmail
        };
        console.log('Sending message via WebSocket:', payload);
        wsRef.current.send(JSON.stringify(payload));
                const friendName = formatFriendName(selectedFriend);
        const friendAvatar = selectedFriend?.avatar || selectedFriend?.avatarUrl || selectedFriend?.profileImage || '/avatars/avatar-1.png';
        const optimisticMessage = {
          id: `temp-${Date.now()}-${Math.random()}`,
          author: user?.username || userEmail.split('@')[0] || 'You',
          email: userEmail,
          text: trimmed,
          createdAt: new Date().toISOString(),
          avatar: user?.avatarUrl || '/avatars/avatar-1.png',
          isSelf: true,
          images: attachments.map(a => a.url || a)
        };
        
        console.log('Adding optimistic message:', optimisticMessage);
        setMessages((prev) => {
          const exists = prev.some(m => 
            (m.id === optimisticMessage.id) || 
            (m.text === trimmed && m.isSelf && Math.abs(new Date(m.createdAt).getTime() - new Date(optimisticMessage.createdAt).getTime()) < 1000)
          );
          if (exists) {
            console.log('Message already exists, skipping duplicate');
            return prev;
          }
          const next = [...prev, optimisticMessage];
          const sorted = sortMessagesByTime(next);
          console.log('Updated messages array length:', sorted.length);
          return sorted;
        });
        
        setMessage('');
        try { attachments.forEach((a) => URL.revokeObjectURL(a.url)); } catch {}
        setAttachments([]);
      } catch (e) {
        console.error('Failed to send message via WebSocket:', e);

        window.dispatchEvent(new CustomEvent('toast', {
          detail: { message: 'Failed to send message. Please try again.', type: 'error' }
        }));
      }
    } else {
      console.log('WebSocket not ready. State:', wsRef.current?.readyState);
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: 'Not connected. Please wait...', type: 'error' }
      }));
    }
  };

  if (selectedFriend) {
    const friendName = formatFriendName(selectedFriend);
    const friendAvatar = selectedFriend.avatar || selectedFriend.avatarUrl || selectedFriend.profileImage || '/avatars/avatar-1.png';

    // console.log('Rendering ChatRoom with messages:', messages.length, messages);

    return (
      <ChatRoom
        title={friendName}
        currentUser={{ email: user?.email, username: user?.username, avatarUrl: user?.avatarUrl }}
        messages={messages}
        chatUser={{
          name: friendName,
          avatar: friendAvatar,
          wsStatus: wsStatus
        }}
        isGroupChat={false}
        onBack={() => {
          dispatch(setSelectedFriend(null));
        }}
        sendMessage={(text, attachments) => {
          if (!text && (!attachments || attachments.length === 0)) return;
          if (!friendEmail || !userEmail) return;

          // Check WebSocket connection state
          if (!wsRef.current) {
            console.error('WebSocket not initialized');
            window.dispatchEvent(new CustomEvent('toast', {
              detail: { message: 'Connection not established. Please wait...', type: 'error' }
            }));
            return;
          }

          const wsState = wsRef.current.readyState;
          
          // If connecting, wait a bit and try again
          if (wsState === WebSocket.CONNECTING) {
            console.log('WebSocket is connecting, waiting...');
            setTimeout(() => {
              // Retry sending after a short delay
              if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                // Re-call sendMessage with same parameters (this will be handled by the outer function)
                // For now, just show a message
                window.dispatchEvent(new CustomEvent('toast', {
                  detail: { message: 'Please wait for connection to establish...', type: 'info' }
                }));
              }
            }, 1000);
            return;
          }

          if (wsState === WebSocket.OPEN) {
            try {
              // Send file messages first if attachments have fileKey
              const readyAttachments = attachments ? attachments.filter(att => att.fileKey && !att.uploading) : [];
              
              if (readyAttachments.length > 0) {
                readyAttachments.forEach((attachment) => {
                  try {
                    const fileMessage = {
                      type: 'FILE',
                      fileName: attachment.fileName || attachment.file?.name || 'file',
                      fileKey: attachment.fileKey,
                      contentType: attachment.contentType || attachment.file?.type || 'application/octet-stream',
                      senderEmail: userEmail,
                      receiverEmail: friendEmail
                    };
                    console.log('Sending FILE message via WebSocket:', fileMessage);
                    
                    // Double-check connection is still open before sending
                    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                      wsRef.current.send(JSON.stringify(fileMessage));
                    } else {
                      throw new Error('WebSocket connection lost while sending file');
                    }
                  
                  // Optimistically add file message to UI
                  const isImage = fileMessage.contentType?.startsWith('image/') || 
                    ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(
                      fileMessage.fileName?.toLowerCase().split('.').pop()
                    );
                  
                  const fileOptimisticMessage = {
                    id: `temp-file-${Date.now()}-${Math.random()}`,
                    author: user?.username || userEmail.split('@')[0] || 'You',
                    email: userEmail,
                    text: fileMessage.fileName,
                    createdAt: new Date().toISOString(),
                    avatar: user?.avatarUrl || '/avatars/avatar-1.png',
                    isSelf: true,
                    images: isImage ? [fileMessage.fileKey] : [],
                    fileKey: fileMessage.fileKey,
                    fileName: fileMessage.fileName,
                    contentType: fileMessage.contentType,
                    isFile: true,
                    isImage: isImage
                  };
                  
                  setMessages((prev) => {
                    const next = [...prev, fileOptimisticMessage];
                    return sortMessagesByTime(next);
                  });
                  } catch (fileError) {
                    console.error('Failed to send file via WebSocket:', fileError);
                    window.dispatchEvent(new CustomEvent('toast', {
                      detail: { message: `Failed to send file: ${attachment.fileName}`, type: 'error' }
                    }));
                  }
                });
              }
              
              if (text && text.trim()) {
                try {
                  const payload = { 
                    content: text || '',
                    senderEmail: userEmail,
                    receiverEmail: friendEmail
                  };
                  // console.log('Sending message via WebSocket (from ChatRoom):', payload);
                  
                  // Double-check connection is still open before sending
                  if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                    wsRef.current.send(JSON.stringify(payload));
                  } else {
                    throw new Error('WebSocket connection lost while sending message');
                  }
                
                // Optimistically add message to UI immediately
                const friendName = formatFriendName(selectedFriend);
                const optimisticMessage = {
                  id: `temp-${Date.now()}-${Math.random()}`,
                  author: user?.username || userEmail.split('@')[0] || 'You',
                  email: userEmail,
                  text: text || '',
                  createdAt: new Date().toISOString(),
                  avatar: user?.avatarUrl || '/avatars/avatar-1.png',
                  isSelf: true,
                  images: []
                };

                setMessages((prev) => {
                  // Check if message already exists to avoid duplicates
                  const exists = prev.some(m => {
                    if (m.id === optimisticMessage.id) return true;
                    // Check if same text from same sender within 1 second
                    if (m.text === text && m.isSelf && m.email === userEmail) {
                      const timeDiff = Math.abs(new Date(m.createdAt).getTime() - new Date(optimisticMessage.createdAt).getTime());
                      if (timeDiff < 1000) return true; // Within 1 second
                    }
                    return false;
                  });
                  if (exists) {
                    console.log('Message already exists, skipping duplicate');
                    return prev;
                  }
                  const next = [...prev, optimisticMessage];
                  const sorted = sortMessagesByTime(next);
                  // console.log('Updated messages array length (from ChatRoom):', sorted.length);
                  return sorted;
                });
                } catch (textError) {
                  console.error('Failed to send text message via WebSocket:', textError);
                  window.dispatchEvent(new CustomEvent('toast', {
                    detail: { message: 'Failed to send message. Please try again.', type: 'error' }
                  }));
                }
              }
            } catch (e) {
              console.error('Failed to send message via WebSocket (from ChatRoom):', e);
              window.dispatchEvent(new CustomEvent('toast', {
                detail: { message: 'Failed to send message. Please try again.', type: 'error' }
              }));
            }
          } else {
            console.log('WebSocket not ready (from ChatRoom). State:', wsState);
            const stateMessages = {
              [WebSocket.CONNECTING]: 'Connecting...',
              [WebSocket.CLOSING]: 'Connection closing...',
              [WebSocket.CLOSED]: 'Connection closed. Please refresh.',
            };
            window.dispatchEvent(new CustomEvent('toast', {
              detail: { message: stateMessages[wsState] || 'Not connected. Please wait...', type: 'error' }
            }));
          }
        }}
      />
    );
  }

  return (
    <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden bg-[#E6E6E6] md:bg-gray-100 md:border md:border-gray-500 md:rounded-xl">
      {/* Mobile Header - Dashboard Title with Icon */}
      <div className="md:hidden px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-5 h-5 text-gray-800" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z"/>
                </svg>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
                    <button
            onClick={() => dispatch(setActiveTab('Community'))}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'Community'
                ? 'bg-purple-600 text-white'
                : 'text-gray-600 bg-transparent'
            }`}
          >
            Community
                    </button>
          <button
            onClick={() => dispatch(setActiveTab('Local-Groups'))}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'Local-Groups'
                ? 'bg-purple-600 text-white'
                : 'text-gray-600 bg-transparent'
            }`}
          >
            Group
                    </button>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block bg-gray-200 border-b border-gray-500 px-4 sm:px-6 py-4 flex-shrink-0 rounded-t-xl">
        <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => dispatch(setActiveTab('Community'))}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'Community'
                ? 'bg-[#282828] text-white'
                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
            }`}
          >
            Community
          </button>
          <button
            onClick={() => dispatch(setActiveTab('Local-Groups'))}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'Local-Groups'
                ? 'bg-[#282828] text-white'
                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
            }`}
          >
            Local-Groups
          </button>
          </div>
          {/* Add Friend Button - Desktop Only */}
          {onOpenAddFriends && (
            <button
              onClick={onOpenAddFriends}
              title='Add Friend'
              className="hidden md:flex w-7 h-7 items-center justify-center text-black hover:bg-gray-300 rounded-md transition-colors"
            >
              <img src="/icons/add_frnd.svg" alt="Add Friend" className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 px-4 py-4 md:p-4 md:sm:p-6 overflow-y-auto">
        {activeTab === 'Community'
          ? renderList(
              communities,
              'No community joined',
              "You haven't joined any communities yet. Explore and connect with others who share your interests — your next great conversation might be waiting!"
            )
          : renderList(
              localGroups,
              'No Local-Groups yet',
              "You haven't joined any Local-Groups yet. Explore and connect with others who share your interests"
            )}
      </div>
    </div>
  );
};

export default DashboardMainSection;






