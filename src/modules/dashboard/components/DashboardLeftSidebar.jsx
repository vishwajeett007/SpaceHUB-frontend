import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFriendsList, removeFriend } from '../../../shared/services/API';
import { useAuth } from '../../../shared/contexts/AuthContextContext';
import { getStoredUserEmail } from '../../../shared/services/authStorage';

// Helper function to format name - prioritizes username
const formatFriendName = (friend) => {
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
  return 'Unknown';
};

// Friend Avatar Component with fallback
const FriendAvatar = ({ avatar, username, firstName, isSelected }) => {
  const [imageError, setImageError] = useState(false);
  
  useEffect(() => {
    setImageError(false);
  }, [avatar]);

  if (!avatar || imageError) {
    const initial = (firstName && String(firstName).length > 0)
      ? String(firstName).charAt(0).toUpperCase()
      : (username && String(username).length > 0)
        ? String(username).charAt(0).toUpperCase()
        : 'U';
    return (
      <span 
        className={`text-xs font-semibold ${
          isSelected ? 'text-white' : 'text-gray-600'
        }`}
      >
        {initial}
      </span>
    );
  }

  return (
    <img 
      src={avatar} 
      alt={username} 
      className="w-full h-full object-cover"
      onError={() => setImageError(true)}
    />
  );
};

