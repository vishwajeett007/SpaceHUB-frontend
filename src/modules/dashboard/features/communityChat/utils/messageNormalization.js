export const DEFAULT_COMMUNITY_AVATAR = '/avatars/avatar-1.png';

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

const getMessageTime = (message) => {
  const value = message?.createdAt || message?.timestamp || message?.sentAt || message?.time || 0;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const getSenderEmail = (message = {}) => (
  message.senderEmail || message.email || message.sender || ''
);

const getCreatedAt = (message, fallbackTimestamp) => (
  message.timestamp
  || message.createdAt
  || message.sentAt
  || message.time
  || fallbackTimestamp
);

const getMessageId = (message, fallbackId) => (
  message.id || message.messageId || message._id || fallbackId
);

const getMessageText = (message = {}) => (
  message.content || message.message || message.text || ''
);

const getAuthor = (message, senderEmail, getUsername, preferSenderName) => {
  const cachedUsername = getUsername?.(senderEmail);
  const messageAuthor = preferSenderName
    ? message.senderName || message.author || message.username
    : message.author || message.username || message.senderName;

  return messageAuthor
    || cachedUsername
    || (senderEmail ? senderEmail.split('@')[0] : 'Unknown');
};

const getAvatar = (message, senderEmail, getCachedAvatar) => (
  getCachedAvatar?.(senderEmail)
  || message.avatar
  || message.avatarUrl
  || message.avatarPreviewUrl
  || message.profileImage
  || DEFAULT_COMMUNITY_AVATAR
);

export const sortCommunityMessages = (messages = []) => (
  [...messages].sort((left, right) => getMessageTime(left) - getMessageTime(right))
);

export const isImageFile = ({ contentType = '', fileName = '' } = {}) => {
  if (String(contentType).toLowerCase().startsWith('image/')) return true;

  const extension = String(fileName).toLowerCase().split('.').pop();
  return IMAGE_EXTENSIONS.has(extension);
};

export const isCommunityFileMessage = (message = {}) => (
  String(message.type || '').toUpperCase() === 'FILE'
  || Boolean(message.fileKey || message.file_key || message.fileUrl || message.file_url)
);

export const resolveCommunityDisplayName = (
  identifier,
  getUsername,
  fallback = 'Someone',
) => {
  if (!identifier || typeof identifier !== 'string') return fallback;

  const cachedUsername = getUsername?.(identifier.toLowerCase());
  if (cachedUsername) return cachedUsername;
  if (identifier.includes('@')) return identifier.split('@')[0];
  return identifier || fallback;
};

export const normalizeCommunityMessage = (message = {}, context = {}) => {
  const {
    currentUserEmail = '',
    defaultTimestamp = '',
    fallbackId = '',
    getCachedAvatar,
    getCachedUsername,
    preferSenderName = false,
  } = context;
  const senderEmail = getSenderEmail(message);
  const createdAt = getCreatedAt(message, defaultTimestamp);
  const sharedFields = {
    id: getMessageId(message, fallbackId),
    author: getAuthor(message, senderEmail, getCachedUsername, preferSenderName),
    email: senderEmail,
    createdAt,
    avatar: getAvatar(message, senderEmail, getCachedAvatar),
    isSelf: Boolean(
      senderEmail
      && normalizeEmail(senderEmail) === normalizeEmail(currentUserEmail)
    ),
  };

  if (isCommunityFileMessage(message)) {
    const fileKey = message.fileKey || message.file_key || '';
    const fileUrl = message.fileUrl || message.file_url || '';
    const fileIdentifier = fileKey || fileUrl;
    const fileName = message.fileName || message.file_name || message.text || 'file';
    const contentType = message.contentType || message.content_type || '';
    const isImage = isImageFile({ contentType, fileName });

    return {
      ...sharedFields,
      text: fileName,
      images: isImage && fileIdentifier ? [fileIdentifier] : [],
      fileKey: fileKey || null,
      fileUrl: fileUrl || null,
      fileName,
      contentType,
      isFile: true,
      isImage,
    };
  }

  return {
    ...sharedFields,
    text: getMessageText(message),
    images: Array.isArray(message.images)
      ? message.images
      : message.image
        ? [message.image]
        : [],
  };
};

export const extractCommunityHistory = (payload) => {
  if (String(payload?.type || '').toLowerCase() === 'history') {
    return Array.isArray(payload.messages)
      ? payload.messages
      : Array.isArray(payload.history)
        ? payload.history
        : [];
  }

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.history)) return payload.history;
  return null;
};

