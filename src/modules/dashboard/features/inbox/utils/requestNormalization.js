const resolveSenderAvatar = (profileImageUrl, avatarUrls) => ({
  avatar: profileImageUrl?.startsWith('http')
    ? profileImageUrl
    : avatarUrls[profileImageUrl] || null,
  avatarFile: profileImageUrl && !profileImageUrl.startsWith('http')
    ? profileImageUrl
    : null,
});

export const normalizeFriendRequest = (request, index = 0, avatarUrls = {}) => {
  if (request.senderName || request.senderEmail) {
    const displayName = request.senderName
      || request.senderEmail?.split('@')[0]
      || 'Unknown User';
    const { avatar, avatarFile } = resolveSenderAvatar(
      request.senderProfileImageUrl,
      avatarUrls,
    );

    return {
      id: `friend-${request.id || request.senderEmail || index}`,
      type: 'friend',
      name: displayName,
      requester: displayName,
      requesterEmail: request.senderEmail,
      userId: request.referenceId || request.id,
      firstName: request.senderName?.split(' ')[0],
      lastName: request.senderName?.split(' ').slice(1).join(' '),
      avatar,
      avatarFile,
      notificationId: request.id,
      referenceId: request.referenceId,
      read: request.read || false,
      createdAt: request.createdAt,
    };
  }

  const email = request.email || request.requesterEmail;
  const displayName = request.username
    || request.name
    || email?.split('@')[0]
    || 'Unknown User';

  return {
    id: `friend-${request.id || request.requesterEmail || request.email || index}`,
    type: 'friend',
    name: displayName,
    requester: displayName,
    requesterEmail: email,
    userId: request.id || request.userId,
    firstName: request.firstName,
    lastName: request.lastName,
    avatar: request.avatar || request.avatarUrl || request.profileImage || null,
  };
};

export const normalizeCommunityRequest = (
  request,
  communityId,
  communityName,
  avatarUrls = {},
) => {
  if (request.senderName || request.senderEmail) {
    const displayName = request.senderName
      || request.senderEmail?.split('@')[0]
      || 'Unknown';
    const { avatar, avatarFile } = resolveSenderAvatar(
      request.senderProfileImageUrl,
      avatarUrls,
    );

    return {
      id: `${request.communityId || communityId}-${request.referenceId || request.id}`,
      communityId: request.communityId || communityId,
      type: 'community',
      name: request.communityName || communityName,
      requester: displayName,
      requesterEmail: request.senderEmail,
      userId: request.referenceId || request.id,
      avatar,
      avatarFile,
      notificationId: request.id,
      referenceId: request.referenceId,
      read: request.read || false,
      createdAt: request.createdAt,
    };
  }

  return {
    id: `${communityId}-${request.userId || request.id}`,
    communityId,
    type: 'community',
    name: communityName,
    requester: request.username || request.email?.split('@')[0] || 'Unknown',
    requesterEmail: request.email,
    userId: request.userId || request.id,
    avatar: request.avatar || null,
  };
};

export const normalizeCommunityRequests = (payload, avatarUrls = {}) => {
  if (!Array.isArray(payload)) return [];

  return payload.flatMap((item) => {
    if (item.communityId || item.communityName) {
      return [normalizeCommunityRequest(
        item,
        item.communityId,
        item.communityName,
        avatarUrls,
      )];
    }

    if (!Array.isArray(item.requests)) return [];

    return item.requests.map((request) => normalizeCommunityRequest(
      request,
      item.communityId,
      item.communityName,
      avatarUrls,
    ));
  });
};

export const normalizeNotificationRequests = (payload, avatarUrls = {}) => {
  const friendRequests = Array.isArray(payload.friendRequests)
    ? payload.friendRequests.map((request, index) => (
      normalizeFriendRequest(request, index, avatarUrls)
    ))
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
