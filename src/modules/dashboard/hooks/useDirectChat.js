import { useCallback, useEffect, useRef, useState } from 'react';
import { BASE_URL, getChatHistory } from '../../../shared/services/API';
import { showToast } from '../../../shared/services/toast';
import { resolveDashboardAssetUrl } from '../utils/assets';
import {
  DEFAULT_AVATAR,
  extractChatHistory,
  formatFriendName,
  getDirectChatWebSocketUrl,
  getMessageReceiver,
  getMessageSender,
  isIgnoredDirectMessage,
  isMessageInConversation,
  normalizeDirectMessage,
  normalizeDirectMessageList,
  sortMessagesByTime,
  upsertDirectMessage,
} from '../utils/directChat';

const CONNECTION_TIMEOUT_MS = 10000;
const RECONNECT_DELAY_MS = 3000;

const showErrorToast = (message) => showToast(message, 'error');

const showDesktopToast = (message, type = 'error') => {
  if (window.innerWidth >= 768) showToast(message, type);
};

const getFriendAvatar = (friend) => (
  friend?.avatar || friend?.avatarUrl || friend?.profileImage || DEFAULT_AVATAR
);

const createNormalizationContext = ({
  currentUserAvatar,
  currentUserEmail,
  currentUserName,
  defaultTimestamp,
  friendAvatar,
  friendEmail,
  friendName,
  fallbackId,
}) => ({
  currentUserAvatar,
  currentUserEmail,
  currentUserName,
  defaultTimestamp,
  fallbackId,
  friendAvatar,
  friendEmail,
  friendName,
  resolveImageUrl: (imageUrl) => resolveDashboardAssetUrl(imageUrl, BASE_URL),
});

