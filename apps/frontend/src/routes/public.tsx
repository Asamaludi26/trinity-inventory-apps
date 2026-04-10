import type { RouteObject } from 'react-router-dom';
import { Navigate } from 'react-router-dom';

// Lazy loaded pages
const LoginPage = () =>
  import('../features/auth/pages/LoginPage').then((m) => ({ default: m.LoginPage }));

export const publicRoutes: RouteObject[] = [
  {
    path: '/login',
    lazy: LoginPage,
  },
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
];
