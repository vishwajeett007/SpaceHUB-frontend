import { authenticatedFetch, BASE_URL } from './client';
import { handleJson } from './response';

export async function searchUsers(query, email, page = 0, size = 10) {
  const response = await authenticatedFetch(`${BASE_URL}search?query=${encodeURIComponent(query)}&email=${encodeURIComponent(email)}&page=${page}&size=${size}`, {
    method: 'GET'
  });
  return handleJson(response);
}

export async function sendFriendRequest(userEmail, friendIdentifier) {
  void userEmail;

  const isEmail = typeof friendIdentifier === 'string' && friendIdentifier.includes('@');
  const payload = isEmail ? { friendEmail: friendIdentifier } : { friendId: friendIdentifier };

  const response = await authenticatedFetch(`${BASE_URL}friends/request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  return handleJson(response);
}

export async function cancelFriendRequest(userEmail, friendIdentifier) {
  void userEmail;
  const isEmail = typeof friendIdentifier === 'string' && friendIdentifier.includes('@');
  const payload = isEmail ? { friendEmail: friendIdentifier } : { friendId: friendIdentifier };

  const response = await authenticatedFetch(`${BASE_URL}friends/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  return handleJson(response);
}

export async function getFriendsList() {
  const response = await authenticatedFetch(`${BASE_URL}friends/list`, {
    method: 'POST',
    dedupe: true,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({})
  });
  return handleJson(response);
}

export async function getNotifications() {
  const response = await authenticatedFetch(`${BASE_URL}notifications`, {
    method: 'GET'
  });
  return handleJson(response);
}

export async function deleteNotificationByReference(referenceId) {
  const response = await authenticatedFetch(`${BASE_URL}notifications/reference/${referenceId}`, {
    method: 'DELETE'
  });
  return handleJson(response);
}

export async function respondToFriendRequest({ requesterEmail, accept }) {
  const response = await authenticatedFetch(`${BASE_URL}friends/respond`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ requesterEmail, accept })
  });
  return handleJson(response);
}

export async function removeFriend({ friendEmail }) {
  const response = await authenticatedFetch(`${BASE_URL}friends/remove`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ friendEmail })
  });
  return handleJson(response);
}

export async function sendFriendMessage({ friendEmail, message, images }) {
  const response = await authenticatedFetch(`${BASE_URL}friends/message/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ friendEmail, message, images })
  });
  return handleJson(response);
}

export async function getFriendMessages({ friendEmail, page = 0, size = 50 }) {
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
