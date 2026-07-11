import { BASE_URL } from './API';

const getWsUrl = (email) => {
  if (!BASE_URL) {
    return `wss://spacehub.monu14.me/notification?email=${encodeURIComponent(email)}`;
  }
  try {
    const url = new URL(BASE_URL);
    const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${url.host}/notification?email=${encodeURIComponent(email)}`;
  } catch (e) {
    console.error('Failed to parse BASE_URL for WebSocket:', e);
    return `wss://spacehub.monu14.me/notification?email=${encodeURIComponent(email)}`;
  }
};

class WebSocketService {
  constructor() {
    this.ws = null;
    this.userEmail = null;
    this.listeners = new Set();
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
    this.reconnectTimer = null;
  }

  connect(email) {
    if (!email) {
      console.error('WebSocket: email is required');
      return;
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket: Already connected');
      return;
    }

    if (this.isConnecting) {
      console.log('WebSocket: Connection already in progress');
      return;
    }

    this.userEmail = email;
    this.isConnecting = true;

    try {
      const wsUrl = getWsUrl(email);
      console.log('WebSocket: Attempting to connect to', wsUrl);
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket: Connected successfully');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.notifyListeners('connected', { email });
      };

      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          console.log('WebSocket: Message received', payload);
          this.handleMessage(payload);
        } catch (error) {
          console.error('WebSocket: failed to parse message', error, event.data);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket: Connection error', error);
        console.error('WebSocket: ReadyState', this.ws?.readyState);
        console.error('WebSocket: URL attempted', wsUrl);
        this.isConnecting = false;
        this.notifyListeners('error', { error, url: wsUrl });
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket: Connection closed', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
          attempts: this.reconnectAttempts
        });
        this.isConnecting = false;
        this.ws = null;
        this.notifyListeners('disconnected', { code: event.code, reason: event.reason });
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          console.log(`WebSocket: Scheduling reconnect attempt ${this.reconnectAttempts + 1}`);
          this.scheduleReconnect();
        } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error('WebSocket: Max reconnection attempts reached');
        }
      };
    } catch (error) {
      console.error('WebSocket: Failed to create connection', error);
      this.isConnecting = false;
      this.notifyListeners('error', { error });
    }
  }

  handleMessage(data) {
    if (Array.isArray(data)) {
      data.forEach((item) => this.handleSingleNotification(item));
      if (data.length === 0) {
        this.notifyListeners('notification', {
          friendRequests: [],
          communityRequests: [],
          pendingRequests: [],
        });
      }
      return;
    }

    this.handleSingleNotification(data);
  }

  handleSingleNotification(notification) {
    if (!notification || typeof notification !== 'object') {
      return;
    }

    const type = (notification.type || '').toUpperCase();
    switch (type) {
      case 'FRIEND_REQUEST':
      case 'INCOMING_FRIEND_REQUEST':
        this.notifyListeners('friend_request', notification);
        break;
      case 'FRIEND_REQUESTS':
        this.notifyListeners('friend_requests_bulk', notification.requests || []);
        break;
      case 'COMMUNITY_JOIN_REQUEST':
      case 'COMMUNITY_REQUEST':
      case 'COMMUNITY_JOINED':
        this.notifyListeners('community_request', notification);
        break;
      case 'COMMUNITY_REQUESTS':
        this.notifyListeners('community_requests_bulk', notification.requests || []);
        break;
      case 'PENDING_REQUEST':
      case 'OUTGOING_FRIEND_REQUEST':
        this.notifyListeners('pending_friend_request', notification);
        break;
      case 'PENDING_REQUESTS':
        this.notifyListeners('pending_requests_bulk', notification.requests || []);
        break;
      case 'FRIEND_REQUEST_ACCEPTED':
      case 'FRIEND_REQUEST_REJECTED':
        this.notifyListeners('friend_request_response', notification);
        break;
      default:
        this.notifyListeners('notification', notification);
        break;
    }
  }

  scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectAttempts += 1;
    const delay = this.reconnectDelay * Math.min(this.reconnectAttempts, 3);

    this.reconnectTimer = setTimeout(() => {
      if (this.userEmail) {
        this.connect(this.userEmail);
      }
    }, delay);
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'client disconnect');
      this.ws = null;
    }

    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.userEmail = null;
    this.notifyListeners('disconnected', { code: 1000 });
  }

  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  requestNotifications() {
    this.send({ type: 'get_notifications' });
  }

  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners(eventType, data) {
    this.listeners.forEach((listener) => {
      try {
        listener(eventType, data);
      } catch (error) {
        console.error('WebSocket: listener error', error);
      }
    });
  }

  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

const webSocketService = new WebSocketService();
export default webSocketService