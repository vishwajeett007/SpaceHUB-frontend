export const BASE_URL = import.meta.env.VITE_BASE_URL;
export async function registerUser(payload) {
  const response = await fetch(`${BASE_URL}registration`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleJson(response);
}

export async function loginUser(payload) {
  const response = await fetch(`${BASE_URL}login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await handleJson(response);

  let token = data?.accessToken || data?.token || data?.jwt || data?.data?.accessToken || data?.data?.token;
  if (token === 'undefined' || token === 'null') {
    token = null;
  }
  if (token) {
    sessionStorage.setItem('accessToken', token);
    localStorage.setItem('accessToken', token);
    const responseEmail = data?.email || data?.data?.email;

    if (data.user || data.data?.user) {
      const userObj = data.user || data.data?.user;
      if (responseEmail && !userObj.email) {
        userObj.email = String(responseEmail);
      }
      sessionStorage.setItem('userData', JSON.stringify(userObj));
      localStorage.setItem('userData', JSON.stringify(userObj));
    } else if (responseEmail) {
      const userData = { email: String(responseEmail) };
      sessionStorage.setItem('userData', JSON.stringify(userData));
      localStorage.setItem('userData', JSON.stringify(userData));
    }
  }

  return data;
}

export async function requestForgotPassword(email) {
  const response = await fetch(`${BASE_URL}forgotpassword`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: email })
  });
  return handleJson(response);
}

export async function validateOtp(payload) {
  const response = await fetch(`${BASE_URL}validateforgototp`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleJson(response);
}

export async function resetPassword(payload) {
  const response = await fetch(`${BASE_URL}resetpassword`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await handleJson(response);

  let token = data?.accessToken || data?.token || data?.jwt || data?.data?.accessToken || data?.data?.token;
  if (token === 'undefined' || token === 'null') {
    token = null;
  }
  if (token) {
    sessionStorage.setItem('accessToken', token);
    localStorage.setItem('accessToken', token);
    if (data.user || data.data?.user) {
      const userObj = data.user || data.data?.user;
      sessionStorage.setItem('userData', JSON.stringify(userObj));
      localStorage.setItem('userData', JSON.stringify(userObj));
    }
  }

  return data;
}

export async function resendRegisterOtp(email, registrationToken) {
  const response = await fetch(`${BASE_URL}resendotp`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: email, sessionToken: registrationToken }),
  });
  return handleJson(response);
}

export async function resendForgotOtp(forgotToken) {
  const response = await fetch(`${BASE_URL}resendforgototp`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tempToken: forgotToken })
  });
  return handleJson(response);
}

export async function validateRegisterOtp(payload) {
  const response = await fetch(`${BASE_URL}validateregisterotp`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleJson(response);
}

export async function createCommunity({ name, description, createdByEmail, imageFile }) {
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
  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }
  if (!response.ok) {
    // Handle 429 Too Many Requests
    if (response.status === 429) {
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: 'Wait for some time to reload', type: 'error' }
      }));
      const message = (data && (data.message || data.error)) || 'Too many requests. Please wait for some time to reload.';
      throw new Error(message);
    }
    const message = (data && (data.message || data.error)) || `HTTP ${response.status}`;
    throw new Error(message);
  }
  return data;
}

// Create Local Group
export async function createLocalGroup({ name, description, createdByEmail, imageFile }) {
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
  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }
  if (!response.ok) {
    // Handle 429 Too Many Requests
    if (response.status === 429) {
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: 'Wait for some time to reload', type: 'error' }
      }));
      const message = (data && (data.message || data.error)) || 'Too many requests. Please wait for some time to reload.';
      throw new Error(message);
    }
    const message = (data && (data.message || data.error)) || `HTTP ${response.status}`;
    throw new Error(message);
  }
  return data;
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
  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }
  if (!response.ok) {
    // Handle 429 Too Many Requests
    if (response.status === 429) {
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: 'Wait for some time to reload', type: 'error' }
      }));
      const message = (data && (data.message || data.error)) || 'Too many requests. Please wait for some time to reload.';
      throw new Error(message);
    }
    const message = (data && (data.message || data.error)) || `HTTP ${response.status}`;
    throw new Error(message);
  }
  return data;
}

export async function getMyCommunities() {
  const response = await authenticatedFetch(`${BASE_URL}community/my-communities`, {
    method: 'GET',
    credentials: 'include'
  });
  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }
  if (!response.ok) {
    // Handle 429 Too Many Requests
    if (response.status === 429) {
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: 'Wait for some time to reload', type: 'error' }
      }));
      const message = (data && (data.message || data.error)) || 'Too many requests. Please wait for some time to reload.';
      throw new Error(message);
    }
    const message = (data && (data.message || data.error)) || `HTTP ${response.status}`;
    throw new Error(message);
  }
  return data;
}

export async function getAllLocalGroups(requesterEmail) {
  const url = `${BASE_URL}local-group/all`;
  const response = await authenticatedFetch(url, {
    method: 'GET'
  });
  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }
  if (!response.ok) {
    // Handle 429 Too Many Requests
    if (response.status === 429) {
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: 'Wait for some time to reload', type: 'error' }
      }));
      const message = (data && (data.message || data.error)) || 'Too many requests. Please wait for some time to reload.';
      throw new Error(message);
    }
    const message = (data && (data.message || data.error)) || `HTTP ${response.status}`;
    throw new Error(message);
  }
  return data;
}

// Community: members list
export async function getCommunityMembers(communityId) {
  const response = await authenticatedFetch(`${BASE_URL}community/members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ communityId })
  });
  let data;
  try { data = await response.json(); } catch { data = null; }
  if (!response.ok) {
    const message = (data && (data.message || data.error)) || `HTTP ${response.status}`;
    throw new Error(message);
  }
  return data;
}

