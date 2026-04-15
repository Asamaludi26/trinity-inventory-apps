import type { RouteObject } from 'react-router-dom';
import { RoleProtectedRoute } from '@/components/guard/RoleProtectedRoute';

const ALL_ROLES = ['SUPERADMIN', 'ADMIN_LOGISTIK', 'ADMIN_PURCHASE', 'LEADER', 'STAFF'] as const;

export const protectedRoutes: RouteObject[] = [
  // Notifications — accessible by all roles
  {
    path: '/notifications',
    element: <RoleProtectedRoute allowedRoles={[...ALL_ROLES]} />,
    children: [
      {
        index: true,
        lazy: () => import('../features/notifications/pages/NotificationListPage'),
      },
    ],
  },

  // F-01: Dashboard — accessible by all roles
  {
    path: '/dashboard',
    element: <RoleProtectedRoute allowedRoles={[...ALL_ROLES]} />,
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

  // F-02: Manajemen Aset — SA, AL, AP (read), SA+AL (write)
  {
    path: '/assets',
    element: (
      <RoleProtectedRoute allowedRoles={['SUPERADMIN', 'ADMIN_LOGISTIK', 'ADMIN_PURCHASE']} />
    ),
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
        path: ':id',
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

  // F-04: Transaksi — all roles can create/view (backend enforces fine-grained RBAC)
  {
    path: '/requests',
    element: <RoleProtectedRoute allowedRoles={[...ALL_ROLES]} />,
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
    element: <RoleProtectedRoute allowedRoles={[...ALL_ROLES]} />,
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
    element: <RoleProtectedRoute allowedRoles={[...ALL_ROLES]} />,
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
    element: <RoleProtectedRoute allowedRoles={[...ALL_ROLES]} />,
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
    element: (
      <RoleProtectedRoute allowedRoles={['SUPERADMIN', 'ADMIN_LOGISTIK', 'LEADER', 'STAFF']} />
    ),
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
    element: (
      <RoleProtectedRoute allowedRoles={['SUPERADMIN', 'ADMIN_LOGISTIK', 'LEADER', 'STAFF']} />
    ),
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

  // F-05: Pelanggan — SA, AL, Leader (divisi), Staff (divisi)
  {
    path: '/customers',
    element: (
      <RoleProtectedRoute allowedRoles={['SUPERADMIN', 'ADMIN_LOGISTIK', 'LEADER', 'STAFF']} />
    ),
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
    element: (
      <RoleProtectedRoute allowedRoles={['SUPERADMIN', 'ADMIN_LOGISTIK', 'LEADER', 'STAFF']} />
    ),
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
    element: (
      <RoleProtectedRoute allowedRoles={['SUPERADMIN', 'ADMIN_LOGISTIK', 'LEADER', 'STAFF']} />
    ),
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
    element: <RoleProtectedRoute allowedRoles={['SUPERADMIN', 'ADMIN_LOGISTIK']} />,
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
        path: 'notification-preferences',
        lazy: () => import('../features/settings/pages/NotificationPreferencesPage'),
      },
      {
        // Users & Divisions — SUPERADMIN only
        path: 'users-divisions',
        element: <RoleProtectedRoute allowedRoles={['SUPERADMIN']} />,
        children: [
          {
            index: true,
            lazy: () => import('../features/settings/pages/UsersDivisionsPage'),
          },
        ],
      },
      {
        path: 'users/new',
        element: <RoleProtectedRoute allowedRoles={['SUPERADMIN']} />,
        children: [
          {
            index: true,
            lazy: () => import('../features/settings/pages/UserFormPage'),
          },
        ],
      },
      {
        path: 'users/:uuid',
        element: <RoleProtectedRoute allowedRoles={['SUPERADMIN']} />,
        children: [
          {
            index: true,
            lazy: () => import('../features/settings/pages/UserDetailPage'),
          },
        ],
      },
      {
        path: 'divisions/new',
        element: <RoleProtectedRoute allowedRoles={['SUPERADMIN']} />,
        children: [
          {
            index: true,
            lazy: () => import('../features/settings/pages/DivisionFormPage'),
          },
        ],
      },
      {
        path: 'divisions/:uuid',
        element: <RoleProtectedRoute allowedRoles={['SUPERADMIN']} />,
        children: [
          {
            index: true,
            lazy: () => import('../features/settings/pages/DivisionDetailPage'),
          },
        ],
      },
      {
        path: 'audit-log',
        element: <RoleProtectedRoute allowedRoles={['SUPERADMIN']} />,
        children: [
          {
            index: true,
            lazy: () => import('../features/settings/pages/AuditLogPage'),
          },
        ],
      },
    ],
  },
];
