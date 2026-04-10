import type { RouteObject } from 'react-router-dom';

export const protectedRoutes: RouteObject[] = [
  // F-01: Dashboard
  {
    path: '/dashboard',
    lazy: () => import('../features/dashboard/pages/DashboardPage'),
  },

  // F-02: Manajemen Aset
  {
    path: '/assets',
    children: [
      {
        index: true,
        lazy: () => import('../features/assets/pages/AssetListPage'),
      },
      {
        path: 'stock',
        lazy: () => import('../features/assets/pages/StockPage'),
      },
      {
        path: 'categories',
        lazy: () => import('../features/assets/pages/CategoriesPage'),
      },
      {
        path: 'types',
        lazy: () => import('../features/assets/pages/TypesPage'),
      },
      {
        path: 'models',
        lazy: () => import('../features/assets/pages/ModelsPage'),
      },
      {
        path: 'purchases',
        lazy: () => import('../features/assets/pages/PurchasesPage'),
      },
      {
        path: 'depreciation',
        lazy: () => import('../features/assets/pages/DepreciationPage'),
      },
    ],
  },

  // F-04: Transaksi
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
    path: '/loans',
    children: [
      {
        index: true,
        lazy: () => import('../features/transactions/pages/LoanListPage'),
      },
    ],
  },
  {
    path: '/returns',
    children: [
      {
        index: true,
        lazy: () => import('../features/transactions/pages/ReturnListPage'),
      },
    ],
  },
  {
    path: '/handovers',
    children: [
      {
        index: true,
        lazy: () => import('../features/transactions/pages/HandoverListPage'),
      },
    ],
  },
  {
    path: '/repairs',
    children: [
      {
        index: true,
        lazy: () => import('../features/transactions/pages/RepairListPage'),
      },
    ],
  },
  {
    path: '/projects',
    children: [
      {
        index: true,
        lazy: () => import('../features/transactions/pages/ProjectListPage'),
      },
    ],
  },

  // F-05: Pelanggan
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
    path: '/installations',
    children: [
      {
        index: true,
        lazy: () => import('../features/customers/pages/InstallationListPage'),
      },
    ],
  },
  {
    path: '/maintenance',
    children: [
      {
        index: true,
        lazy: () => import('../features/customers/pages/MaintenanceListPage'),
      },
    ],
  },
  {
    path: '/dismantles',
    children: [
      {
        index: true,
        lazy: () => import('../features/customers/pages/DismantleListPage'),
      },
    ],
  },

  // F-06: Pengaturan
  {
    path: '/settings',
    children: [
      {
        path: 'profile',
        lazy: () => import('../features/settings/pages/ProfilePage'),
      },
      {
        path: 'users-divisions',
        lazy: () => import('../features/settings/pages/UsersDivisionsPage'),
      },
    ],
  },
];