// Change community member role
export async function changeCommunityRole({ communityId, targetUserEmail, requesterEmail, newRole }) {
  const response = await authenticatedFetch(`${BASE_URL}community/changeRole`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ communityId, targetUserEmail, newRole })
  });
  let data;
  try { data = await response.json(); } catch { data = null; }
  if (!response.ok) {
    const message = (data && (data.message || data.error)) || `HTTP ${response.status}`;
    throw new Error(message);
  }
  return data;
}

// Community: rooms
export async function getCommunityRooms(communityId) {
  const response = await authenticatedFetch(`${BASE_URL}community/${communityId}/rooms/all`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
  let data;
  try { data = await response.json(); } catch { data = null; }
  if (!response.ok) {
    const message = (data && (data.message || data.error)) || `HTTP ${response.status}`;
    throw new Error(message);
  }
  return data;
}

// Local Group: details by id
export async function getLocalGroupById(groupId) {
  const response = await authenticatedFetch(`${BASE_URL}local-group/${groupId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
  let data;
  try { data = await response.json(); } catch { data = null; }
  if (!response.ok) {
    const message = (data && (data.message || data.error)) || `HTTP ${response.status}`;
    throw new Error(message);
  }
  return data;
}

export async function deleteCommunity({ name, userEmail }) {
  const response = await authenticatedFetch(`${BASE_URL}community/delete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name })
  });
  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }
  if (!response.ok) {
    if (response.status === 429) {
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: 'Wait for some time to reload', type: 'error' }
      }));
      const message = (data && (data.message || data.error)) || 'Too many requests. Please wait for some time to reload.';
      throw new Error(message);
    }
    const message = (data && (data.message || data.error)) || `HTTP ${response.status}`;
    throw new Error(message);
  }
  return data;
}

export async function leaveCommunity({ communityName, userEmail }) {
  const response = await authenticatedFetch(`${BASE_URL}community/leave`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ communityName })
  });
  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }
  if (!response.ok) {
    // Handle 429 Too Many Requests
    if (response.status === 429) {
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: 'Wait for some time to reload', type: 'error' }
      }));
      const message = (data && (data.message || data.error)) || 'Too many requests. Please wait for some time to reload.';
      throw new Error(message);
    }
    const message = (data && (data.message || data.error)) || `HTTP ${response.status}`;
    throw new Error(message);
  }
  return data;
}

