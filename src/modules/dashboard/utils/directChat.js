const DEFAULT_AVATAR = '/avatars/avatar-1.png';

const IMAGE_EXTENSIONS = new Set([
  'bmp',
  'gif',
  'jpeg',
  'jpg',
  'png',
  'svg',
  'webp',
]);

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const getComparableTime = (message) => {
  const value = message?.createdAt || message?.timestamp || message?.sentAt || message?.time || 0;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

export const formatFriendName = (friend = {}) => {
  if (friend.username) return friend.username;

  const fullName = [friend.firstName, friend.lastName].filter(Boolean).join(' ').trim();
  if (fullName) return fullName;
  if (friend.email) return friend.email.split('@')[0];

  return 'Unknown';
};

export const getMessageSender = (message = {}) => (
  message.senderEmail || message.sender || message.from || message.userEmail || message.email || ''
);

export const getMessageReceiver = (message = {}) => (
  message.receiverEmail || message.receiver || message.to || ''
);

export const sortMessagesByTime = (messages = []) => (
  [...messages].sort((left, right) => getComparableTime(left) - getComparableTime(right))
);

export const isImageFile = ({ contentType = '', fileName = '' } = {}) => {
  if (String(contentType).toLowerCase().startsWith('image/')) return true;

  const extension = String(fileName).toLowerCase().split('.').pop();
  return IMAGE_EXTENSIONS.has(extension);
};

export const isIgnoredDirectMessage = (message = {}) => (
  String(message.type || '').toUpperCase() === 'CONFIRM'
  || (message.messageId === null && message.optimistic === true)
);

export const isMessageInConversation = (message, currentUserEmail, friendEmail) => {
  const sender = normalizeEmail(getMessageSender(message));
  const receiver = normalizeEmail(getMessageReceiver(message));
  const currentUser = normalizeEmail(currentUserEmail);
  const friend = normalizeEmail(friendEmail);

  return (
    (sender === currentUser && receiver === friend)
    || (sender === friend && receiver === currentUser)
  );
};

const getTextContent = (message = {}) => {
  const content = message.content ?? message.message ?? message.text;

  if (typeof content === 'string') return content;
  if (typeof content === 'number') return String(content);
  if (!content || typeof content !== 'object') return '';
  if (content.text != null) return String(content.text);
  if (content.message != null) return String(content.message);
  if (content.content != null) return String(content.content);
  return '';
};

const getMessageId = (message, fallbackId) => (
  message.id || message.messageId || message._id || fallbackId
);

export const normalizeDirectMessage = (message = {}, context = {}) => {
  const {
    currentUserAvatar = DEFAULT_AVATAR,
    currentUserEmail = '',
    currentUserName = currentUserEmail,
    defaultTimestamp = '',
    fallbackId = '',
    friendAvatar = DEFAULT_AVATAR,
    friendName = 'Unknown',
    resolveImageUrl = (value) => value,
  } = context;

  const senderEmail = getMessageSender(message);
  const isSelf = normalizeEmail(senderEmail) === normalizeEmail(currentUserEmail);
  const createdAt = message.timestamp || message.createdAt || message.sentAt || message.time || defaultTimestamp;
  const sharedFields = {
    id: getMessageId(message, fallbackId),
    messageUuid: message.messageUuid,
    author: isSelf ? currentUserName : friendName,
    email: senderEmail,
    createdAt,
    avatar: isSelf ? currentUserAvatar : friendAvatar,
    isSelf,
  };

  const fileKey = message.fileKey || message.file_key || '';
  const fileUrl = message.fileUrl || message.file_url || '';
  const isFile = String(message.type || '').toUpperCase() === 'FILE' || Boolean(fileKey || fileUrl);

  if (isFile) {
    const fileName = message.fileName || message.file_name || getTextContent(message) || 'file';
    const contentType = message.contentType || message.content_type || '';
    const isImage = isImageFile({ contentType, fileName });

    return {
      ...sharedFields,
      text: fileName,
      images: isImage && (fileKey || fileUrl) ? [fileKey || fileUrl] : [],
      fileKey: fileKey || null,
      fileUrl: fileUrl || null,
      fileName,
      contentType,
      isFile: true,
      isImage,
    };
  }

  const rawImages = Array.isArray(message.images)
    ? message.images
    : message.image
      ? [message.image]
      : [];

  return {
    ...sharedFields,
    text: getTextContent(message),
    images: rawImages.map(resolveImageUrl),
  };
};

export const normalizeDirectMessageList = (messages, context = {}, options = {}) => {
  if (!Array.isArray(messages)) return [];

  const {
    filterConversation = false,
    idPrefix = 'history',
    sortBeforeNormalize = false,
  } = options;
  const source = sortBeforeNormalize ? sortMessagesByTime(messages) : messages;

  const normalized = source
    .filter((message, index, list) => {
      if (isIgnoredDirectMessage(message)) return false;

      if (message.messageUuid) {
        const firstIndex = list.findIndex((item) => item.messageUuid === message.messageUuid);
        if (firstIndex !== index) return false;
      }

      return !filterConversation || isMessageInConversation(
        message,
        context.currentUserEmail,
        context.friendEmail,
      );
    })
    .map((message, index) => normalizeDirectMessage(message, {
      ...context,
      fallbackId: `${idPrefix}-${index}`,
    }));

  return sortMessagesByTime(normalized);
};

export const extractChatHistory = (response) => {
  const candidates = [
    response?.data,
    response?.data?.messages,
    response?.data?.history,
    response?.messages,
    response?.history,
    response?.chat,
    response,
  ];

  return candidates.find(Array.isArray) || [];
};

const messagesAreNearDuplicates = (existing, incoming, duplicateWindowMs) => {
  if (incoming.messageUuid && existing.messageUuid === incoming.messageUuid) return true;
  if (existing.id === incoming.id) return true;
  if (existing.text !== incoming.text || existing.email !== incoming.email) return false;

  return Math.abs(getComparableTime(existing) - getComparableTime(incoming)) < duplicateWindowMs;
};

export const upsertDirectMessage = (
  messages,
  incoming,
  { duplicateWindowMs = 3000, replaceOptimistic = true } = {},
) => {
  const existingIndex = messages.findIndex((message) => (
    messagesAreNearDuplicates(message, incoming, duplicateWindowMs)
  ));

  if (existingIndex === -1) return sortMessagesByTime([...messages, incoming]);

  const existing = messages[existingIndex];
  const existingId = String(existing.id || '');
  const incomingId = String(incoming.id || '');
  const canReplace = replaceOptimistic
    && existingId.startsWith('temp-')
    && incomingId
    && !incomingId.startsWith('temp-');

  if (!canReplace) return messages;

  const nextMessages = [...messages];
  nextMessages[existingIndex] = incoming;
  return sortMessagesByTime(nextMessages);
};

export const getDirectChatWebSocketUrl = (baseUrl, senderEmail, receiverEmail) => {
  const query = `senderEmail=${encodeURIComponent(senderEmail)}&receiverEmail=${encodeURIComponent(receiverEmail)}`;
  const fallbackUrl = `wss://spacehub.monu14.me/ws/direct-chat?${query}`;
  if (!baseUrl) return fallbackUrl;

  try {
    const url = new URL(baseUrl);
    const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${url.host}/ws/direct-chat?${query}`;
  } catch (error) {
    console.error('Failed to parse BASE_URL for WebSocket:', error);
    return fallbackUrl;
  }
};

export { DEFAULT_AVATAR };
