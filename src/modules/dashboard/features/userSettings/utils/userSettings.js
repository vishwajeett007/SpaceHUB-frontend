import { readStoredUser } from '../../../../../shared/services/authStorage';

export const DEFAULT_AVATAR_URL = '/avatars/avatar-1.png';
export const USERNAME_MAX_LENGTH = 15;

export const readSessionUser = () => readStoredUser() || {};

export const resolveSettingsUser = (user) => {
  const sessionUser = readSessionUser();

  return {
    ...sessionUser,
    email: user?.email || sessionUser.email || '',
    username: user?.username || sessionUser.username || '',
    avatarUrl: user?.avatarUrl || sessionUser.avatarUrl || DEFAULT_AVATAR_URL,
  };
};

export const getAvatarUrl = (response) => (
  response?.data?.avatarPreviewUrl
  || response?.avatarPreviewUrl
  || response?.data?.avatarUrl
  || response?.avatarUrl
  || response?.data?.profileImage
  || response?.profileImage
  || response?.data?.imageUrl
  || response?.imageUrl
  || response?.url
  || null
);

export const findUploadedAvatarUrl = (responses) => {
  for (const response of responses) {
    const avatarUrl = getAvatarUrl(response);
    if (avatarUrl) return avatarUrl;
  }

  return null;
};

export const mergeProfileSummary = (user, profileSummary) => {
  if (!profileSummary) return user;

  const profile = profileSummary.data || profileSummary;
  if (!profile || typeof profile !== 'object') return user;

  const mergedUser = { ...user, ...profile };
  const avatarUrl = getAvatarUrl(profileSummary);
  if (avatarUrl) mergedUser.avatarUrl = avatarUrl;

  return mergedUser;
};
