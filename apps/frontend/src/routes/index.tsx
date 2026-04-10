import { createBrowserRouter, Navigate } from 'react-router-dom';
import { publicRoutes } from './public';
import { protectedRoutes } from './protected';

export const router = createBrowserRouter([
  ...publicRoutes,
  ...protectedRoutes,
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);