export const normalizeCommunityHistory = (payload, context = {}) => {
  const history = extractCommunityHistory(payload);
  if (history === null) return null;

  return sortCommunityMessages(
    history
      .map((message, index) => {
        const timestamp = getCreatedAt(message, context.defaultTimestamp);
        const type = isCommunityFileMessage(message) ? 'file' : 'message';

        return normalizeCommunityMessage(message, {
          ...context,
          fallbackId: `history-${type}-${index}-${timestamp}`,
          preferSenderName: true,
        });
      })
      .filter((message) => (
        message.text
        || message.images.length > 0
        || message.isFile
      )),
  );
};

export const normalizeJoinAnnouncement = (rawText, metadata = {}, context = {}) => {
  if (typeof rawText !== 'string') return null;

  const trimmed = rawText.trim();
  if (!/(joined the chat|joined the voice room)$/i.test(trimmed)) return null;

  const emailMatch = trimmed.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const joinEmail = emailMatch ? emailMatch[0].toLowerCase() : '';
  const identifier = joinEmail
    || trimmed.replace(/joined the (chat|voice room)/i, '').trim();
  const storedName = joinEmail ? context.getCachedUsername?.(joinEmail) : '';
  const displayName = storedName
    || metadata.senderName
    || metadata.username
    || resolveCommunityDisplayName(identifier, context.getCachedUsername);
  const isVoiceAnnouncement = /joined the voice room$/i.test(trimmed);
  const suffix = isVoiceAnnouncement ? 'joined the voice room' : 'joined the chat';
  const createdAt = metadata.timestamp || metadata.createdAt || context.defaultTimestamp;

  return {
    isSelf: Boolean(
      joinEmail
      && normalizeEmail(joinEmail) === normalizeEmail(context.currentUserEmail)
    ),
    message: {
      id: metadata.id || context.fallbackId,
      type: 'system',
      systemVariant: isVoiceAnnouncement ? 'voice-join' : 'chat-join',
      text: `${displayName} ${suffix}`,
      createdAt,
    },
  };
};

export const appendJoinAnnouncement = (messages, incoming) => {
  const incomingTime = getMessageTime(incoming);
  const isDuplicate = messages.some((message) => (
    message.type === 'system'
    && message.text === incoming.text
    && Math.abs(getMessageTime(message) - incomingTime) < 2000
  ));

  return isDuplicate
    ? messages
    : sortCommunityMessages([...messages, incoming]);
};

export const upsertCommunityFileMessage = (messages, incoming) => {
  const fileIdentifier = incoming.fileKey || incoming.fileUrl;
  const isDuplicate = messages.some((message) => (
    message.id === incoming.id
    || (
      fileIdentifier
      && (message.fileKey === fileIdentifier || message.fileUrl === fileIdentifier)
      && message.email === incoming.email
    )
  ));

  return isDuplicate
    ? messages
    : sortCommunityMessages([...messages, incoming]);
};

export const upsertCommunityTextMessage = (messages, incoming) => {
  const existingIndex = messages.findIndex((message) => {
    if (incoming.id && message.id === incoming.id) return true;
    if (message.text !== incoming.text || message.email !== incoming.email) return false;

    return Math.abs(getMessageTime(message) - getMessageTime(incoming)) < 3000;
  });

  if (existingIndex === -1) {
    return sortCommunityMessages([...messages, incoming]);
  }

  const existing = messages[existingIndex];
  const existingId = String(existing.id || '');
  const incomingId = String(incoming.id || '');
  if (
    !existingId.startsWith('temp-')
    || !incomingId
    || incomingId.startsWith('temp-')
  ) {
    return messages;
  }

  const nextMessages = [...messages];
  nextMessages[existingIndex] = incoming;
  return sortCommunityMessages(nextMessages);
};

export const createCommunityFilePayloads = (attachments = []) => (
  attachments
    .filter((attachment) => (
      (attachment.fileKey || attachment.fileUrl || attachment.s3Url)
      && !attachment.uploading
    ))
    .map((attachment) => ({
      type: 'FILE',
      fileName: attachment.fileName || attachment.file?.name || 'file',
      fileKey: attachment.fileKey || undefined,
      fileUrl: attachment.fileUrl || attachment.s3Url || undefined,
      contentType: attachment.contentType
        || attachment.file?.type
        || 'application/octet-stream',
    }))
);
