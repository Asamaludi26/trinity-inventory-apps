import type { FC, ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import type { UserRole } from '@/types';

interface RoleProtectedRouteProps {
  children?: ReactNode;
  allowedRoles: UserRole[];
  /** Where to redirect on unauthorized (defaults to /dashboard) */
  fallbackPath?: string;
}

export const RoleProtectedRoute: FC<RoleProtectedRouteProps> = ({
  children,
  allowedRoles,
  fallbackPath = '/dashboard',
}) => {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Not authenticated at all — redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Authenticated but wrong role — redirect to fallback
  if (!allowedRoles.includes(user.role as UserRole)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children ?? <Outlet />}</>;
};
