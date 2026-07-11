import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContextContext';
import LoadingSpinner from './LoadingSpinner';

const ProfileSetupRoute = ({ children }) => {
  const { isAuthenticated, loading, getToken } = useAuth();
  const location = useLocation();
  const profileSetupRequired = localStorage.getItem('profileSetupRequired') === 'true';

  if (loading) {
    return <LoadingSpinner message="Checking authentication..." />;
  }
const accessToken = getToken();
  if (!accessToken && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (!profileSetupRequired) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

export default ProfileSetupRoute;