export async function createCommunityInvite({ communityId, inviterEmail, email }) {
  const response = await authenticatedFetch(`${BASE_URL}community/invites/${communityId}/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email })
  });
  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }
  if (!response.ok) {
    // Handle 429 Too Many Requests
    if (response.status === 429) {
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: 'Wait for some time to reload', type: 'error' }
      }));
      const message = (data && (data.message || data.error)) || 'Too many requests. Please wait for some time to reload.';
      throw new Error(message);
    }
    const message = (data && (data.message || data.error)) || `HTTP ${response.status}`;
    throw new Error(message);
  }
  return data;
}

// Create Local Group Invite Link
export async function createLocalGroupInvite({ groupId, inviterEmail, maxUses = 5, expiresInHours = 24 }) {
  const response = await authenticatedFetch(`${BASE_URL}localgroup/invites/create/${groupId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ maxUses, expiresInHours })
  });
  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }
  if (!response.ok) {
    // Handle 429 Too Many Requests
    if (response.status === 429) {
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: 'Wait for some time to reload', type: 'error' }
      }));
      const message = (data && (data.message || data.error)) || 'Too many requests. Please wait for some time to reload.';
      throw new Error(message);
    }
    const message = (data && (data.message || data.error)) || `HTTP ${response.status}`;
    throw new Error(message);
  }
  return data;
}

// Get Local Group Invites/Join Requests List
export async function getLocalGroupInvites(groupId) {
  const response = await authenticatedFetch(`${BASE_URL}localgroup/invites/list/${groupId}`, {
    method: 'GET'
  });
  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }
  if (!response.ok) {
    // Handle 429 Too Many Requests
    if (response.status === 429) {
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: 'Wait for some time to reload', type: 'error' }
      }));
      const message = (data && (data.message || data.error)) || 'Too many requests. Please wait for some time to reload.';
      throw new Error(message);
    }
    const message = (data && (data.message || data.error)) || `HTTP ${response.status}`;
    throw new Error(message);
  }
  return data;
}

export async function acceptCommunityInvite({ communityId, inviteCode, acceptorEmail }) {
  const response = await authenticatedFetch(`${BASE_URL}community/invites/accept`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ communityId, inviteCode })
  });
  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }
  if (!response.ok) {
    // Handle 429 Too Many Requests
    if (response.status === 429) {
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: 'Wait for some time to reload', type: 'error' }
      }));
      const message = (data && (data.message || data.error)) || 'Too many requests. Please wait for some time to reload.';
      throw new Error(message);
    }
    const message = (data && (data.message || data.error)) || `HTTP ${response.status}`;
    throw new Error(message);
  }
  return data;
}

export async function joinCommunity(communityName, userEmail) {
  const response = await authenticatedFetch(`${BASE_URL}community/requestJoin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      communityName: communityName
    })
  });
  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }
  if (!response.ok) {
    // Handle 429 Too Many Requests
    if (response.status === 429) {
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: 'Wait for some time to reload', type: 'error' }
      }));
      const message = (data && (data.message || data.error)) || 'Too many requests. Please wait for some time to reload.';
      throw new Error(message);
    }
    const message = (data && (data.message || data.error)) || `HTTP ${response.status}`;
    throw new Error(message);
  }
  return data;
}

export const getAllRooms = (requesterEmail) => getAllLocalGroups(requesterEmail);

export async function acceptJoinRequest({ communityName, creatorEmail, userEmail }) {
  const response = await authenticatedFetch(`${BASE_URL}community/acceptRequest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ communityName, userEmail })
  });
  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }
  if (!response.ok) {
    // Handle 429 Too Many Requests
    if (response.status === 429) {
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: 'Wait for some time to reload', type: 'error' }
      }));
      const message = (data && (data.message || data.error)) || 'Too many requests. Please wait for some time to reload.';
      throw new Error(message);
    }
    const message = (data && (data.message || data.error)) || `HTTP ${response.status}`;
    throw new Error(message);
  }
  return data;
}

