import type { RouteObject } from 'react-router-dom';

export const protectedRoutes: RouteObject[] = [
  {
    path: '/dashboard',
    lazy: () => import('../features/dashboard/pages/DashboardPage'),
  },
  {
    path: '/assets',
    children: [
      {
        index: true,
        lazy: () => import('../features/assets/pages/AssetListPage'),
      },
    ],
  },
  {
    path: '/requests',
    children: [
      {
        index: true,
        lazy: () => import('../features/transactions/pages/RequestListPage'),
      },
    ],
  },
  {
    path: '/customers',
    children: [
      {
        index: true,
        lazy: () => import('../features/customers/pages/CustomerListPage'),
      },
    ],
  },
  {
    path: '/settings',
    children: [
      {
        path: 'profile',
        lazy: () => import('../features/settings/pages/ProfilePage'),
      },
    ],
  },
];
