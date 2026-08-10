import React, { useEffect, useState, useCallback, useRef } from 'react';
import { searchUsers, sendFriendRequest, cancelFriendRequest } from '../../../shared/services/API';
import { useAuth } from '../../../shared/contexts/AuthContextContext';
import { getStoredUserEmail } from '../../../shared/services/authStorage';

const DashboardRightSidebar = ({ onClose }) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [addingFriend, setAddingFriend] = useState({});
  const [requested, setRequested] = useState({});

  const handleSearch = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const userEmail = user?.email || getStoredUserEmail();
    if (!userEmail) {
      const errorMsg = 'User email not found';
      setSearchError(errorMsg);
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: errorMsg, type: 'error' }
      }));
      return;
    }

    setSearchLoading(true);
    setSearchError('');
    try {
      const data = await searchUsers(query.trim(), userEmail, 0, 10);
      const rawResults = data?.data?.content || data?.data || data?.content || data?.users || [];
      setSearchResults(Array.isArray(rawResults) ? rawResults : []);
    } catch (e) {
      const errorMsg = e.message || 'Failed to search users';
      setSearchError(errorMsg);
      setSearchResults([]);
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: errorMsg, type: 'error' }
      }));
    } finally {
      setSearchLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, handleSearch]);

  const searchInputRef = useRef(null);
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const handleAddFriend = useCallback(async (friendUser) => {
    const userEmail = user?.email || getStoredUserEmail();
    const friendId = friendUser?.id || friendUser?.userId;

    if (!userEmail || !friendId) {
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: 'Unable to send friend request. User not found.', type: 'error' }
      }));
      return;
    }

    setAddingFriend((prev) => ({ ...prev, [friendId]: true }));

    try {
      const response = await sendFriendRequest(userEmail, friendId);

      window.dispatchEvent(new CustomEvent('user:add-friend', { detail: { user: friendUser, response } }));

      setRequested((prev) => ({ ...prev, [friendId]: true }));
      try {
        const friendName = friendUser?.firstName && friendUser?.lastName 
          ? `${friendUser.firstName} ${friendUser.lastName}`
          : friendUser?.firstName 
          ? friendUser.firstName
          : friendUser?.username || friendUser?.email || 'user';
        window.dispatchEvent(new CustomEvent('toast', { detail: { message: `Request sent to ${friendName}`, type: 'success' } }));
      } catch {
        // Toast delivery is best-effort.
      }
    } catch (e) {
      console.error('Failed to send friend request:', e);
      try {
        window.dispatchEvent(new CustomEvent('toast', { detail: { message: e.message || 'Failed to send friend request', type: 'error' } }));
      } catch {
        // Toast delivery is best-effort.
      }
    } finally {
      setAddingFriend((prev) => {
        const updated = { ...prev };
        delete updated[friendId];
        return updated;
      });
    }
  }, [user]);

  const [cancellingFriend, setCancellingFriend] = useState({});
  const [hoveredButton, setHoveredButton] = useState({});

  const handleCancelFriend = useCallback(async (friendUser) => {
    const userEmail = user?.email || getStoredUserEmail();
    const friendId = friendUser?.id || friendUser?.userId;

    if (!userEmail || !friendId) return;

    setCancellingFriend((prev) => ({ ...prev, [friendId]: true }));

    try {
      await cancelFriendRequest(userEmail, friendId);
      setRequested((prev) => ({ ...prev, [friendId]: false }));

      setSearchResults((prev) =>
        prev.map((u) => {
          if ((u.id || u.userId) === friendId) {
            return { ...u, friendshipStatus: 'NONE' };
          }
          return u;
        })
      );

      const friendName =
        friendUser?.firstName && friendUser?.lastName
          ? `${friendUser.firstName} ${friendUser.lastName}`
          : friendUser?.firstName || friendUser?.username || friendUser?.email || 'user';

      window.dispatchEvent(
        new CustomEvent('toast', {
          detail: { message: `Friend request to ${friendName} cancelled`, type: 'info' },
        })
      );
    } catch (e) {
      console.error('Failed to cancel friend request:', e);
      window.dispatchEvent(
        new CustomEvent('toast', {
          detail: { message: e.message || 'Failed to cancel friend request', type: 'error' },
        })
      );
    } finally {
      setCancellingFriend((prev) => {
        const updated = { ...prev };
        delete updated[friendId];
        return updated;
      });
    }
  }, [user]);

  const handleSendRequest = useCallback(() => {
    if (searchQuery.trim().length >= 2) {
      handleSearch(searchQuery);
    }
  }, [searchQuery, handleSearch]);

  return (
    <div className="w-full h-full overflow-y-auto flex-shrink-0 relative rounded-xl p-4 border border-gray-500 bg-white">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-3 lg:top-4 right-3 lg:right-4 w-6 h-6 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-full transition-colors z-10"
        title="Close"
      >
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="mb-5">
        <h3 className="text-xl font-bold text-gray-800 mb-3">ADD FRIENDS</h3>

        <div className="mb-4 mt-6">
          <h4 className="font-semibold text-sm text-gray-800 mb-2">Add friends now</h4>
          <p className="text-xs text-gray-600 mb-3">
            Your next adventure begins with a click Meet, chat, and make lasting connections.
          </p>

          <div className="mb-4">
            <div className="relative">
              <img
                src="/icons/search_icon.svg"
                alt="Search users"
                className="absolute left-1 top-1/2 -translate-y-1/2 w-8 h-8 pointer-events-none"
              />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter username or email"
                className="w-full pl-10 pr-24 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <button
                onClick={handleSendRequest}
                disabled={searchLoading || searchQuery.trim().length < 2}
                className="absolute right-1 top-1/2 -translate-y-1/2 px-4 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                {searchLoading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>
        </div>

        {/* Search Results */}
        {searchLoading && (
          <div className="text-gray-600 text-sm text-center py-4">Searching...</div>
        )}
        {searchError && (
          <div className="text-red-600 text-sm text-center py-4">{searchError}</div>
        )}

        {!searchLoading && !searchError && searchQuery.trim().length >= 2 && (
          <div className="space-y-3 mb-4">
            {searchResults.length > 0 ? (
              searchResults.map((userItem, idx) => {
                let displayName = 'Unknown User';
                if (!userItem || typeof userItem !== 'object') {
                  displayName = 'Unknown User';
                } else if (userItem.firstName && userItem.lastName) {
                  displayName = `${userItem.firstName} ${userItem.lastName}`;
                } else if (userItem.firstName) {
                  displayName = userItem.firstName;
                } else if (userItem.username) {
                  displayName = userItem.username;
                } else if (userItem.name) {
                  displayName = userItem.name;
                } else if (userItem.email) {
                  displayName = userItem.email.split('@')[0];
                }
                const subtitleText = userItem.username ? `@${userItem.username}` : '';
                const avatarUrl = userItem.avatarUrl || userItem.avatar || '/avatars/avatar-1.png';
                
                const friendshipStatus = userItem.friendshipStatus;
                const friendId = userItem?.userId || userItem?.id;
                const isFriend = friendshipStatus === 'FRIEND';
                const isRequested = requested[friendId] !== undefined ? requested[friendId] : friendshipStatus === 'REQUEST_SENT';
                const isBusy = addingFriend[friendId] || cancellingFriend[friendId];

                return (
                  <div key={userItem.userId || userItem.id || idx} className="flex items-center justify-between gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                        {avatarUrl ? (
                          <img 
                            src={avatarUrl} 
                            alt={displayName} 
                            className="w-full h-full object-cover" 
                            onError={(e) => { 
                              e.target.style.display = 'none'; 
                              if (e.target.nextSibling) {
                                e.target.nextSibling.style.display = 'flex';
                              }
                            }} 
                          />
                        ) : null}
                        <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-600 text-xs font-semibold hidden">
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-gray-800 text-sm font-medium truncate">{displayName}</div>
                        {subtitleText && (
                          <div className="text-xs text-gray-500 mt-0.5 truncate">{subtitleText}</div>
                        )}
                      </div>
                    </div>

                    {isFriend ? (
                      <button
                        disabled
                        className="px-3 py-1.5 bg-gray-300 text-gray-700 text-xs font-medium rounded-md cursor-not-allowed flex-shrink-0"
                      >
                        Already Friend
                      </button>
                    ) : isRequested ? (
                      <button
                        onClick={() => handleCancelFriend(userItem)}
                        onMouseEnter={() => setHoveredButton((prev) => ({ ...prev, [friendId]: true }))}
                        onMouseLeave={() => setHoveredButton((prev) => ({ ...prev, [friendId]: false }))}
                        disabled={isBusy}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex-shrink-0 flex items-center gap-1 cursor-pointer ${
                          hoveredButton[friendId]
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-purple-100 text-purple-700 border border-purple-300 hover:bg-red-600 hover:text-white'
                        }`}
                      >
                        {cancellingFriend[friendId]
                          ? 'Cancelling...'
                          : hoveredButton[friendId]
                          ? 'Cancel Request'
                          : 'Requested'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAddFriend(userItem)}
                        disabled={isBusy}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-md transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
                      >
                        <img src="/icons/add_frnd.svg" alt="Add friend" className="w-4 h-4" />
                        {addingFriend[friendId] ? 'Sending...' : 'Add Friend'}
                      </button>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-gray-600 text-sm text-center py-4">
                No users found
              </div>
            )}
          </div>
        )}

        {/* Empty State - Only show when no search query */}
        {searchQuery.trim().length < 2 && (
          <>
            <div className="flex justify-center mb-3">
              <img
                src="/friends-empty.png"
                alt="No friends yet illustration"
                className="max-w-full w-40 h-auto"
              />
            </div>

            <p className="text-xs text-gray-600 text-center">
              No friends yet. Start connecting with people who share your interests.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default React.memo(DashboardRightSidebar);