export async function rejectJoinRequest({ communityName, creatorEmail, userEmail }) {
  const response = await authenticatedFetch(`${BASE_URL}community/rejectRequest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ communityName, userEmail })
  });
  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }
  if (!response.ok) {
    // Handle 429 Too Many Requests
    if (response.status === 429) {
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: 'Wait for some time to reload', type: 'error' }
      }));
      const message = (data && (data.message || data.error)) || 'Too many requests. Please wait for some time to reload.';
      throw new Error(message);
    }
    const message = (data && (data.message || data.error)) || `HTTP ${response.status}`;
    throw new Error(message);
  }
  return data;
}

export async function searchUsers(query, email, page = 0, size = 10) {
  const response = await authenticatedFetch(`${BASE_URL}search?query=${encodeURIComponent(query)}&email=${encodeURIComponent(email)}&page=${page}&size=${size}`, {
    method: 'GET'
  });
  return handleJson(response);
}

export async function sendFriendRequest(userEmail, friendEmail) {
  const response = await authenticatedFetch(`${BASE_URL}friends/request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ friendEmail })
  });
  return handleJson(response);
}

// Get friends list
export async function getFriendsList(userEmail) {
  const response = await authenticatedFetch(`${BASE_URL}friends/list`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({})
  });
  return handleJson(response);
}

export async function deleteNotificationByReference(referenceId) {
  const response = await authenticatedFetch(`${BASE_URL}notifications/reference/${referenceId}`, {
    method: 'DELETE'
  });
  return handleJson(response);
}

export async function respondToFriendRequest({ userEmail, requesterEmail, accept }) {
  const response = await authenticatedFetch(`${BASE_URL}friends/respond`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ requesterEmail, accept })
  });
  return handleJson(response);
}

// Remove friend
export async function removeFriend({ userEmail, friendEmail }) {
  const response = await authenticatedFetch(`${BASE_URL}friends/remove`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ friendEmail })
  });
  return handleJson(response);
}

// Send message to a friend
export async function sendFriendMessage({ userEmail, friendEmail, message, images }) {
  const response = await authenticatedFetch(`${BASE_URL}friends/message/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ friendEmail, message, images })
  });
  return handleJson(response);
}

// Get messages with a friend
export async function getFriendMessages({ userEmail, friendEmail, page = 0, size = 50 }) {
  const response = await authenticatedFetch(`${BASE_URL}friends/messages?friendEmail=${encodeURIComponent(friendEmail)}&page=${page}&size=${size}`, {
    method: 'GET'
  });
  return handleJson(response);
}


export async function getChatHistory(user1, user2) {
  const response = await authenticatedFetch(`${BASE_URL}messages/chat?user1=${encodeURIComponent(user1)}&user2=${encodeURIComponent(user2)}`, {
    method: 'GET'
  });
  return handleJson(response);
}


export async function searchCommunities({ query, requesterEmail, page = 0, size = 10 }) {
  const params = new URLSearchParams();
  params.set('q', query);
  params.set('page', String(page));
  params.set('size', String(size));
  const response = await authenticatedFetch(`${BASE_URL}community/search?${params.toString()}`, {
    method: 'GET'
  });
  return handleJson(response);
}

export async function setUsername({ email, username }) {
  const payload = { email, username };
  const response = await authenticatedFetch(`${BASE_URL}dashboard/set-username`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleJson(response);
}

export async function sendWelcomeEmail({ to, subject, message }) {
  const response = await authenticatedFetch(`${BASE_URL}dashboard/send-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, subject, message })
  });
  return handleJson(response);
}

export async function uploadProfileImage({ imageFile }) {
  const formData = new FormData();
  formData.append('file', imageFile);
  const response = await authenticatedFetch(`${BASE_URL}profile/avatar`, {
    method: 'POST',
    body: formData
  });
  return handleJson(response);
}

// Upload cover photo
export async function uploadCoverPhoto({ imageFile }) {
  const formData = new FormData();
  formData.append('file', imageFile);
  const response = await authenticatedFetch(`${BASE_URL}profile/cover`, {
    method: 'POST',
    body: formData
  });
  return handleJson(response);
}

// Upload file and get fileKey and fileUrl
export async function uploadFileAndGetUrl(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await authenticatedFetch(`${BASE_URL}files/upload-and-get-url`, {
    method: 'POST',
    body: formData
  });

  const data = await handleJson(response);

  if (!response.ok) {
    throw new Error(data?.message || data?.error || 'Failed to upload file');
  }

  // Return both fileKey and fileUrl from the response
  return {
    fileKey: data?.data?.fileKey || data?.fileKey || null,
    fileUrl: data?.data?.fileUrl || data?.fileUrl || null,
    fileName: data?.data?.fileName || data?.fileName || file.name,
    contentType: data?.data?.contentType || data?.contentType || file.type || 'application/octet-stream'
  };
}

