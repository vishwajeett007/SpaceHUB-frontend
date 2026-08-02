import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { acceptJoinRequest, rejectJoinRequest, respondToFriendRequest, getPresignedDownloadUrl, deleteNotificationByReference } from '../../../shared/services/API';
import { useAuth } from '../../../shared/contexts/AuthContextContext';
import webSocketService from '../../../shared/services/WebSocketService';
import { getStoredUserEmail } from '../../../shared/services/authStorage';
import {
  selectRequests,
  selectInboxLoading,
  selectInboxError,
  selectProcessingRequest,
  setRequests,
  addRequest,
  setLoading,
  setError,
  setProcessingRequest,
  removeRequest,
  setWsConnected,
  markAllAsRead,
} from '../../../shared/store/slices/inboxSlice';

const InboxModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const modalRef = useRef(null);
  const { user } = useAuth();
  
  const requests = useSelector(selectRequests);
  const loading = useSelector(selectInboxLoading);
  const error = useSelector(selectInboxError);
  const processingRequest = useSelector(selectProcessingRequest);
  const requestsRef = useRef(requests);
  const [avatarUrls, setAvatarUrls] = useState({});

  useEffect(() => {
    requestsRef.current = requests;
  }, [requests]);

  const requestsWithAvatars = useMemo(() => {
    return requests.map(req => ({
      ...req,
      avatar: req.avatar || (req.avatarFile && avatarUrls[req.avatarFile]) || null
    }));
  }, [requests, avatarUrls]);

  useEffect(() => {
    const fetchAvatarUrls = async () => {
      const filesToFetch = new Set();
      
      requests.forEach(item => {
        if (item.avatarFile && !avatarUrls[item.avatarFile]) {
          filesToFetch.add(item.avatarFile);
        }
      });
      
      if (filesToFetch.size === 0) return;
      
      const fetchPromises = Array.from(filesToFetch).map(async (filePath) => {
        try {
          const contentType = filePath.toLowerCase().endsWith('.png') ? 'image/png' :
                             filePath.toLowerCase().endsWith('.jpg') || filePath.toLowerCase().endsWith('.jpeg') ? 'image/jpeg' :
                             filePath.toLowerCase().endsWith('.gif') ? 'image/gif' :
                             filePath.toLowerCase().endsWith('.webp') ? 'image/webp' :
                             'image/png';
          
          const url = await getPresignedDownloadUrl(filePath, contentType);
          if (url) {
            setAvatarUrls(prev => ({ ...prev, [filePath]: url }));
          }
        } catch (error) {
          console.error(`Failed to get presigned URL for ${filePath}:`, error);
        }
      });
      
      await Promise.all(fetchPromises);
    };
    
    if (requests.length > 0) {
      fetchAvatarUrls();
    }
  }, [requests, avatarUrls]);


  const transformFriendRequest = useCallback((req, idx = 0) => {

    if (req.senderName || req.senderEmail) {
      const displayName = req.senderName || req.senderEmail?.split('@')[0] || 'Unknown User';
      const avatarFile = req.senderProfileImageUrl && !req.senderProfileImageUrl.startsWith('http') 
        ? req.senderProfileImageUrl 
        : null;
      const avatarUrl = req.senderProfileImageUrl?.startsWith('http') 
        ? req.senderProfileImageUrl 
        : (avatarUrls[req.senderProfileImageUrl] || null);
      
      return {
        id: `friend-${req.id || req.senderEmail || idx}`,
        type: 'friend',
        name: displayName,
        requester: displayName,
        requesterEmail: req.senderEmail,
        userId: req.referenceId || req.id,
        firstName: req.senderName?.split(' ')[0],
        lastName: req.senderName?.split(' ').slice(1).join(' '),
        avatar: avatarUrl,
        avatarFile: avatarFile,
        notificationId: req.id,
        referenceId: req.referenceId, 
        read: req.read || false,
        createdAt: req.createdAt
      };
    }
    
          let displayName = 'Unknown User';
          if (req.username) {
            displayName = req.username;
    } else if (req.name) {
      displayName = req.name;
    } else if (req.email || req.requesterEmail) {
      displayName = (req.email || req.requesterEmail).split('@')[0];
          }
          
          return {
            id: `friend-${req.id || req.requesterEmail || req.email || idx}`,
            type: 'friend',
            name: displayName,
            requester: displayName,
            requesterEmail: req.email || req.requesterEmail,
            userId: req.id || req.userId,
            firstName: req.firstName,
            lastName: req.lastName,
            avatar: req.avatar || req.avatarUrl || req.profileImage || null
          };
  }, [avatarUrls]);

  const transformCommunityRequest = useCallback((req, communityId, communityName) => {
    // Handle new WebSocket format
    if (req.senderName || req.senderEmail) {
      const displayName = req.senderName || req.senderEmail?.split('@')[0] || 'Unknown';
      const avatarFile = req.senderProfileImageUrl && !req.senderProfileImageUrl.startsWith('http') 
        ? req.senderProfileImageUrl 
        : null;
      const avatarUrl = req.senderProfileImageUrl?.startsWith('http') 
        ? req.senderProfileImageUrl 
        : (avatarUrls[req.senderProfileImageUrl] || null);
      
      return {
        id: `${req.communityId || communityId}-${req.referenceId || req.id}`,
        communityId: req.communityId || communityId,
        type: 'community',
        name: req.communityName || communityName,
        requester: displayName,
        requesterEmail: req.senderEmail,
        userId: req.referenceId || req.id,
        avatar: avatarUrl,
        avatarFile: avatarFile, 
        notificationId: req.id,
        referenceId: req.referenceId, 
        read: req.read || false,
        createdAt: req.createdAt
      };
    }
    
    // Handle legacy format
    return {
      id: `${communityId}-${req.userId || req.id}`,
                communityId,
                type: 'community',
                name: communityName,
                requester: req.username || req.email?.split('@')[0] || 'Unknown',
                requesterEmail: req.email,
      userId: req.userId || req.id,
                avatar: req.avatar || null
    };
  }, [avatarUrls]);


  useEffect(() => {
    if (isOpen) {
      dispatch(markAllAsRead());
    }
  }, [isOpen, dispatch]);

  useEffect(() => {
    const storedEmail = getStoredUserEmail();
    const userEmail = user?.email || storedEmail;

    if (!userEmail) {
      return;
    }

    const handleWebSocketEvent = (eventType, data) => {
      console.log('InboxModal: WebSocket event received', eventType, data);
      
      switch (eventType) {
        case 'connected':
          dispatch(setWsConnected(true));
          if (isOpen) {
            dispatch(setLoading(true));
            webSocketService.requestNotifications();
          }
          break;
        case 'disconnected':
          dispatch(setWsConnected(false));
          break;
        case 'friend_request': {
          const friendReq = transformFriendRequest(data);
          dispatch(addRequest(friendReq));
          if (isOpen) {
            dispatch(setLoading(false));
          }
          if (!data.read) {
            window.dispatchEvent(new CustomEvent('toast', {
              detail: { message: `${friendReq.requester} wants to be your friend`, type: 'info' }
            }));
          }
          break;
        }
        case 'friend_requests_bulk': {
          const friendRequests = Array.isArray(data) ? data.map((req, idx) => transformFriendRequest(req, idx)) : [];
          const currentRequests = requestsRef.current || [];
          const existingNonFriend = currentRequests.filter((r) => r.type !== 'friend');
          dispatch(setRequests([...existingNonFriend, ...friendRequests]));
          if (isOpen) {
            dispatch(setLoading(false));
          }
          if (friendRequests.length === 0 && existingNonFriend.length === 0) {
            dispatch(setRequests([]));
          }
          break;
        }
        case 'community_request': {
          const notificationData = data.request || data;
          // Only skip if explicitly marked as non-actionable
          // COMMUNITY_JOINED with actionable=true means someone wants to join
          if (notificationData.actionable === false || (data.actionable === false && !notificationData.actionable)) {
            console.log('InboxModal: Skipping non-actionable community notification', notificationData);
            break;
          }
          const commReq = transformCommunityRequest(
            notificationData,
            notificationData.communityId || data.communityId || data.community?.id,
            notificationData.communityName || data.communityName || data.community?.name
          );
          console.log('InboxModal: Adding community request', commReq, 'from notification', notificationData);
          dispatch(addRequest(commReq));
          if (isOpen) {
            dispatch(setLoading(false));
          }
          if (!notificationData.read && !data.read) {
          window.dispatchEvent(new CustomEvent('toast', {
              detail: { message: `${commReq.requester} wants to join ${commReq.name}`, type: 'info' }
          }));
        }
          break;
        }
        case 'community_requests_bulk': {
          const communityRequests = [];
          if (Array.isArray(data)) {
            data.forEach((item) => {
              if (item.communityId || item.communityName) {
                communityRequests.push(transformCommunityRequest(item, item.communityId, item.communityName));
              } else {
                const { communityId, communityName, requests: commRequests } = item;
                if (Array.isArray(commRequests)) {
                  commRequests.forEach((req) => {
                    communityRequests.push(transformCommunityRequest(req, communityId, communityName));
                  });
                }
              }
            });
          }
          const currentReqs = requestsRef.current || [];
          const existingNonCommunity = currentReqs.filter((r) => r.type !== 'community');
          dispatch(setRequests([...existingNonCommunity, ...communityRequests]));
          if (isOpen) {
            dispatch(setLoading(false));
          }
          if (communityRequests.length === 0 && existingNonCommunity.length === 0) {
            dispatch(setRequests([]));
          }
          break;
        }
        case 'friend_request_response':
          if (data.accepted) {
            window.dispatchEvent(new CustomEvent('toast', {
              detail: { message: 'Friend request accepted!', type: 'success' }
            }));
          }
          break;
        case 'notification': {
          const allRequests = [];
          if (data.friendRequests) {
            const friendReqs = Array.isArray(data.friendRequests)
              ? data.friendRequests.map((req, idx) => transformFriendRequest(req, idx))
              : [];
            allRequests.push(...friendReqs);
          }
          if (data.communityRequests) {
            if (Array.isArray(data.communityRequests)) {
              data.communityRequests.forEach((item) => {
                if (item.communityId || item.communityName) {
                  allRequests.push(transformCommunityRequest(item, item.communityId, item.communityName));
                } else {
                  const { communityId, communityName, requests: commRequests } = item;
                  if (Array.isArray(commRequests)) {
                    commRequests.forEach((req) => {
                      allRequests.push(transformCommunityRequest(req, communityId, communityName));
                    });
                  }
                }
              });
            }
          }
          if (allRequests.length > 0) {
            const currentReqsForNotification = requestsRef.current || [];
            const existingNonMatching = currentReqsForNotification.filter(
              (r) => !allRequests.some((newReq) => newReq.id === r.id)
            );
            dispatch(setRequests([...existingNonMatching, ...allRequests]));
          } else if (
            (Array.isArray(data.friendRequests) && data.friendRequests.length === 0) ||
            (Array.isArray(data.communityRequests) && data.communityRequests.length === 0)
          ) {
            dispatch(setRequests([]));
          }
          if (isOpen) {
            dispatch(setLoading(false));
          }
          break;
        }
        case 'error':
          dispatch(setError('WebSocket connection error'));
          if (isOpen) {
            dispatch(setLoading(false));
          }
          break;
        default:
          console.log('InboxModal: Unhandled WebSocket event', eventType, data);
          break;
      }
    };

    const removeListener = webSocketService.addListener(handleWebSocketEvent);

    return () => {
      removeListener();
    };
  }, [user, dispatch, isOpen, transformFriendRequest, transformCommunityRequest]);

  // Request notifications when modal opens
  useEffect(() => {
    if (!isOpen) return;

    dispatch(setLoading(true));
    
    if (webSocketService.isConnected()) {
      webSocketService.requestNotifications();
      const loadingTimeout = setTimeout(() => {
        dispatch(setLoading(false));
      }, 5000);
      return () => clearTimeout(loadingTimeout);
    } else {
      dispatch(setLoading(false));
    }
  }, [isOpen, dispatch]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleAccept = async (requestId) => {
    const request = requests.find(r => r.id === requestId);
    if (!request) return;

    dispatch(setProcessingRequest(requestId));
    
    const storedEmail = getStoredUserEmail();
    const userEmail = user?.email || storedEmail;

    if (!userEmail) {
      dispatch(setError('User email not found'));
      dispatch(setProcessingRequest(null));
      return;
    }

    try {
      if (request.type === 'friend') {
        // Handle friend request accept
        await respondToFriendRequest({
          userEmail: userEmail,
          requesterEmail: request.requesterEmail,
          accept: true
        });
        // Show toast notification
        window.dispatchEvent(new CustomEvent('toast', {
          detail: { message: 'Friend request accepted!', type: 'success' }
        }));
        try {
          window.dispatchEvent(new Event('friends:refresh'));
        } catch {
          // Refresh notification is best-effort.
        }
      } else {
        await acceptJoinRequest({
          communityName: request.name,
          creatorEmail: userEmail,
          userEmail: request.requesterEmail
        });
      }
      
      if (request.referenceId) {
        try {
          await deleteNotificationByReference(request.referenceId);
        } catch (deleteErr) {
          console.warn('Failed to delete notification:', deleteErr);
        }
      }
      
      dispatch(removeRequest(requestId));
    } catch (err) {
      console.error('Error accepting request:', err);
      dispatch(setError(err.message || 'Failed to accept request'));
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: err.message || 'Failed to accept request', type: 'error' }
      }));
    } finally {
      dispatch(setProcessingRequest(null));
    }
  };

  const handleReject = async (requestId) => {
    const request = requests.find(r => r.id === requestId);
    if (!request) return;

    dispatch(setProcessingRequest(requestId));
    
    const storedEmail = getStoredUserEmail();
    const userEmail = user?.email || storedEmail;

    if (!userEmail) {
      dispatch(setError('User email not found'));
      dispatch(setProcessingRequest(null));
      return;
    }

    try {
      if (request.type === 'friend') {
        // Handle friend request reject
        await respondToFriendRequest({
          userEmail: userEmail,
          requesterEmail: request.requesterEmail,
          accept: false
        });
        // Show toast notification
        window.dispatchEvent(new CustomEvent('toast', {
          detail: { message: 'Friend request rejected', type: 'info' }
        }));
      } else {
        // Handle community join request reject (existing functionality)
        await rejectJoinRequest({
          communityName: request.name,
          creatorEmail: userEmail,
          userEmail: request.requesterEmail
        });
      }

      if (request.referenceId) {
        try {
          await deleteNotificationByReference(request.referenceId);
        } catch (deleteErr) {
          console.warn('Failed to delete notification:', deleteErr);
        }
      }

      dispatch(removeRequest(requestId));
    } catch (err) {
      console.error('Error rejecting request:', err);
      dispatch(setError(err.message || 'Failed to reject request'));
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: err.message || 'Failed to reject request', type: 'error' }
      }));
    } finally {
      dispatch(setProcessingRequest(null));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#282828]/50 flex items-start justify-center md:justify-end z-50 p-0 md:pt-10 md:pr-6 modal-backdrop">
      <div 
        ref={modalRef}
        className="bg-white rounded-none md:rounded-xl shadow-2xl w-full h-full md:w-[420px] md:max-h-[calc(100vh-80px)] md:h-auto flex flex-col overflow-hidden modal-content"
      >
        {/* Header */}
        <div className="bg-white px-4 md:px-6 py-4 md:py-5 relative">
          <button
            onClick={onClose}
            className="absolute top-3 md:top-4 right-3 md:right-4 w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
            title="Close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          <div className="flex items-center gap-2.5 mb-4 md:mb-5">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-700">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M9 21V9" />
            </svg>
            <h2 className="text-lg md:text-xl font-bold text-gray-800">Inbox</h2>
          </div>

        </div>

        {/* Content Area for requests */}
        <div className="flex-1 overflow-y-auto min-h-0 md:min-h-[450px] bg-blue-100/90 px-3 md:px-4 py-3 md:py-4">
          {loading ? (
            // Shimmer loading effect
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, idx) => (
                <div key={idx} className="flex items-center gap-4 bg-white rounded-lg p-4 shadow-sm animate-pulse">
                  <div className="w-12 h-12 rounded-full bg-gray-300" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 bg-gray-300 rounded" />
                    <div className="h-3 w-1/2 bg-gray-200 rounded" />
                  </div>
                  <div className="flex gap-2">
                    <div className="w-16 h-8 bg-gray-300 rounded" />
                    <div className="w-16 h-8 bg-gray-300 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center text-red-500 py-12 text-sm">
              {error}
            </div>
          ) : (
            <div className="space-y-3">
              {!loading && requests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-gray-500 text-sm font-medium">No requests</p>
                  <p className="text-gray-400 text-xs mt-1">You don't have any pending requests</p>
                </div>
              ) : (
                requestsWithAvatars.map((request) => (
                  <div key={request.id} className="flex items-center gap-3 md:gap-4 bg-white rounded-lg p-3 md:p-4 shadow-sm">
                    {/* Avatar */}
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                      {request.avatar ? (
                        <img 
                          src={request.avatar} 
                          alt={request.requester} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            if (e.target.nextSibling) {
                              e.target.nextSibling.style.display = 'flex';
                            }
                          }}
                        />
                      ) : null}
                      <div className="w-full h-full bg-gray-300 flex items-center justify-center" style={{ display: request.avatar ? 'none' : 'flex' }}>
                          <span className="text-xs font-semibold text-gray-600">
                            {request.requester?.charAt(0) || 'U'}
                          </span>
                        </div>
                    </div>

                    {/* Request Info */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-800 leading-tight">
                        {request.type === 'friend' ? (
                          <span>{request.requester} wants to be your friend</span>
                        ) : (
                          <>
                            {request.name}
                            <span className="text-xs font-normal text-gray-500 ml-1">
                              ({request.type})
                            </span>
                          </>
                        )}
                      </div>
                      {request.type !== 'friend' && (
                        <div className="text-xs text-gray-600 mt-1">
                          {request.requester}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-1.5 md:gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleReject(request.id)}
                        disabled={processingRequest === request.id}
                        className="px-2.5 md:px-4 py-1.5 md:py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-300 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-md transition-colors"
                      >
                        {processingRequest === request.id ? 'Processing...' : 'Reject'}
                      </button>
                      <button
                        onClick={() => handleAccept(request.id)}
                        disabled={processingRequest === request.id}
                        className="px-2.5 md:px-4 py-1.5 md:py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-md transition-colors"
                      >
                        {processingRequest === request.id ? 'Processing...' : 'Accept'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InboxModal;
