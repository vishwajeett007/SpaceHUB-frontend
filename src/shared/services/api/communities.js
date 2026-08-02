import { authenticatedFetch, BASE_URL } from './client';
import { handleJson, handleJsonResponse } from './response';

const handleCommunityJson = (response) => handleJsonResponse(response, {
  notifyRateLimit: true
});

export async function createCommunity({ name, description, imageFile }) {
  const formData = new FormData();
  formData.append('name', name);
  formData.append('description', description);
  if (imageFile) {
    formData.append('imageFile', imageFile);
  }

  const response = await authenticatedFetch(`${BASE_URL}community/create`, {
    method: 'POST',
    body: formData
  });
  return handleCommunityJson(response);
}

export async function createLocalGroup({ name, description, imageFile }) {
  const formData = new FormData();
  formData.append('name', name);
  formData.append('description', description);
  if (imageFile) {
    formData.append('imageFile', imageFile);
  }

  const response = await authenticatedFetch(`${BASE_URL}local-group/create`, {
    method: 'POST',
    body: formData
  });
  return handleCommunityJson(response);
}

export const createRoom = (args) => createLocalGroup({
  name: args.name,
  description: args.description,
  createdByEmail: args.createdByEmail || args.creatorEmail || args.creatByEmail,
  imageFile: args.imageFile,
});

export async function getAllCommunities() {
  const response = await authenticatedFetch(`${BASE_URL}community/all`, {
    method: 'GET'
  });
  return handleCommunityJson(response);
}

export async function getMyCommunities() {
  const response = await authenticatedFetch(`${BASE_URL}community/my-communities`, {
    method: 'GET',
    credentials: 'include'
  });
  return handleCommunityJson(response);
}

export async function getAllLocalGroups() {
  const url = `${BASE_URL}local-group/all`;
  const response = await authenticatedFetch(url, {
    method: 'GET'
  });
  return handleCommunityJson(response);
}

export async function getCommunityMembers(communityId) {
  const response = await authenticatedFetch(`${BASE_URL}community/members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ communityId })
  });
  return handleJsonResponse(response);
}

export async function changeCommunityRole({ communityId, targetUserEmail, newRole }) {
  const response = await authenticatedFetch(`${BASE_URL}community/changeRole`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ communityId, targetUserEmail, newRole })
  });
  return handleJsonResponse(response);
}

export async function getCommunityRooms(communityId) {
  const response = await authenticatedFetch(`${BASE_URL}community/${communityId}/rooms/all`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
  return handleJsonResponse(response);
}

export async function getLocalGroupById(groupId) {
  const response = await authenticatedFetch(`${BASE_URL}local-group/${groupId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
  return handleJsonResponse(response);
}

export async function deleteCommunity({ name }) {
  const response = await authenticatedFetch(`${BASE_URL}community/delete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name })
  });
  return handleCommunityJson(response);
}

export async function leaveCommunity({ communityName }) {
  const response = await authenticatedFetch(`${BASE_URL}community/leave`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ communityName })
  });
  return handleCommunityJson(response);
}

export async function createCommunityInvite({ communityId, email }) {
  const response = await authenticatedFetch(`${BASE_URL}community/invites/${communityId}/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email })
  });
  return handleCommunityJson(response);
}

export async function createLocalGroupInvite({ groupId, maxUses = 5, expiresInHours = 24 }) {
  const response = await authenticatedFetch(`${BASE_URL}localgroup/invites/create/${groupId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ maxUses, expiresInHours })
  });
  return handleCommunityJson(response);
}

export async function getLocalGroupInvites(groupId) {
  const response = await authenticatedFetch(`${BASE_URL}localgroup/invites/list/${groupId}`, {
    method: 'GET'
  });
  return handleCommunityJson(response);
}

export async function acceptCommunityInvite({ communityId, inviteCode }) {
  const response = await authenticatedFetch(`${BASE_URL}community/invites/accept`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ communityId, inviteCode })
  });
  return handleCommunityJson(response);
}

export async function joinCommunity(communityName) {
  const response = await authenticatedFetch(`${BASE_URL}community/requestJoin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      communityName: communityName
    })
  });
  return handleCommunityJson(response);
}

export const getAllRooms = (requesterEmail) => getAllLocalGroups(requesterEmail);

export async function acceptJoinRequest({ communityName, userEmail }) {
  const response = await authenticatedFetch(`${BASE_URL}community/acceptRequest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ communityName, userEmail })
  });
  return handleCommunityJson(response);
}

export async function rejectJoinRequest({ communityName, userEmail }) {
  const response = await authenticatedFetch(`${BASE_URL}community/rejectRequest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ communityName, userEmail })
  });
  return handleCommunityJson(response);
}

export async function searchCommunities({ query, page = 0, size = 10 }) {
  const params = new URLSearchParams();
  params.set('q', query);
  params.set('page', String(page));
  params.set('size', String(size));
  const response = await authenticatedFetch(`${BASE_URL}community/search?${params.toString()}`, {
    method: 'GET'
  });
  return handleJson(response);
}

export async function removeCommunityMember(communityId, userEmail) {
  const url = `${BASE_URL}community/removeMember`;
  const payload = { communityId, userEmail };
  try {
    const response = await authenticatedFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    return handleJson(response);
  } catch (error) {
    console.error('removeCommunityMember API error:', error);
    throw error;
  }
}

export async function deleteCommunityRoom(communityId, roomId) {
  const response = await authenticatedFetch(`${BASE_URL}community/${communityId}/rooms/${roomId}`, {
    method: 'DELETE'
  });
  return handleJson(response);
}

export async function getLocalGroupMembers(groupId) {
  const response = await authenticatedFetch(`${BASE_URL}local-group/${groupId}/members`, {
    method: 'GET'
  });
  return handleJson(response);
}

export async function getLocalGroupSettings(groupId) {
  const response = await authenticatedFetch(`${BASE_URL}local-group/${groupId}/settings`, {
    method: 'GET'
  });
  return handleJson(response);
}

export async function joinLocalGroup({ groupId }) {
  const response = await authenticatedFetch(`${BASE_URL}local-group/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ groupId })
  });
  return handleJson(response);
}

export async function acceptLocalGroupInvite({ groupId, inviteCode }) {
  const response = await authenticatedFetch(`${BASE_URL}localgroup/invites/accept`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ groupId, inviteCode })
  });
  return handleJson(response);
}
