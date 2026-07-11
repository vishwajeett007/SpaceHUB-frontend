import { createSlice } from '@reduxjs/toolkit';
import { getCookie } from '../../services/API';
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
        let token = sessionStorage.getItem('accessToken') || getCookie('token');
        if (token === 'undefined' || token === 'null') {
          token = null;
        }
        const userData = sessionStorage.getItem('userData');

        if (userData) {
          const parsedUserData = JSON.parse(userData);
          state.user = parsedUserData;
          state.token = token;
          state.isAuthenticated = true;
        } else {
          state.user = null;
          state.token = null;
          state.isAuthenticated = false;
          localStorage.removeItem('profileSetupRequired');
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        sessionStorage.removeItem('accessToken');
        sessionStorage.removeItem('userData');
        localStorage.removeItem('profileSetupRequired');
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      } finally {
        state.loading = false;
      }
    },
    login: (state, action) => {
      let { userData, token } = action.payload;
      if (token === 'undefined' || token === 'null') {
        token = null;
      }
      try {
        if (token) {
          sessionStorage.setItem('accessToken', token);
          state.token = token;
        }
        sessionStorage.setItem('userData', JSON.stringify(userData));
        state.user = userData;
        state.isAuthenticated = true;
        localStorage.removeItem('profileSetupRequired');
      } catch (error) {
        console.error('Error saving auth data:', error);
      }
    },
    logout: (state) => {
      try {
        sessionStorage.removeItem('accessToken');
        sessionStorage.removeItem('userData');
        sessionStorage.removeItem('resetEmail');
        sessionStorage.removeItem('resetAccessToken');
        localStorage.removeItem('profileSetupRequired');
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      } catch (error) {
        console.error('Error clearing auth data:', error);
      }
    },
    updateUser: (state, action) => {
      try {
        const updatedUserData = action.payload;
        sessionStorage.setItem('userData', JSON.stringify(updatedUserData));
        state.user = updatedUserData;
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

