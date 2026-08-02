import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContextContext';
import { normalizeAuthToken } from '../services/authStorage';
import LoadingSpinner from './LoadingSpinner';

const ResetPasswordRoute = ({ children }) => {
  const { loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner message="Checking authentication..." />;
  }

  const resetToken = normalizeAuthToken(sessionStorage.getItem('resetAccessToken'));
  const resetIdentifier = sessionStorage.getItem('resetEmail') || sessionStorage.getItem('resetIdentifier');
  const hasResetToken = Boolean(resetToken && resetIdentifier);

  if (!hasResetToken) {
    return <Navigate to="/forgot-password" state={{ from: location }} replace />;
  }

  return children;
};

export default ResetPasswordRoute;
