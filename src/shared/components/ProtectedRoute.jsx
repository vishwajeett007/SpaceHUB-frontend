import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../shared/contexts/AuthContextContext';
import LoadingSpinner from './LoadingSpinner';

// Temporarily disable route protection — always render children.
// Original auth logic is kept commented for easy restore.
const ProtectedRoute = ({ children }) => {
  return children;
};

/*
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const profileSetupRequired = sessionStorage.getItem('profileSetupRequired') === 'true';

  if (loading) {
    return <LoadingSpinner message="Checking authentication..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (profileSetupRequired && location.pathname !== '/profile/setup') {
    return <Navigate to="/profile/setup" replace />;
  }

  return children;
};
*/

export default ProtectedRoute;
