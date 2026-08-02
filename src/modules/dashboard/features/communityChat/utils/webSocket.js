const FALLBACK_CHAT_ORIGIN = 'wss://spacehub.monu14.me';

export const getCommunityChatWebSocketUrl = (baseUrl, roomCode, userEmail) => {
  const query = `roomCode=${encodeURIComponent(roomCode)}&email=${encodeURIComponent(userEmail)}`;
  if (!baseUrl) return `${FALLBACK_CHAT_ORIGIN}/chat?${query}`;

  try {
    const url = new URL(baseUrl);
    const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${url.host}/chat?${query}`;
  } catch (error) {
    console.error('Failed to parse BASE_URL for WebSocket:', error);
    return `${FALLBACK_CHAT_ORIGIN}/chat?${query}`;
  }
};
