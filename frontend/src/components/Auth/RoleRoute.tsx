import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { User } from '../../types';

interface RoleRouteProps {
  children: React.ReactNode;
  allowedRoles: User['role'][];
}

const RoleRoute: React.FC<RoleRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default RoleRoute; 