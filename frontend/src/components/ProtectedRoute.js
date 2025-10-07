import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, hasRole, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="200px"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated()) {
    // Redirect to login with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    // Redirect to dashboard if user doesn't have required role
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;