import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getFriendsList, getChatHistory } from '../../../shared/services/API';
import { useAuth } from '../../../shared/contexts/AuthContextContext';
import MobileHamburgerMenu from '../components/MobileHamburgerMenu';
import DashboardRightSidebar from '../components/DashboardRightSidebar';
import InboxModal from '../components/InboxModal';
import { selectShowInbox, setShowInbox } from '../../../shared/store/slices/uiSlice';
import { selectUnreadCount } from '../../../shared/store/slices/inboxSlice';
import { getStoredUserEmail } from '../../../shared/services/authStorage';

const DirectMessagePage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false);
  const showInbox = useSelector(selectShowInbox);
  const unreadCount = useSelector(selectUnreadCount);
  const [searchQuery, setSearchQuery] = useState('');
  const [friends, setFriends] = useState([]);
  const [filteredFriends, setFilteredFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recentConversations, setRecentConversations] = useState([]);
  const searchInputRef = useRef(null);

  const userEmail = user?.email || getStoredUserEmail();

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    const handleOpenInbox = () => {
      dispatch(setShowInbox(true));
    };
    window.addEventListener('openInbox', handleOpenInbox);
    return () => {
      window.removeEventListener('openInbox', handleOpenInbox);
    };
  }, [dispatch]);

  const formatFriendName = (friend) => {
    if (!friend || typeof friend !== 'object') return 'Unknown';
    if (friend.username) {
      return friend.username;
    }
    if (friend.firstName && friend.lastName) {
      return `${friend.firstName} ${friend.lastName}`;
    }
    if (friend.first && friend.last) {
      return `${friend.first} ${friend.last}`;
    }
    if (friend.name) {
      return friend.name;
    }
    if (friend.email && typeof friend.email === 'string') {
      return friend.email.split('@')[0];
    }
    return 'Unknown';
  };

  const fetchFriends = useCallback(async () => {
    if (!userEmail) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await getFriendsList(userEmail);
      const friendsList = response?.data || [];
      const processedFriends = Array.isArray(friendsList)
        ? friendsList.map(friend => ({
            id: friend.id,
            firstName: friend.firstName || friend.first || '',
            lastName: friend.lastName || friend.last || '',
            email: friend.email || '',
            username: friend.username || '',
            avatar: friend.avatar || friend.avatarUrl || friend.profileImage || '/avatars/avatar-1.png',
            ...friend
          }))
        : [];

      setFriends(processedFriends);
      setFilteredFriends(processedFriends);

      const conversationsPromises = processedFriends.map(async (friend) => {
        try {
          const chatHistory = await getChatHistory(userEmail, friend.email);
          const messages = chatHistory?.data || chatHistory?.messages || chatHistory?.history || [];
          const sortedMessages = Array.isArray(messages)
            ? messages.sort((a, b) => {
                const timeA = new Date(a.timestamp || a.createdAt || 0).getTime();
                const timeB = new Date(b.timestamp || b.createdAt || 0).getTime();
                return timeA - timeB;
              })
            : [];

          const lastMessage = sortedMessages.length > 0
            ? sortedMessages[sortedMessages.length - 1]
            : null;

          let lastMsgText = '';
          if (lastMessage) {
            const isFileMsg = lastMessage.type === 'FILE' || lastMessage.isFile || Boolean(lastMessage.fileKey || lastMessage.fileUrl);
            if (isFileMsg) {
              const isImg = lastMessage.contentType?.startsWith('image/') || lastMessage.isImage;
              lastMsgText = isImg ? '📷 Photo' : `📁 ${lastMessage.fileName || lastMessage.text || 'Attached file'}`;
            } else {
              lastMsgText = lastMessage.content || lastMessage.message || lastMessage.text || '';
            }
          }

          const unreadCount = sortedMessages.filter(msg => {
            const msgSender = msg.senderEmail || msg.email || '';
            return msgSender.toLowerCase() !== userEmail.toLowerCase();
          }).length;

          return {
            ...friend,
            lastMessage: lastMsgText,
            lastMessageTime: lastMessage?.timestamp || lastMessage?.createdAt || null,
            unreadCount: unreadCount > 0 ? unreadCount : 0
          };
        } catch (error) {
          console.error(`Error fetching chat history for ${friend.email}:`, error);
          return {
            ...friend,
            lastMessage: '',
            lastMessageTime: null,
            unreadCount: 0
          };
        }
      });

      const conversations = await Promise.all(conversationsPromises);

      const sorted = conversations
        .filter(conv => conv.lastMessage || conv.lastMessageTime)
        .sort((a, b) => {
          if (!a.lastMessageTime) return 1;
          if (!b.lastMessageTime) return -1;
          return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
        });

      setRecentConversations(sorted);
    } catch (error) {
      console.error('Error fetching friends:', error);
      setFriends([]);
      setFilteredFriends([]);
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: error.message || 'Failed to fetch friends', type: 'error' }
      }));
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredFriends(friends);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredFriends(
        friends.filter((friend) => {
          const friendName = formatFriendName(friend);
          return (
            friendName.toLowerCase().includes(query) ||
            friend.username?.toLowerCase().includes(query) ||
            friend.email?.toLowerCase().includes(query)
          );
        })
      );
    }
  }, [searchQuery, friends]);

  const handleFriendClick = (friend) => {
    try {
      sessionStorage.setItem('activeChatFriend', JSON.stringify(friend));
    } catch (error) {
      console.warn('Failed to persist active chat friend:', error);
    }
    const friendIdentifier = friend?.username || friend?.email || friend?.id || '';
    if (friendIdentifier) {
      navigate(`/dashboard/chat/${encodeURIComponent(friendIdentifier)}`);
    } else {
      navigate('/dashboard');
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 1440) {
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'pm' : 'am';
        const displayHours = hours % 12 || 12;
        const displayMinutes = minutes.toString().padStart(2, '0');
        return `${displayHours}:${displayMinutes}${ampm}`;
      }

      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <div className="h-screen md:hidden bg-[#E6E6E6] flex flex-col overflow-hidden">

      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsMenuOpen(true)}
            className="p-2 -ml-5"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex items-center gap-2 flex-1 ml-3">
            <h1 className="text-xl font-semibold text-gray-800">Direct message</h1>
          </div>

          <div className="flex items-center gap-2">

            <button
              onClick={() => setIsAddFriendOpen(true)}
              className="p-2 text-black -ml-4"
              title="Add Friend"
            >
              <img src="/icons/add_frnd.svg" alt="Add Friend" className="w-5 h-5" />
            </button>

            <button
              onClick={() => dispatch(setShowInbox(true))}
              className="relative p-2"
              title="Inbox"
            >
              <img src="/icons/inbox.svg" alt="Inbox" className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white pointer-events-none" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 px-4 py-3 bg-white border-b border-gray-200">
        <div className="relative">
          <img
            src="/icons/search_icon.svg"
            alt="Search"
            className="absolute left-1.5 top-1/2 -translate-y-1/2 transform w-10 h-10"
          />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 bg-gray-100 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        <h2 className="text-sm font-medium text-gray-700 mb-3">All Friends</h2>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="flex items-center gap-3 animate-pulse">
                <div className="w-14 h-14 rounded-full bg-gray-200" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-32" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredFriends.length > 0 ? (
          <div className="space-y-2">
            {filteredFriends.map((friend) => {
              const displayName = formatFriendName(friend);

              const conversation = recentConversations.find(conv =>
                conv.email === friend.email || conv.id === friend.id
              );
              const lastMessage = conversation?.lastMessage || '';
              const truncatedMessage = lastMessage.length > 40
                ? lastMessage.substring(0, 40) + '...'
                : lastMessage;

              return (
                <button
                  key={friend.id || friend.email}
                  onClick={() => handleFriendClick(friend)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors bg-white border border-gray-200"
                >
                  <div className="w-14 h-14 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                    <img
                      src={friend.avatar}
                      alt={displayName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = '/avatars/avatar-1.png';
                      }}
                    />
                  </div>

                  <div className="flex-1 min-w-0 text-left">
                    <div className="font-semibold text-gray-800 truncate">{displayName}</div>
                    {truncatedMessage ? (
                      <div className="text-sm text-gray-500 truncate">{truncatedMessage}</div>
                    ) : (
                      <div className="text-sm text-gray-400 italic">click to start</div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    {conversation?.lastMessageTime && (
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {formatTime(conversation.lastMessageTime)}
                      </span>
                    )}
                    {conversation?.unreadCount > 0 && (
                      <div className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-semibold">
                        {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No friends found</p>
            <p className="text-sm mt-2">
              {searchQuery.trim() ? 'Try a different search' : 'Add friends to start chatting!'}
            </p>
          </div>
        )}
      </div>

      <MobileHamburgerMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onNavigate={(view) => {
          if (view === 'direct-message') {

            setIsMenuOpen(false);
          } else {
            navigate(`/dashboard${view === 'dashboard' ? '' : `/${view}`}`);
          }
        }}
      />

      {isAddFriendOpen && (
        <>

          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsAddFriendOpen(false)}
          />

          <div className="fixed right-0 top-0 bottom-0 w-[85%] max-w-sm bg-white z-50 md:hidden flex flex-col shadow-2xl">
            <DashboardRightSidebar onClose={() => setIsAddFriendOpen(false)} />
          </div>
        </>
      )}

      <InboxModal isOpen={showInbox} onClose={() => dispatch(setShowInbox(false))} />
    </div>
  );
};

export default DirectMessagePage;