export async function deleteAccount({ email, currentPassword }) {
  const response = await authenticatedFetch(`${BASE_URL}profile/delete`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, currentPassword })
  });
  return handleJson(response);
}

export async function getProfileSummary(email) {
  const response = await authenticatedFetch(`${BASE_URL}profile/getProfile`, {
    method: 'GET'
  });
  const data = await handleJson(response);
  if (data && data.data) {
    // Normalize new backend profile response keys to match what frontend UI expects
    const profile = data.data;
    const avatarUrl = profile.avatarPreviewUrl || profile.avatarUrl || null;
    profile.avatarUrl = avatarUrl;
    profile.profileImage = avatarUrl;
  }
  return data;
}

// Update profile (password and/or user fields)
export async function updateProfile({ currentPassword, newPassword, firstName, lastName, bio, dateOfBirth, username }) {
  const payload = {
    currentPassword,
    newPassword,
    firstName,
    lastName,
    bio,
    dateOfBirth,
    username
  };
  // remove undefined/null fields
  Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

  const response = await authenticatedFetch(`${BASE_URL}profile/updateProfile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleJson(response);
}
export async function removeCommunityMember(communityId, userEmail, requesterEmail) {
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
  } catch (error) {
    console.error('removeCommunityMember API error:', error);
    throw error;
  }
}

export async function deleteCommunityRoom(communityId, roomId, requesterEmail) {
  const response = await authenticatedFetch(`${BASE_URL}community/${communityId}/rooms/${roomId}`, {
    method: 'DELETE'
  });
  return handleJson(response);
}

// Local-Group: members lis
export async function getLocalGroupMembers(groupId) {
  const response = await authenticatedFetch(`${BASE_URL}local-group/${groupId}/members`, {
    method: 'GET'
  });
  return handleJson(response);
}

// Local-Group: setting
export async function getLocalGroupSettings(groupId) {
  const response = await authenticatedFetch(`${BASE_URL}local-group/${groupId}/settings`, {
    method: 'GET'
  });
  return handleJson(response);
}

// Rooms: join by roomCode
export async function joinRoom(roomCode, userId) {
  const response = await authenticatedFetch(`${BASE_URL}rooms/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomCode })
  });
  return handleJson(response);
}

