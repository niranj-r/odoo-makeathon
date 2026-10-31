import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

export const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, role, loading, isConfigured } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner size="fullscreen" message="Verifying authentication and permissions..." />;
  }

  // Not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If specific roles are required, verify match
  if (allowedRoles.length > 0) {
    const currentRole = role || 'CUSTOMER';

    if (!allowedRoles.includes(currentRole)) {
      // Redirect to the dashboard appropriate for the user's role
      if (currentRole === 'ADMIN') {
        return <Navigate to="/admin/dashboard" replace />;
      }
      if (currentRole === 'STAFF') {
        return <Navigate to="/staff/dashboard" replace />;
      }
      return <Navigate to="/portal/dashboard" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;

