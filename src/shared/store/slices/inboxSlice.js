import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  requests: [],
  pending: [],
  loading: false,
  error: '',
  activeTab: 'request',
  processingRequest: null,
  unreadCount: 0,
  readRequestIds: [],
  wsConnected: false,
};

const inboxSlice = createSlice({
  name: 'inbox',
  initialState,
  reducers: {
    setRequests: (state, action) => {
      const newRequests = action.payload;

      const newUnreadCount = newRequests.filter(req => !state.readRequestIds.includes(req.id)).length;
      state.requests = newRequests;
      state.unreadCount = newUnreadCount;
      state.loading = false;
      state.error = '';
    },
    setPending: (state, action) => {
      state.pending = action.payload;
      state.loading = false;
      state.error = '';
    },
    addRequest: (state, action) => {
      const newRequest = action.payload;

      const exists = state.requests.some(r => r.id === newRequest.id);
      if (!exists) {
        state.requests.push(newRequest);

        if (!state.readRequestIds.includes(newRequest.id)) {
          state.unreadCount += 1;
        }
      }
    },
    addPending: (state, action) => {
      const newPending = action.payload;

      const exists = state.pending.some(p => p.id === newPending.id);
      if (!exists) {
        state.pending.push(newPending);
      }
    },
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    setProcessingRequest: (state, action) => {
      state.processingRequest = action.payload;
    },
    removeRequest: (state, action) => {
      const requestId = action.payload;
      const request = state.requests.find(r => r.id === requestId);

      if (request && !state.readRequestIds.includes(requestId)) {
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
      state.requests = state.requests.filter((r) => r.id !== requestId);
      state.readRequestIds = state.readRequestIds.filter(id => id !== requestId);
    },
    removePending: (state, action) => {
      const pendingId = action.payload;
      state.pending = state.pending.filter((p) => p.id !== pendingId);
    },
    setWsConnected: (state, action) => {
      state.wsConnected = action.payload;
    },
    markAsRead: (state, action) => {
      const requestId = action.payload;
      if (!state.readRequestIds.includes(requestId)) {
        state.readRequestIds.push(requestId);
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllAsRead: (state) => {
      state.requests.forEach(request => {
        if (!state.readRequestIds.includes(request.id)) {
          state.readRequestIds.push(request.id);
        }
      });
      state.unreadCount = 0;
    },
    clearInbox: (state) => {
      state.requests = [];
      state.pending = [];
      state.error = '';
      state.processingRequest = null;
      state.unreadCount = 0;
      state.readRequestIds = [];
    },
  },
});

export const {
  setRequests,
  setPending,
  addRequest,
  addPending,
  setActiveTab,
  setLoading,
  setError,
  setProcessingRequest,
  removeRequest,
  removePending,
  setWsConnected,
  markAsRead,
  markAllAsRead,
  clearInbox,
} = inboxSlice.actions;

export const selectRequests = (state) => state.inbox.requests;
export const selectPending = (state) => state.inbox.pending;
export const selectInboxActiveTab = (state) => state.inbox.activeTab;
export const selectInboxLoading = (state) => state.inbox.loading;
export const selectInboxError = (state) => state.inbox.error;
export const selectProcessingRequest = (state) => state.inbox.processingRequest;
export const selectUnreadCount = (state) => state.inbox.unreadCount;
export const selectWsConnected = (state) => state.inbox.wsConnected;

export default inboxSlice.reducer;

