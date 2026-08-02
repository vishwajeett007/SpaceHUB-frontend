import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AuthContext } from './AuthContextContext';
import webSocketService from '../services/WebSocketService';
import { AUTH_UNAUTHORIZED_EVENT } from '../services/authEvents';
import { showToast } from '../services/toast';
import { 
  checkAuthStatus, 
  login, 
  logout, 
  updateUser,
  selectUser, 
  selectToken,
  selectIsAuthenticated, 
  selectAuthLoading 
} from '../store/slices/authSlice';

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const token = useSelector(selectToken);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const loading = useSelector(selectAuthLoading);
  const previousUserEmailRef = useRef(null);
  const unauthorizedHandledRef = useRef(false);

  useEffect(() => {
    dispatch(checkAuthStatus());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) unauthorizedHandledRef.current = false;
  }, [isAuthenticated]);

  useEffect(() => {
    const handleUnauthorized = () => {
      if (!isAuthenticated || unauthorizedHandledRef.current) return;

      unauthorizedHandledRef.current = true;
      webSocketService.disconnect();
      previousUserEmailRef.current = null;
      dispatch(logout({ preserveProfileSetup: true }));
      showToast('Your session has expired. Please log in again.', 'error');
    };

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
  }, [dispatch, isAuthenticated]);

  // WebSocket connection management - persists across entire app
  useEffect(() => {
    if (!isAuthenticated || !user?.email) {
      // Disconnect if not authenticated or no email
      if (previousUserEmailRef.current) {
        webSocketService.disconnect();
        previousUserEmailRef.current = null;
      }
      return;
    }

    const userEmail = user.email;

    // Only connect if email changed or not connected
    if (previousUserEmailRef.current !== userEmail) {
      // Disconnect previous connection if switching users
      if (previousUserEmailRef.current) {
        webSocketService.disconnect();
      }
      previousUserEmailRef.current = userEmail;
      console.log('AuthProvider: Connecting WebSocket for user:', userEmail);
      webSocketService.connect(userEmail);
    } else {
      // Same email, just ensure connected (won't reconnect if already connected)
      if (!webSocketService.isConnected()) {
        console.log('AuthProvider: Reconnecting WebSocket for user:', userEmail);
        webSocketService.connect(userEmail);
      }
    }

    return () => {
      // Don't disconnect on unmount - keep connection alive across route changes
      // Only disconnect on logout (handled in handleLogout)
    };
  }, [isAuthenticated, user?.email]);

  const handleLogin = (userData, token) => {
    dispatch(login({ userData, token }));
  };

  const handleLogout = () => {
    // Disconnect WebSocket on logout
    console.log('AuthProvider: Disconnecting WebSocket on logout');
    webSocketService.disconnect();
    previousUserEmailRef.current = null;
    dispatch(logout());
  };

  const handleUpdateUser = (updatedUserData) => {
    dispatch(updateUser(updatedUserData));
  };

  const getToken = () => {
    return token;
  };

  const checkAuth = () => {
    dispatch(checkAuthStatus());
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login: handleLogin,
    logout: handleLogout,
    updateUser: handleUpdateUser,
    getToken,
    checkAuthStatus: checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
