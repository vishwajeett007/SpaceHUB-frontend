import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../../../../../shared/contexts/AuthContextContext';
import {
  acceptJoinRequest,
  deleteNotificationByReference,
  rejectJoinRequest,
  respondToFriendRequest,
} from '../../../../../shared/services/API';
import { getStoredUserEmail } from '../../../../../shared/services/authStorage';
import { showToast } from '../../../../../shared/services/toast';
import webSocketService from '../../../../../shared/services/WebSocketService';
import {
  markAllAsRead,
  removeRequest,
  selectInboxError,
  selectInboxLoading,
  selectProcessingRequest,
  selectRequests,
  setError,
  setLoading,
  setProcessingRequest,
} from '../../../../../shared/store/slices/inboxSlice';
import { useInboxWebSocket } from './useInboxWebSocket';
import { useRequestAvatars } from './useRequestAvatars';

const dispatchFriendsRefresh = () => {
  try {
    window.dispatchEvent(new Event('friends:refresh'));
  } catch {
    // Refresh notification is best-effort.
  }
};

export const useInboxController = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const modalRef = useRef(null);
  const { user } = useAuth();
  const requests = useSelector(selectRequests);
  const loading = useSelector(selectInboxLoading);
  const error = useSelector(selectInboxError);
  const processingRequest = useSelector(selectProcessingRequest);
  const { avatarUrls, requestsWithAvatars } = useRequestAvatars(requests);
  const userEmail = user?.email || getStoredUserEmail();

  useEffect(() => {
    if (isOpen) dispatch(markAllAsRead());
  }, [dispatch, isOpen]);

  useInboxWebSocket({
    avatarUrls,
    isOpen,
    requests,
    userEmail,
  });

  useEffect(() => {
    if (!isOpen) return undefined;

    dispatch(setLoading(true));
    if (!webSocketService.isConnected()) {
      dispatch(setLoading(false));
      return undefined;
    }

    webSocketService.requestNotifications();
    const loadingTimeout = window.setTimeout(() => {
      dispatch(setLoading(false));
    }, 5000);

    return () => window.clearTimeout(loadingTimeout);
  }, [dispatch, isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const respondToRequest = useCallback(async (requestId, accepted) => {
    const request = requests.find((candidate) => candidate.id === requestId);
    if (!request) return;

    dispatch(setProcessingRequest(requestId));
    const currentUserEmail = user?.email || getStoredUserEmail();

    if (!currentUserEmail) {
      dispatch(setError('User email not found'));
      dispatch(setProcessingRequest(null));
      return;
    }

    try {
      if (request.type === 'friend') {
        await respondToFriendRequest({
          userEmail: currentUserEmail,
          requesterEmail: request.requesterEmail,
          accept: accepted,
        });
        showToast(
          accepted ? 'Friend request accepted!' : 'Friend request rejected',
          accepted ? 'success' : 'info',
        );
        if (accepted) dispatchFriendsRefresh();
      } else {
        const respondToCommunityRequest = accepted
          ? acceptJoinRequest
          : rejectJoinRequest;
        await respondToCommunityRequest({
          communityName: request.name,
          creatorEmail: currentUserEmail,
          userEmail: request.requesterEmail,
        });
      }

      if (request.referenceId) {
        try {
          await deleteNotificationByReference(request.referenceId);
        } catch (deleteError) {
          console.warn('Failed to delete notification:', deleteError);
        }
      }

      dispatch(removeRequest(requestId));
    } catch (requestError) {
      const fallbackMessage = accepted
        ? 'Failed to accept request'
        : 'Failed to reject request';
      const message = requestError.message || fallbackMessage;
      console.error(`Error ${accepted ? 'accepting' : 'rejecting'} request:`, requestError);
      dispatch(setError(message));
      showToast(message, 'error');
    } finally {
      dispatch(setProcessingRequest(null));
    }
  }, [dispatch, requests, user?.email]);

  const handleAccept = useCallback(
    (requestId) => respondToRequest(requestId, true),
    [respondToRequest],
  );
  const handleReject = useCallback(
    (requestId) => respondToRequest(requestId, false),
    [respondToRequest],
  );

  return {
    error,
    handleAccept,
    handleReject,
    loading,
    modalRef,
    processingRequest,
    requests: requestsWithAvatars,
  };
};
