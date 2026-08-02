import { readStoredUser } from '../../../../../shared/services/authStorage';

const getChannelStorageKey = (communityId) => (
  `community_selected_channel_${communityId}`
);

export const readSessionUser = () => {
  return readStoredUser() || {};
};

export const readCommunityChannelSelection = (communityId) => {
  if (!communityId) return null;

  try {
    const storedSelection = sessionStorage.getItem(getChannelStorageKey(communityId));
    return storedSelection ? JSON.parse(storedSelection) : null;
  } catch (error) {
    console.error('Failed to parse stored channel:', error);
    return null;
  }
};

export const storeCommunityChannelSelection = (communityId, selection) => {
  if (!communityId) return;

  try {
    sessionStorage.setItem(getChannelStorageKey(communityId), JSON.stringify(selection));
  } catch (error) {
    console.error('Failed to store channel selection:', error);
  }
};
