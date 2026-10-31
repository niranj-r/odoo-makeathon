import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

export const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  // If initial auth is resolving OR user is logged in but role profile query is still in flight,
  // hold at the loader rather than prematurely defaulting role to CUSTOMER!
  if (loading || (user && !role)) {
    return <LoadingSpinner size="fullscreen" message="Verifying authentication and role permissions..." />;
  }

  // Not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If specific roles are required, verify match
  if (allowedRoles.length > 0) {
    const currentRole = role || (user.email?.toLowerCase().includes('admin') ? 'ADMIN' : 'CUSTOMER');

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
