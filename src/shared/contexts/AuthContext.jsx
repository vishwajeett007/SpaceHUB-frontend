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

      // Do not display session expired toast on public auth pages
      const publicAuthPaths = ['/login', '/signup', '/forgot-password', '/reset-password', '/'];
      if (!publicAuthPaths.includes(window.location.pathname)) {
        showToast('Your session has expired. Please log in again.', 'error');
      }
    };

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
  }, [dispatch, isAuthenticated]);

  // WebSocket connection management - persists across entire app
  useEffect(() => {
    if (!isAuthenticated || !user?.email) {
      if (previousUserEmailRef.current) {
        webSocketService.disconnect();
        previousUserEmailRef.current = null;
      }
      return;
    }

    const userEmail = user.email;

    if (previousUserEmailRef.current !== userEmail) {
      if (previousUserEmailRef.current) {
        webSocketService.disconnect();
      }
      previousUserEmailRef.current = userEmail;
      webSocketService.connect(userEmail);
    } else {
      if (!webSocketService.isConnected()) {
        webSocketService.connect(userEmail);
      }
    }
  }, [isAuthenticated, user?.email]);

  const handleLogin = (userData, token, rememberMe = true) => {
    dispatch(login({ userData, token, rememberMe }));
  };

  const handleLogout = () => {
    webSocketService.disconnect();
    previousUserEmailRef.current = null;
    dispatch(logout());
  };

  const handleUpdateUser = (updatedUserData) => {
    dispatch(updateUser(updatedUserData));
  };

  const getToken = () => token;

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