const DashboardLeftSidebar = ({ selectedView, setSelectedView, selectedFriend, setSelectedFriend }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isDirectMessageOpen, setIsDirectMessageOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [friends, setFriends] = useState([]);
  const [filteredFriends, setFilteredFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [removingFriend, setRemovingFriend] = useState({});
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [friendToRemove, setFriendToRemove] = useState(null);

  const fetchFriends = useCallback(async () => {
      setLoading(true);
      setError('');
      
      const storedEmail = getStoredUserEmail();
      const userEmail = user?.email || storedEmail;
      
      if (!userEmail) {
        setError('User email not found');
        setLoading(false);
        return;
      }
      
      try {
        const cachedFriends = sessionStorage.getItem('friendsList');
        if (cachedFriends) {
          const parsedFriends = JSON.parse(cachedFriends);
          const cachedUserEmail = sessionStorage.getItem('friendsListUserEmail');
          if (cachedUserEmail === userEmail && Array.isArray(parsedFriends) && parsedFriends.length > 0) {
            setFriends(parsedFriends);
            setFilteredFriends(parsedFriends);
            setLoading(false);

          }
        }
      } catch (e) {
        console.error('Error loading cached friends:', e);
      }
      
      try {
        const response = await getFriendsList(userEmail);
        const friendsList = response?.data || [];
        const processedFriends = Array.isArray(friendsList) 
          ? friendsList.map(friend => ({
              id: friend.id,
              firstName: friend.firstName || friend.first || '',
              lastName: friend.lastName || friend.last || '',
              email: friend.email || '',
              ...friend
            }))
          : [];
        
        // console.log('Processed friends list:', processedFriends);
        
        // Save to sessionStorage
        try {
          sessionStorage.setItem('friendsList', JSON.stringify(processedFriends));
          sessionStorage.setItem('friendsListUserEmail', userEmail);
          sessionStorage.setItem('friendsListTimestamp', Date.now().toString());
        } catch (storageError) {
          console.error('Error saving friends to sessionStorage:', storageError);
        }
        
        setFriends(processedFriends);
        setFilteredFriends(processedFriends);
      } catch (e) {
        setError(e.message || 'Failed to load friends');
        setFriends([]);
        setFilteredFriends([]);
      } finally {
        setLoading(false);
      }
    }, [user]);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  useEffect(() => {
    const handler = () => fetchFriends();
    window.addEventListener('friends:refresh', handler);
    return () => window.removeEventListener('friends:refresh', handler);
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
            friend.firstName?.toLowerCase().includes(query) ||
            friend.lastName?.toLowerCase().includes(query) ||
            friend.first?.toLowerCase().includes(query) ||
            friend.last?.toLowerCase().includes(query) ||
            friend.email?.toLowerCase().includes(query)
          );
        })
      );
    }
  }, [searchQuery, friends]);

  const handleFriendClick = (friend) => {
    setSelectedFriend(friend);
    setSelectedView('dashboard');
    try {
      sessionStorage.setItem('activeChatFriend', JSON.stringify(friend));
    } catch (error) {
      console.warn('Failed to persist active chat friend:', error);
    }
    const identifier = friend?.username || friend?.email || friend?.id || friend?.friendId;
    if (identifier) {
      navigate(`/dashboard/chat/${encodeURIComponent(identifier)}`);
    } else {
      navigate('/dashboard');
    }
  };

  const handleRemoveFriendClick = (e, friend) => {
    e.stopPropagation();
    setFriendToRemove(friend);
    setShowRemoveModal(true);
  };

  const handleConfirmRemove = async () => {
    if (!friendToRemove) return;

    const storedEmail = getStoredUserEmail();
    const userEmail = user?.email || storedEmail;
    const friendEmail = friendToRemove?.email;

    if (!userEmail || !friendEmail) {
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: 'Unable to remove friend. User email not found.', type: 'error' }
      }));
      setShowRemoveModal(false);
      setFriendToRemove(null);
      return;
    }

    const friendId = friendToRemove.id || friendToRemove.userId || friendToRemove.friendId;
    setRemovingFriend((prev) => ({ ...prev, [friendId]: true }));

    try {
      await removeFriend({ userEmail, friendEmail });
      
      setFriends((prev) => prev.filter((f) => {
        const fId = f.id || f.userId || f.friendId;
        return fId !== friendId;
      }));
      setFilteredFriends((prev) => prev.filter((f) => {
        const fId = f.id || f.userId || f.friendId;
        return fId !== friendId;
      }));

      const activeChatRaw = sessionStorage.getItem('activeChatFriend');
      if (activeChatRaw) {
        try {
          const activeChat = JSON.parse(activeChatRaw);
          if (activeChat?.email && activeChat.email.toLowerCase() === friendEmail.toLowerCase()) {
            sessionStorage.removeItem('activeChatFriend');
          }
        } catch (parseError) {
          console.warn('Failed to parse active chat friend from session storage:', parseError);
          sessionStorage.removeItem('activeChatFriend');
        }
      }

      if (selectedFriend && (selectedFriend.id === friendId || selectedFriend.userId === friendId || selectedFriend.friendId === friendId || (selectedFriend.email && selectedFriend.email.toLowerCase() === friendEmail.toLowerCase()))) {
        setSelectedFriend(null);
      }

      try {
        const updatedFriends = friends.filter((f) => {
          const fId = f.id || f.userId || f.friendId;
          return fId !== friendId;
        });
        sessionStorage.setItem('friendsList', JSON.stringify(updatedFriends));
      } catch (storageError) {
        console.error('Error updating friends in sessionStorage:', storageError);
      }

      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: 'Friend removed successfully', type: 'success' }
      }));

      fetchFriends();
      setShowRemoveModal(false);
      setFriendToRemove(null);
    } catch (e) {
      console.error('Failed to remove friend:', e);
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: e.message || 'Failed to remove friend', type: 'error' }
      }));
    } finally {
      setRemovingFriend((prev) => ({ ...prev, [friendId]: false }));
    }
  };

  const handleCancelRemove = () => {
    setShowRemoveModal(false);
    setFriendToRemove(null);
  };

  return (
    <div className="hidden md:block w-80 bg-gray-200 h-full overflow-y-auto flex-shrink-0 rounded-r-xl">
      <div className="space-y-2  mt-[1px] mb-6">
        <button
          onClick={() => {
            setSelectedView('dashboard');
            setSelectedFriend(null);
            sessionStorage.removeItem('activeChatFriend');
            navigate('/dashboard');
          }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
            selectedView === 'dashboard' && !selectedFriend
              ? 'bg-[#282828] text-white'
              : 'text-zinc-700 hover:bg-zinc-200'
          }`}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
          </svg>
          <span className="font-medium">Dashboard</span>
        </button>

        <div className="space-y-2">
          <button
            onClick={() => {
              setSelectedView('discover');
              setSelectedFriend(null);
              sessionStorage.removeItem('activeChatFriend');
              navigate('/dashboard/discover');
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
              selectedView === 'discover'
                ? 'bg-[#282828] text-white'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            <svg 
              className={`w-5 h-5 ${selectedView === 'discover' ? 'text-white' : 'text-gray-700'}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 9.172l-2.12 4.243-4.243 2.12 2.12-4.243 4.243-2.12z" />
            </svg>
            <span className="font-medium">Discover</span>
          </button>

          {/* Direct Message Section */}
          <div>
            <button
              onClick={() => setIsDirectMessageOpen(!isDirectMessageOpen)}
              className="w-full flex items-center justify-between px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              <span className="font-medium">Direct message</span>
              <svg 
                className={`w-4 h-4 transition-transform ${isDirectMessageOpen ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isDirectMessageOpen && (
              <div className="mt-2 space-y-2">
                {/* Search Bar */}
                <div className="px-4">
                  <div className="relative">
                    <svg 
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Friends List */}
                <div className="space-y-1">
                  {loading ? (
                    // Shimmer loading effect
                    Array.from({ length: 5 }).map((_, idx) => (
                      <div key={idx} className="px-4 py-2 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-300 animate-pulse" />
                        <div className="flex-1 h-4 bg-gray-300 rounded animate-pulse" />
                      </div>
                    ))
                  ) : error ? (
                    <div className="px-4 py-2 text-sm text-red-500 text-center">
                      {error}
                    </div>
                  ) : filteredFriends.length === 0 ? (
                    <div className="px-4 py-2 text-sm text-gray-500 text-center">
                      {searchQuery.trim() ? 'No friends found' : 'No friends yet'}
                    </div>
                  ) : (
                    filteredFriends.map((friend) => {
                      const friendId = friend.id || friend.userId || friend.friendId;
                      const friendDisplayName = formatFriendName(friend);
                      const friendAvatar = friend.avatar || friend.avatarUrl || friend.profileImage;
                      const isSelected = selectedFriend?.id === friendId || 
                                       selectedFriend?.userId === friendId ||
                                       selectedFriend?.friendId === friendId;
                      const isRemoving = removingFriend[friendId];
                      
                      return (
                        <div
                          key={friendId || friendDisplayName}
                          className="group relative w-full"
                        >
                          <button
                            onClick={() => handleFriendClick(friend)}
                            className={`w-full flex items-center gap-3 px-4 py-2 rounded-md transition-colors ${
                              isSelected
                                ? 'bg-gray-700 text-white'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0 overflow-hidden">
                              <FriendAvatar 
                                avatar={friendAvatar}
                                username={friendDisplayName}
                                firstName={friend.firstName}
                                isSelected={isSelected}
                              />
                            </div>
                            <span className="font-medium text-sm truncate">
                              {friendDisplayName}
                            </span>
                          </button>
                          <button
                            onClick={(e) => handleRemoveFriendClick(e, friend)}
                            disabled={isRemoving}
                            className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-opacity ${
                              isSelected
                                ? 'text-white hover:bg-white/20'
                                : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                            } opacity-0 group-hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed`}
                            title="Remove friend"
                          >
                            {isRemoving ? (
                              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Remove Friend Confirmation Modal */}
      {showRemoveModal && friendToRemove && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-black rounded-lg md:rounded-xl p-5 md:p-8 max-w-md w-full relative">
            <button
              onClick={handleCancelRemove}
              className="absolute top-3 md:top-4 right-3 md:right-4 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Remove Friend</h2>
            <p className="text-sm md:text-base text-white/80 mb-6">
              Are you sure you want to remove <span className="font-semibold">{formatFriendName(friendToRemove)}</span> from your friends list? This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleCancelRemove}
                disabled={removingFriend[friendToRemove.id || friendToRemove.userId || friendToRemove.friendId]}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRemove}
                disabled={removingFriend[friendToRemove.id || friendToRemove.userId || friendToRemove.friendId]}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {removingFriend[friendToRemove.id || friendToRemove.userId || friendToRemove.friendId] ? 'Removing...' : 'Remove Friend'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardLeftSidebar;
