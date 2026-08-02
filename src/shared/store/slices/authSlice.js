import { createSlice } from '@reduxjs/toolkit';
import {
  clearLegacyLocalAuth,
  clearStoredAuth,
  getStoredAuthToken,
  normalizeAuthToken,
  persistAuthSession,
  readStoredUser,
} from '../../services/authStorage';

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    checkAuthStatus: (state) => {
      try {
        clearLegacyLocalAuth();
        const token = getStoredAuthToken();
        const userData = readStoredUser();

        if (token && userData) {
          // Restore a cookie-backed token into session storage so API requests
          // and auth state continue to use the same source of truth.
          persistAuthSession(userData, token);
          state.user = userData;
          state.token = token;
          state.isAuthenticated = true;
        } else {
          clearStoredAuth();
          state.user = null;
          state.token = null;
          state.isAuthenticated = false;
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        clearStoredAuth();
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      } finally {
        state.loading = false;
      }
    },
    login: (state, action) => {
      const { userData, token } = action.payload;
      const normalizedToken = normalizeAuthToken(token);
      try {
        if (persistAuthSession(userData, normalizedToken)) {
          state.user = userData;
          state.token = normalizedToken;
          state.isAuthenticated = true;
        } else {
          clearStoredAuth();
          state.user = null;
          state.token = null;
          state.isAuthenticated = false;
        }
      } catch (error) {
        console.error('Error saving auth data:', error);
        clearStoredAuth();
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      }
    },
    logout: (state, action) => {
      try {
        clearStoredAuth({ includeResetState: true });
        if (!action.payload?.preserveProfileSetup) {
          localStorage.removeItem('profileSetupRequired');
        }
      } catch (error) {
        console.error('Error clearing auth data:', error);
      }
      // Local storage can be unavailable; logout must still clear in-memory access.
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    },
    updateUser: (state, action) => {
      try {
        const updatedUserData = action.payload;
        if (state.isAuthenticated && state.token && updatedUserData) {
          sessionStorage.setItem('userData', JSON.stringify(updatedUserData));
          state.user = updatedUserData;
        }
      } catch (error) {
        console.error('Error updating user data:', error);
      }
    },
  },
});

export const { setLoading, checkAuthStatus, login, logout, updateUser } = authSlice.actions;

export const selectUser = (state) => state.auth.user;
export const selectToken = (state) => state.auth.token;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.loading;

export default authSlice.reducer;
