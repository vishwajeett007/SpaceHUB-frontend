import { useCallback, useEffect, useRef, useState } from 'react';
import { BASE_URL, joinRoom } from '../../../../../shared/services/API';
import { showToast } from '../../../../../shared/services/toast';
import {
  appendJoinAnnouncement,
  createCommunityFilePayloads,
  isCommunityFileMessage,
  normalizeCommunityHistory,
  normalizeCommunityMessage,
  normalizeJoinAnnouncement,
  upsertCommunityFileMessage,
  upsertCommunityTextMessage,
} from '../utils/messageNormalization';
import { getCommunityChatWebSocketUrl } from '../utils/webSocket';

const RECONNECT_DELAY_MS = 10000;

const readImageAsDataUrl = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(blob);
});

const convertImagesToDataUrls = async (images) => {
  const dataUrls = [];

  for (const imageUrl of images) {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      dataUrls.push(await readImageAsDataUrl(blob));
    } catch (error) {
      console.error('Failed to process image:', error);
    }
  }

  return dataUrls;
};

export const useCommunityChat = ({
  activeChatRoomCode,
  currentMode,
  getCachedAvatar,
  getCachedUsername,
  roomCode,
  userEmail,
}) => {
  const [messages, setMessages] = useState([]);
  const socketRef = useRef(null);
  const socketRoomCodeRef = useRef(null);
  const messageSequenceRef = useRef(0);

  const createMessageId = useCallback((prefix) => {
    messageSequenceRef.current += 1;
    return `${prefix}-${Date.now()}-${messageSequenceRef.current}`;
  }, []);

  const handleIncomingPayload = useCallback((payload) => {
    const defaultTimestamp = new Date().toISOString();
    const normalizationContext = {
      currentUserEmail: userEmail,
      defaultTimestamp,
      getCachedAvatar,
      getCachedUsername,
    };
    const history = normalizeCommunityHistory(payload, normalizationContext);

    if (history !== null) {
      console.log('Received chat history:', history.length, 'messages');
      setMessages(history);
      return;
    }

    if (isCommunityFileMessage(payload)) {
      const fileMessage = normalizeCommunityMessage(payload, {
        ...normalizationContext,
        fallbackId: createMessageId('file'),
      });
      setMessages((currentMessages) => (
        upsertCommunityFileMessage(currentMessages, fileMessage)
      ));
      return;
    }

    const isLegacyMessage = typeof payload?.message === 'string';
    const isTypedMessage = payload?.type === 'message' || payload?.type === 'chat';
    if (!isLegacyMessage && !isTypedMessage) return;

    const text = isLegacyMessage
      ? payload.message
      : payload.text || payload.content || '';
    const announcement = normalizeJoinAnnouncement(text, payload, {
      currentUserEmail: userEmail,
      defaultTimestamp,
      fallbackId: createMessageId('system'),
      getCachedUsername,
    });

    if (announcement) {
      setMessages((currentMessages) => (
        appendJoinAnnouncement(currentMessages, announcement.message)
      ));

      if (!announcement.isSelf) {
        showToast(announcement.message.text, 'info');
      }
      return;
    }

    const receivedMessage = normalizeCommunityMessage(payload, {
      ...normalizationContext,
      fallbackId: createMessageId('m'),
    });
    setMessages((currentMessages) => (
      upsertCommunityTextMessage(currentMessages, receivedMessage)
    ));
  }, [
    createMessageId,
    getCachedAvatar,
    getCachedUsername,
    userEmail,
  ]);

  useEffect(() => {
    if (currentMode !== 'chat') {
      const socket = socketRef.current;
      if (socket) {
        try {
          socket.close(1000, 'Community chat changed mode');
        } catch (error) {
          console.warn('Failed to close community WebSocket:', error);
        }
      }
      socketRef.current = null;
      socketRoomCodeRef.current = null;
      setMessages([]);
      return undefined;
    }

    if (!userEmail || !roomCode) return undefined;

    const webSocketRoomCode = activeChatRoomCode || roomCode;
    const webSocketUrl = getCommunityChatWebSocketUrl(
      BASE_URL,
      webSocketRoomCode,
      userEmail,
    );
    let activeSocket = null;
    let reconnectTimeout = null;
    let disposed = false;

    if (socketRoomCodeRef.current !== webSocketRoomCode) {
      setMessages([]);
    }

    const closeSocket = (socket, reason) => {
      if (!socket) return;
      if (
        socket.readyState !== WebSocket.OPEN
        && socket.readyState !== WebSocket.CONNECTING
      ) {
        return;
      }

      try {
        socket.close(1000, reason);
      } catch (error) {
        console.warn('Failed to close community WebSocket:', error);
      }
    };

    closeSocket(socketRef.current, 'Community chat room changed');

    const connect = () => {
      if (disposed) return;

      try {
        const socket = new WebSocket(webSocketUrl);
        activeSocket = socket;
        socketRef.current = socket;
        socketRoomCodeRef.current = webSocketRoomCode;

        socket.onopen = () => {
          console.log('WebSocket connected to room:', webSocketRoomCode);
        };

        socket.onmessage = (event) => {
          try {
            handleIncomingPayload(JSON.parse(event.data));
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        socket.onerror = (error) => {
          console.error('WebSocket error:', error);
        };

        socket.onclose = (event) => {
          console.log('WebSocket disconnected', event.code, event.reason);
          if (socketRef.current === socket) socketRef.current = null;
          if (disposed) return;
          if (event.code === 1000) {
            if (socketRoomCodeRef.current === webSocketRoomCode) {
              socketRoomCodeRef.current = null;
            }
            return;
          }

          console.log('Attempting to reconnect WebSocket for community chat...');
          reconnectTimeout = setTimeout(connect, RECONNECT_DELAY_MS);
        };
      } catch (error) {
        console.error('Failed to create WebSocket:', error);
        socketRoomCodeRef.current = null;
      }
    };

    const initializeConnection = async () => {
      if (!activeChatRoomCode) {
        try {
          await joinRoom(roomCode, userEmail);
        } catch {
          // The socket can still connect when room membership already exists.
        }
      }

      connect();
    };

    initializeConnection();

    return () => {
      disposed = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      closeSocket(activeSocket, 'Community chat changed or unmounted');
      if (socketRef.current === activeSocket) socketRef.current = null;
      if (socketRoomCodeRef.current === webSocketRoomCode) {
        socketRoomCodeRef.current = null;
      }
    };
  }, [
    activeChatRoomCode,
    currentMode,
    handleIncomingPayload,
    roomCode,
    userEmail,
  ]);

  const sendMessage = useCallback(async (message) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;

    try {
      const attachments = Array.isArray(message.attachments)
        ? message.attachments
        : [];
      const filePayloads = createCommunityFilePayloads(attachments);

      filePayloads.forEach((filePayload) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify(filePayload));
        }
      });

      if (!message.text?.trim()) return;

      const payload = { message: message.text };
      if (
        attachments.length === 0
        && Array.isArray(message.images)
        && message.images.length > 0
      ) {
        const dataUrls = await convertImagesToDataUrls(message.images);
        if (dataUrls.length > 0) payload.images = dataUrls;
      }

      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify(payload));
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, []);

  return { messages, sendMessage };
};
