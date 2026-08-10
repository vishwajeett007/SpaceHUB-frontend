const resolveSenderAvatar = (profileImageUrl, avatarUrls = {}) => ({
  avatar: profileImageUrl?.startsWith('http')
    ? profileImageUrl
    : (profileImageUrl && avatarUrls[profileImageUrl] ? avatarUrls[profileImageUrl] : null),
  avatarFile: profileImageUrl && !profileImageUrl.startsWith('http')
    ? profileImageUrl
    : null,
});

export const normalizeFriendRequest = (request, index = 0, avatarUrls = {}) => {
  if (!request || typeof request !== 'object') return null;

  const email = request.senderEmail || request.requesterEmail || request.email || request.user?.email;
  const rawName = request.senderName
    || request.requester
    || request.username
    || request.name
    || (request.firstName ? [request.firstName, request.lastName].filter(Boolean).join(' ') : null)
    || (request.user ? ([request.user.firstName, request.user.lastName].filter(Boolean).join(' ') || request.user.username) : null);

  const displayName = rawName || (email ? email.split('@')[0] : null) || 'Unknown User';

  const rawAvatar = request.senderProfileImageUrl || request.avatar || request.avatarUrl || request.profileImage || request.user?.avatarUrl;
  const { avatar, avatarFile } = resolveSenderAvatar(rawAvatar, avatarUrls);

  return {
    id: `friend-${request.id || request.referenceId || email || index}`,
    type: 'friend',
    name: displayName,
    requester: displayName,
    requesterEmail: email,
    userId: request.referenceId || request.senderId || request.userId || request.id,
    firstName: request.firstName || request.senderName?.split(' ')[0],
    lastName: request.lastName || request.senderName?.split(' ').slice(1).join(' '),
    avatar,
    avatarFile,
    notificationId: request.id,
    referenceId: request.referenceId || request.id,
    read: request.read || false,
    createdAt: request.createdAt || request.timestamp || new Date().toISOString(),
  };
};

export const normalizeCommunityRequest = (
  request,
  communityId,
  communityName,
  avatarUrls = {},
) => {
  if (!request || typeof request !== 'object') return null;

  const commId = request.communityId || communityId;
  const commName = request.communityName || communityName || request.community?.name || request.name || 'Community';
  const email = request.senderEmail || request.requesterEmail || request.email || request.user?.email;

  const rawName = request.senderName
    || request.requester
    || request.username
    || request.name
    || (request.firstName ? [request.firstName, request.lastName].filter(Boolean).join(' ') : null)
    || (request.user ? ([request.user.firstName, request.user.lastName].filter(Boolean).join(' ') || request.user.username) : null);

  const displayName = rawName || (email ? email.split('@')[0] : null) || 'Unknown User';

  const rawAvatar = request.senderProfileImageUrl || request.avatar || request.avatarUrl || request.profileImage || request.user?.avatarUrl;
  const { avatar, avatarFile } = resolveSenderAvatar(rawAvatar, avatarUrls);

  return {
    id: `community-${commId || 'comm'}-${request.referenceId || request.id || email || Math.random()}`,
    communityId: commId,
    type: 'community',
    name: commName,
    requester: displayName,
    requesterEmail: email,
    userId: request.referenceId || request.senderId || request.userId || request.id,
    avatar,
    avatarFile,
    notificationId: request.id,
    referenceId: request.referenceId || request.id,
    read: request.read || false,
    createdAt: request.createdAt || request.timestamp || new Date().toISOString(),
  };
};

export const normalizeCommunityRequests = (payload, avatarUrls = {}) => {
  if (!Array.isArray(payload)) return [];

  return payload.flatMap((item) => {
    if (!item) return [];
    if (item.communityId || item.communityName || item.senderName || item.senderEmail) {
      const normalized = normalizeCommunityRequest(
        item,
        item.communityId,
        item.communityName,
        avatarUrls,
      );
      return normalized ? [normalized] : [];
    }

    if (!Array.isArray(item.requests)) return [];

    return item.requests
      .map((request) => normalizeCommunityRequest(
        request,
        item.communityId,
        item.communityName,
        avatarUrls,
      ))
      .filter(Boolean);
  });
};

export const normalizeNotificationRequests = (payload, avatarUrls = {}) => {
  if (!payload || typeof payload !== 'object') return [];

  const friendRequests = Array.isArray(payload.friendRequests)
    ? payload.friendRequests
      .map((request, index) => normalizeFriendRequest(request, index, avatarUrls))
      .filter(Boolean)
    : [];
  const communityRequests = normalizeCommunityRequests(
    payload.communityRequests,
    avatarUrls,
  );

  return [...friendRequests, ...communityRequests];
};

export const attachResolvedAvatars = (requests, avatarUrls) => requests.map((request) => ({
  ...request,
  avatar: request.avatar
    || (request.avatarFile && avatarUrls[request.avatarFile])
    || null,
}));
