import type { RouteObject } from 'react-router-dom';

export const protectedRoutes: RouteObject[] = [
  // F-01: Dashboard
  {
    path: '/dashboard',
    children: [
      {
        index: true,
        lazy: () => import('../features/dashboard/pages/DashboardPage'),
      },
      {
        path: 'finance',
        lazy: () => import('../features/dashboard/pages/DashboardPage'),
      },
      {
        path: 'operations',
        lazy: () => import('../features/dashboard/pages/DashboardPage'),
      },
      {
        path: 'division',
        lazy: () => import('../features/dashboard/pages/DashboardPage'),
      },
      {
        path: 'personal',
        lazy: () => import('../features/dashboard/pages/DashboardPage'),
      },
    ],
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
        path: 'new',
        lazy: () => import('../features/assets/pages/AssetFormPage'),
      },
      {
        path: ':uuid',
        lazy: () => import('../features/assets/pages/AssetDetailPage'),
      },
      {
        path: 'stock',
        lazy: () => import('../features/assets/pages/StockPage'),
      },
      {
        path: 'categories',
        lazy: () => import('../features/assets/pages/CategoriesModelsPage'),
      },
      {
        path: 'purchases',
        lazy: () => import('../features/assets/pages/PurchasesPage'),
      },
      {
        path: 'purchases/new',
        lazy: () => import('../features/assets/pages/PurchaseFormPage'),
      },
      {
        path: 'purchases/:uuid',
        lazy: () => import('../features/assets/pages/PurchaseDetailPage'),
      },
      {
        path: 'depreciation',
        lazy: () => import('../features/assets/pages/DepreciationPage'),
      },
      {
        path: 'depreciation/new',
        lazy: () => import('../features/assets/pages/DepreciationFormPage'),
      },
      {
        path: 'depreciation/:uuid',
        lazy: () => import('../features/assets/pages/DepreciationDetailPage'),
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
      {
        path: 'new',
        lazy: () => import('../features/transactions/pages/RequestFormPage'),
      },
      {
        path: ':uuid',
        lazy: () => import('../features/transactions/pages/RequestDetailPage'),
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
      {
        path: 'new',
        lazy: () => import('../features/transactions/pages/LoanFormPage'),
      },
      {
        path: ':uuid',
        lazy: () => import('../features/transactions/pages/LoanDetailPage'),
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
      {
        path: 'new',
        lazy: () => import('../features/transactions/pages/ReturnFormPage'),
      },
      {
        path: ':uuid',
        lazy: () => import('../features/transactions/pages/ReturnDetailPage'),
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
      {
        path: 'new',
        lazy: () => import('../features/transactions/pages/HandoverFormPage'),
      },
      {
        path: ':uuid',
        lazy: () => import('../features/transactions/pages/HandoverDetailPage'),
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
      {
        path: 'new',
        lazy: () => import('../features/transactions/pages/RepairFormPage'),
      },
      {
        path: ':uuid',
        lazy: () => import('../features/transactions/pages/RepairDetailPage'),
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
      {
        path: 'new',
        lazy: () => import('../features/transactions/pages/ProjectFormPage'),
      },
      {
        path: ':uuid',
        lazy: () => import('../features/transactions/pages/ProjectDetailPage'),
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
      {
        path: 'new',
        lazy: () => import('../features/customers/pages/CustomerFormPage'),
      },
      {
        path: ':uuid',
        lazy: () => import('../features/customers/pages/CustomerDetailPage'),
      },
    ],
  },
  {
    path: '/installation',
    children: [
      {
        index: true,
        lazy: () => import('../features/customers/pages/InstallationListPage'),
      },
      {
        path: 'new',
        lazy: () => import('../features/customers/pages/InstallationFormPage'),
      },
      {
        path: ':id',
        lazy: () => import('../features/customers/pages/InstallationDetailPage'),
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
      {
        path: 'new',
        lazy: () => import('../features/customers/pages/MaintenanceFormPage'),
      },
      {
        path: ':id',
        lazy: () => import('../features/customers/pages/MaintenanceDetailPage'),
      },
    ],
  },
  {
    path: '/dismantle',
    children: [
      {
        index: true,
        lazy: () => import('../features/customers/pages/DismantleListPage'),
      },
      {
        path: 'new',
        lazy: () => import('../features/customers/pages/DismantleFormPage'),
      },
      {
        path: ':id',
        lazy: () => import('../features/customers/pages/DismantleDetailPage'),
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
      {
        path: 'users/new',
        lazy: () => import('../features/settings/pages/UserFormPage'),
      },
      {
        path: 'users/:uuid',
        lazy: () => import('../features/settings/pages/UserDetailPage'),
      },
      {
        path: 'divisions/new',
        lazy: () => import('../features/settings/pages/DivisionFormPage'),
      },
      {
        path: 'divisions/:uuid',
        lazy: () => import('../features/settings/pages/DivisionDetailPage'),
      },
    ],
  },
];
