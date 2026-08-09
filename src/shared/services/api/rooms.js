import { authenticatedFetch, BASE_URL } from './client';
import { handleJson } from './response';

export async function joinRoom(roomCode) {
  const response = await authenticatedFetch(`${BASE_URL}rooms/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomCode })
  });
  return handleJson(response);
}

export async function createNewChatroom(roomCode, name) {
  const response = await authenticatedFetch(`${BASE_URL}new-chatroom/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomCode, name })
  });
  return handleJson(response);
}

export async function createDefaultAnnouncementGroup(communityId) {
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

export async function deleteChatroom(chatroomId, roomCode) {
  const response = await authenticatedFetch(`${BASE_URL}new-chatroom/${chatroomId}/delete?RoomCode=${encodeURIComponent(roomCode)}`, {
    method: 'DELETE'
  });
  return handleJson(response);
}

export async function getVoiceRoomsList(roomId) {
  const response = await authenticatedFetch(`${BASE_URL}voice-room/list/${roomId}`, {
    method: 'GET'
  });
  return handleJson(response);
}

export async function createVoiceRoom(chatRoomId, roomName) {
  const params = new URLSearchParams();
  params.set('chatRoomId', chatRoomId);
  params.set('roomName', roomName);

  const response = await authenticatedFetch(`${BASE_URL}voice-room/create?${params.toString()}`, {
    method: 'POST'
  });
  return handleJson(response);
}

export async function deleteVoiceRoom(chatRoomId, roomName) {
  const params = new URLSearchParams();
  params.set('chatRoomId', chatRoomId);
  params.set('roomName', roomName);

  const response = await authenticatedFetch(`${BASE_URL}voice-room/delete?${params.toString()}`, {
    method: 'DELETE'
  });
  return handleJson(response);
}

export async function joinVoiceRoom(janusRoomId, displayName) {
  const params = new URLSearchParams();
  params.set('janusRoomId', janusRoomId);
  params.set('displayName', displayName);

  const response = await authenticatedFetch(`${BASE_URL}voice-room/join?${params.toString()}`, {
    method: 'POST'
  });
  return handleJson(response);
}
