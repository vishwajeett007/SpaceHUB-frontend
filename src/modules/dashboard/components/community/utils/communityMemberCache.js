const getCacheKey = (communityId, category) =>
  `community_${category}_${communityId}`;

export const getCachedCommunityMemberValue = (
  communityId,
  category,
  email
) => {
  if (!communityId || !email) return null;

  try {
    const values = JSON.parse(
      sessionStorage.getItem(getCacheKey(communityId, category)) || '{}'
    );
    return values[email.toLowerCase()] || null;
  } catch {
    return null;
  }
};

export const getCachedCommunityAvatar = (communityId, email) =>
  getCachedCommunityMemberValue(communityId, 'avatars', email);

export const getCachedCommunityUsername = (communityId, email) =>
  getCachedCommunityMemberValue(communityId, 'usernames', email);
