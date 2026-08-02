import { getStoredUserEmail } from '../../../../../shared/services/authStorage';

const OWNER_ROLES = new Set(['OWNER', 'WORKSPACE_OWNER', 'COMMUNITY_OWNER']);

export const containsEmoji = (value) => {
  if (!value) return false;

  const emojiPattern = /[\u{1F300}-\u{1FAFF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{27BF}]/u;
  return emojiPattern.test(value);
};

export const findCommunityById = (response, communityId) => {
  const communities = response?.data?.communities
    || response?.communities
    || response?.data
    || [];

  return communities.find((community) => (
    String(community.id) === String(communityId)
    || String(community.communityId) === String(communityId)
    || String(community.community_id) === String(communityId)
  ));
};

export const mapRoomsToGroups = (response) => {
  const rooms = response?.data || [];

  return rooms.map((room) => ({
    id: room.id,
    name: room.name || room.roomName,
    roomCode: room.roomCode,
  }));
};

export const isOwnerRole = (role) => OWNER_ROLES.has((role || '').toUpperCase());

export const partitionMembers = (members = []) => {
  const owner = members.find((member) => isOwnerRole(member.role)) || null;

  if (!owner) {
    return { owner: null, members };
  }

  return {
    owner,
    members: members.filter((member) => (
      member.email !== owner.email && !isOwnerRole(member.role)
    )),
  };
};

export const filterMembers = (members, query) => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return members;

  return members.filter((member) => {
    const username = (member.username || member.email || '').toLowerCase();
    const email = (member.email || '').toLowerCase();
    return username.includes(normalizedQuery) || email.includes(normalizedQuery);
  });
};

export const getDisplayRole = (role) => {
  const normalizedRole = (role || '').toUpperCase();

  if (normalizedRole === 'ADMIN') return 'Admin';
  if (normalizedRole === 'OWNER' || normalizedRole === 'WORKSPACE_OWNER') {
    return 'Workspace Owner';
  }
  if (normalizedRole === 'MEMBER') return 'Member';

  return normalizedRole;
};

export const getSessionUserEmail = getStoredUserEmail;

export const resolveMediaUrl = (rawUrl, baseUrl) => {
  if (!rawUrl) return '';
  if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) return rawUrl;
  return `${baseUrl}${rawUrl}`;
};
