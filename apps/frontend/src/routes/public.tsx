import type { RouteObject } from 'react-router-dom';
import { Navigate } from 'react-router-dom';

export const publicRoutes: RouteObject[] = [
  {
    path: '/login',
    lazy: () => import('../features/auth/pages/LoginPage'),
  },
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
];