export const useDirectChat = ({ friend, user, userEmail }) => {
  const [messages, setMessages] = useState([]);
  const [wsStatus, setWsStatus] = useState('not-connected');
  const wsRef = useRef(null);
  const messageSequenceRef = useRef(0);

  const friendEmail = friend?.email || '';
  const friendName = formatFriendName(friend);
  const friendAvatar = getFriendAvatar(friend);
  const currentUserName = user?.username || userEmail;
  const optimisticUserName = user?.username || userEmail.split('@')[0] || 'You';
  const currentUserAvatar = user?.avatarUrl || DEFAULT_AVATAR;

  const createMessageId = useCallback((prefix) => {
    messageSequenceRef.current += 1;
    return `${prefix}-${Date.now()}-${messageSequenceRef.current}`;
  }, []);

  useEffect(() => {
    if (!friendEmail || !userEmail) {
      setMessages([]);
      return undefined;
    }

    let cancelled = false;

    const loadHistory = async () => {
      try {
        const response = await getChatHistory(userEmail, friendEmail);
        if (cancelled) return;

        const history = normalizeDirectMessageList(
          extractChatHistory(response),
          createNormalizationContext({
            currentUserAvatar,
            currentUserEmail: userEmail,
            currentUserName,
            defaultTimestamp: new Date().toISOString(),
            friendAvatar,
            friendEmail,
            friendName,
          }),
          { idPrefix: 'history' },
        );
        setMessages(history);
      } catch (error) {
        console.error('Failed to load chat history:', error);
        if (!cancelled) {
          setMessages([]);
          showErrorToast('Unable to load chat history.');
        }
      }
    };

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, [
    currentUserAvatar,
    currentUserName,
    friendAvatar,
    friendEmail,
    friendName,
    userEmail,
  ]);

  useEffect(() => {
    if (!friendEmail || !userEmail) return undefined;

    let activeSocket = null;
    let connectionTimeout = null;
    let reconnectTimeout = null;
    let disposed = false;

    const clearConnectionTimeout = () => {
      if (!connectionTimeout) return;
      clearTimeout(connectionTimeout);
      connectionTimeout = null;
    };

    const handleIncomingMessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const normalizationContext = createNormalizationContext({
          currentUserAvatar,
          currentUserEmail: userEmail,
          currentUserName,
          defaultTimestamp: new Date().toISOString(),
          friendAvatar,
          friendEmail,
          friendName,
        });

        if (data?.type === 'history' && Array.isArray(data.messages)) {
          const history = normalizeDirectMessageList(data.messages, normalizationContext, {
            filterConversation: true,
            idPrefix: 'ws-history',
            sortBeforeNormalize: true,
          });
          setMessages(history);
          return;
        }

        if (isIgnoredDirectMessage(data)) return;

        const sender = getMessageSender(data);
        const receiver = getMessageReceiver(data);
        const belongsToConversation = isMessageInConversation(data, userEmail, friendEmail);

        if (!belongsToConversation && sender && receiver) {
          console.log('Message not for current chat, ignoring:', {
            sender,
            receiver,
            currentUserEmail: userEmail,
            currentFriendEmail: friendEmail,
          });
          return;
        }

        const receivedMessage = normalizeDirectMessage(data, {
          ...normalizationContext,
          fallbackId: createMessageId('msg'),
        });
        setMessages((currentMessages) => upsertDirectMessage(currentMessages, receivedMessage));
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error, event.data);
      }
    };

    const connect = () => {
      if (disposed) return;

      const wsUrl = getDirectChatWebSocketUrl(BASE_URL, userEmail, friendEmail);

      try {
        setWsStatus('connecting');
        const socket = new WebSocket(wsUrl);
        activeSocket = socket;
        wsRef.current = socket;

        connectionTimeout = setTimeout(() => {
          if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CLOSED) return;

          console.error('WebSocket connection timeout');
          socket.close();
          setWsStatus('not-connected');
          showErrorToast('Connection timeout. Please try again.');
        }, CONNECTION_TIMEOUT_MS);

        socket.onopen = () => {
          clearConnectionTimeout();
          if (!disposed) setWsStatus('connected');
        };

        socket.onmessage = handleIncomingMessage;

        socket.onerror = (error) => {
          console.error('WebSocket error:', error, 'URL:', wsUrl);
          if (!disposed) {
            setWsStatus('not-connected');
            showDesktopToast('Connection error. Please try again.');
          }
        };

        socket.onclose = (event) => {
          clearConnectionTimeout();
          if (wsRef.current === socket) wsRef.current = null;
          if (disposed) return;

          console.log('WebSocket disconnected', {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean,
            currentFriendEmail: friendEmail,
            currentUserEmail: userEmail,
          });
          setWsStatus('not-connected');

          if (event.code === 1000 || event.code === 1001) return;

          showDesktopToast('Connection closed. Reconnecting...', 'warning');
          reconnectTimeout = setTimeout(connect, RECONNECT_DELAY_MS);
        };
      } catch (error) {
        console.error('Failed to create WebSocket:', error);
        setWsStatus('not-connected');
        showErrorToast(error.message || 'Failed to connect to chat');
      }
    };

    connect();

    return () => {
      disposed = true;
      clearConnectionTimeout();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);

      if (activeSocket && (
        activeSocket.readyState === WebSocket.OPEN
        || activeSocket.readyState === WebSocket.CONNECTING
      )) {
        activeSocket.close(1000, 'Direct chat changed or unmounted');
      }
      if (wsRef.current === activeSocket) wsRef.current = null;
    };
  }, [
    createMessageId,
    currentUserAvatar,
    currentUserName,
    friendAvatar,
    friendEmail,
    friendName,
    userEmail,
  ]);

  const sendMessage = useCallback((text, attachments) => {
    if (!text && (!attachments || attachments.length === 0)) return;
    if (!friendEmail || !userEmail) return;

    const socket = wsRef.current;
    if (!socket) {
      console.error('WebSocket not initialized');
      showErrorToast('Connection not established. Please wait...');
      return;
    }

    if (socket.readyState === WebSocket.CONNECTING) {
      setTimeout(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          showToast('Please wait for connection to establish...', 'info');
        }
      }, 1000);
      return;
    }

    if (socket.readyState !== WebSocket.OPEN) {
      const stateMessages = {
        [WebSocket.CLOSING]: 'Connection closing...',
        [WebSocket.CLOSED]: 'Connection closed. Please refresh.',
      };
      showErrorToast(stateMessages[socket.readyState] || 'Not connected. Please wait...');
      return;
    }

    const normalizationContext = createNormalizationContext({
      currentUserAvatar,
      currentUserEmail: userEmail,
      currentUserName: optimisticUserName,
      friendAvatar,
      friendEmail,
      friendName,
    });
    const readyAttachments = (attachments || []).filter((attachment) => (
      (attachment.fileKey || attachment.fileUrl) && !attachment.uploading
    ));

    readyAttachments.forEach((attachment) => {
      try {
        const fileMessage = {
          type: 'FILE',
          fileName: attachment.fileName || attachment.file?.name || 'file',
          fileKey: attachment.fileKey || undefined,
          fileUrl: attachment.fileUrl || undefined,
          contentType: attachment.contentType || attachment.file?.type || 'application/octet-stream',
          senderEmail: userEmail,
          receiverEmail: friendEmail,
        };

        if (wsRef.current?.readyState !== WebSocket.OPEN) {
          throw new Error('WebSocket connection lost while sending file');
        }
        wsRef.current.send(JSON.stringify(fileMessage));

        const optimisticMessage = normalizeDirectMessage(fileMessage, {
          ...normalizationContext,
          defaultTimestamp: new Date().toISOString(),
          fallbackId: createMessageId('temp-file'),
        });
        setMessages((currentMessages) => sortMessagesByTime([
          ...currentMessages,
          optimisticMessage,
        ]));
      } catch (error) {
        console.error('Failed to send file via WebSocket:', error);
        showErrorToast(`Failed to send file: ${attachment.fileName || attachment.file?.name || 'file'}`);
      }
    });

    if (!text || !text.trim()) return;

    try {
      const payload = {
        content: text,
        senderEmail: userEmail,
        receiverEmail: friendEmail,
      };

      if (wsRef.current?.readyState !== WebSocket.OPEN) {
        throw new Error('WebSocket connection lost while sending message');
      }
      wsRef.current.send(JSON.stringify(payload));

      const optimisticMessage = normalizeDirectMessage(payload, {
        ...normalizationContext,
        defaultTimestamp: new Date().toISOString(),
        fallbackId: createMessageId('temp'),
      });
      setMessages((currentMessages) => upsertDirectMessage(currentMessages, optimisticMessage, {
        duplicateWindowMs: 1000,
        replaceOptimistic: false,
      }));
    } catch (error) {
      console.error('Failed to send text message via WebSocket:', error);
      showErrorToast('Failed to send message. Please try again.');
    }
  }, [
    createMessageId,
    currentUserAvatar,
    friendAvatar,
    friendEmail,
    friendName,
    optimisticUserName,
    userEmail,
  ]);

  return { messages, sendMessage, wsStatus };
};