// Join local group via invite link
export async function joinLocalGroup({ groupId, userEmail }) {
  const response = await authenticatedFetch(`${BASE_URL}local-group/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ groupId })
  });
  return handleJson(response);
}

// Accept local group invite
export async function acceptLocalGroupInvite({ groupId, inviteCode, acceptorEmail }) {
  const response = await authenticatedFetch(`${BASE_URL}localgroup/invites/accept`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ groupId, inviteCode })
  });
  return handleJson(response);
}

// Create new chatroom
export async function createNewChatroom(roomCode, name) {
  const formData = new FormData();
  formData.append('roomCode', roomCode);
  formData.append('name', name);

  const response = await authenticatedFetch(`${BASE_URL}new-chatroom/create`, {
    method: 'POST',
    body: formData
  });
  return handleJson(response);
}

export async function createDefaultAnnouncementGroup(communityId, requesterEmail) {
  try {
    const groupUrl = `${BASE_URL}community/${communityId}/rooms/create`;
    const groupResponse = await authenticatedFetch(groupUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        roomName: 'Announcement'
      })
    });

    const groupData = await groupResponse.json();

    if (!groupResponse.ok) {
      throw new Error(groupData.message || 'Failed to create Announcement group');
    }

    const announcementGroup = groupData.data || groupData;
    const roomCode = announcementGroup.roomCode || announcementGroup.id;

    if (!roomCode) {
      throw new Error('Room code not found in Announcement group response');
    }

    // Step 2: Create the general chatroom in the Announcement group
    const chatroomResponse = await createNewChatroom(roomCode, 'general');

    return {
      group: announcementGroup,
      chatroom: chatroomResponse
    };
  } catch (error) {
    console.error('Error creating default Announcement group:', error);
    throw error;
  }
}

export async function getChatroomsSummary(roomCode) {
  const response = await authenticatedFetch(`${BASE_URL}new-chatroom/list/summary?roomCode=${encodeURIComponent(roomCode)}`, {
    method: 'GET'
  });
  return handleJson(response);
}

// Delete chatroom
export async function deleteChatroom(chatroomId, roomCode) {
  const response = await authenticatedFetch(`${BASE_URL}new-chatroom/${chatroomId}/delete?RoomCode=${encodeURIComponent(roomCode)}`, {
    method: 'DELETE'
  });
  return handleJson(response);
}

// Get voice rooms list for a room
export async function getVoiceRoomsList(roomId) {
  const response = await authenticatedFetch(`${BASE_URL}voice-room/list/${roomId}`, {
    method: 'GET'
  });
  return handleJson(response);
}

// Create voice room
export async function createVoiceRoom(chatRoomId, roomName, createdBy) {
  const params = new URLSearchParams();
  params.set('chatRoomId', chatRoomId);
  params.set('roomName', roomName);

  const response = await authenticatedFetch(`${BASE_URL}voice-room/create?${params.toString()}`, {
    method: 'POST'
  });
  return handleJson(response);
}

// Delete voice room
export async function deleteVoiceRoom(chatRoomId, roomName, requester) {
  const params = new URLSearchParams();
  params.set('chatRoomId', chatRoomId);
  params.set('roomName', roomName);

  const response = await authenticatedFetch(`${BASE_URL}voice-room/delete?${params.toString()}`, {
    method: 'DELETE'
  });
  return handleJson(response);
}

// Join voice room
export async function joinVoiceRoom(janusRoomId, displayName) {
  const params = new URLSearchParams();
  params.set('janusRoomId', janusRoomId);
  params.set('displayName', displayName);

  const response = await authenticatedFetch(`${BASE_URL}voice-room/join?${params.toString()}`, {
    method: 'POST'
  });
  return handleJson(response);
}

// Get presigned download URL for file
export async function getPresignedDownloadUrl(file, contentType = 'image/png') {
  const response = await authenticatedFetch(`${BASE_URL}files/presigned/download`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file, contentType })
  });
  const data = await handleJson(response);
  return data?.data || data?.url || null;
}

async function handleJson(response) {
  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }
  if (!response.ok) {
    console.error(`API Error response for ${response.url}:`, { status: response.status, data });
    if (response.status === 429) {
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: 'Wait for some time to reload', type: 'error' }
      }));
      const message = (data && (data.message || data.error)) || 'Too many requests. Please wait for some time to reload.';
      throw new Error(message);
    }
    const message = (data && (data.message || data.error)) || `HTTP ${response.status}`;
    throw new Error(message);
  }
  return data;
}
export const getCookie = (name) => {
  try {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      const val = parts.pop().split(';').shift();
      return val === 'undefined' || val === 'null' ? null : val;
    }
  } catch (error) {
    console.error('Error getting cookie:', error);
  }
  return null;
};

export const getAuthHeaders = (isFormData = false) => {
  let token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken') || getCookie('token');
  if (token === 'undefined' || token === 'null') {
    token = null;
  }
  return {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export const authenticatedFetch = async (url, options = {}) => {
  const isFormData = options.body instanceof FormData;
  const headers = getAuthHeaders(isFormData);

  console.log(`[API Request] Fetching ${url} with headers:`, headers);

  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      ...headers,
      ...options.headers
    }
  });
  console.log(`[API Response] ${url} status:`, response.status, response);

  // if (response.status === 401) {
  //   sessionStorage.removeItem('accessToken');
  //   localStorage.removeItem('accessToken');
  //   sessionStorage.removeItem('userData');
  //   localStorage.removeItem('userData');
  // window.location.href = '/login';
  // }

  // Handle 429 Too Many Requests
  if (response.status === 429) {
    window.dispatchEvent(new CustomEvent('toast', {
      detail: { message: 'Wait for some time to reload', type: 'error' }
    }));
  }

  return response;
};