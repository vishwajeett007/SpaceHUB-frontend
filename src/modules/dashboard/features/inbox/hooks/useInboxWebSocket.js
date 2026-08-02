import { useCallback, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import webSocketService from '../../../../../shared/services/WebSocketService';
import { showToast } from '../../../../../shared/services/toast';
import {
  addRequest,
  setError,
  setLoading,
  setRequests,
  setWsConnected,
} from '../../../../../shared/store/slices/inboxSlice';
import {
  normalizeCommunityRequest,
  normalizeCommunityRequests,
  normalizeFriendRequest,
  normalizeNotificationRequests,
} from '../utils/requestNormalization';

export const useInboxWebSocket = ({
  avatarUrls,
  isOpen,
  requests,
  userEmail,
}) => {
  const dispatch = useDispatch();
  const requestsRef = useRef(requests);

  useEffect(() => {
    requestsRef.current = requests;
  }, [requests]);

  const transformFriendRequest = useCallback(
    (request, index = 0) => normalizeFriendRequest(request, index, avatarUrls),
    [avatarUrls],
  );
  const transformCommunityRequest = useCallback(
    (request, communityId, communityName) => normalizeCommunityRequest(
      request,
      communityId,
      communityName,
      avatarUrls,
    ),
    [avatarUrls],
  );

  useEffect(() => {
    if (!userEmail) return undefined;

    const handleWebSocketEvent = (eventType, data) => {
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
          const friendRequest = transformFriendRequest(data);
          dispatch(addRequest(friendRequest));
          if (isOpen) dispatch(setLoading(false));
          if (!data.read) {
            showToast(`${friendRequest.requester} wants to be your friend`, 'info');
          }
          break;
        }

        case 'friend_requests_bulk': {
          const friendRequests = Array.isArray(data)
            ? data.map((request, index) => transformFriendRequest(request, index))
            : [];
          const existingNonFriend = requestsRef.current.filter(
            (request) => request.type !== 'friend',
          );
          dispatch(setRequests([...existingNonFriend, ...friendRequests]));
          if (isOpen) dispatch(setLoading(false));
          if (friendRequests.length === 0 && existingNonFriend.length === 0) {
            dispatch(setRequests([]));
          }
          break;
        }

        case 'community_request': {
          const notificationData = data.request || data;
          const isNonActionable = notificationData.actionable === false
            || (data.actionable === false && !notificationData.actionable);
          if (isNonActionable) break;

          const communityRequest = transformCommunityRequest(
            notificationData,
            notificationData.communityId || data.communityId || data.community?.id,
            notificationData.communityName || data.communityName || data.community?.name,
          );
          dispatch(addRequest(communityRequest));
          if (isOpen) dispatch(setLoading(false));
          if (!notificationData.read && !data.read) {
            showToast(
              `${communityRequest.requester} wants to join ${communityRequest.name}`,
              'info',
            );
          }
          break;
        }

        case 'community_requests_bulk': {
          const communityRequests = normalizeCommunityRequests(data, avatarUrls);
          const existingNonCommunity = requestsRef.current.filter(
            (request) => request.type !== 'community',
          );
          dispatch(setRequests([...existingNonCommunity, ...communityRequests]));
          if (isOpen) dispatch(setLoading(false));
          if (communityRequests.length === 0 && existingNonCommunity.length === 0) {
            dispatch(setRequests([]));
          }
          break;
        }

        case 'friend_request_response':
          if (data.accepted) {
            showToast('Friend request accepted!', 'success');
          }
          break;

        case 'notification': {
          const allRequests = normalizeNotificationRequests(data, avatarUrls);
          if (allRequests.length > 0) {
            const existingNonMatching = requestsRef.current.filter(
              (request) => !allRequests.some((incoming) => incoming.id === request.id),
            );
            dispatch(setRequests([...existingNonMatching, ...allRequests]));
          } else if (
            (Array.isArray(data.friendRequests) && data.friendRequests.length === 0)
            || (Array.isArray(data.communityRequests) && data.communityRequests.length === 0)
          ) {
            dispatch(setRequests([]));
          }
          if (isOpen) dispatch(setLoading(false));
          break;
        }

        case 'error':
          dispatch(setError('WebSocket connection error'));
          if (isOpen) dispatch(setLoading(false));
          break;

        default:
          break;
      }
    };

    const removeListener = webSocketService.addListener(handleWebSocketEvent);
    return removeListener;
  }, [
    avatarUrls,
    dispatch,
    isOpen,
    transformCommunityRequest,
    transformFriendRequest,
    userEmail,
  ]);
};
