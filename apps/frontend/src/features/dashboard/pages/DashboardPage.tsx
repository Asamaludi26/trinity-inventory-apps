import { useLocation } from 'react-router-dom';
import { PageContainer } from '../../../components/layout/PageContainer';
import { useAuthStore } from '@/store/useAuthStore';
import type { UserRole } from '@/types';
import { SuperAdminDashboard } from './SuperAdminDashboard';
import { FinanceDashboard } from './FinanceDashboard';
import { OperationsDashboard } from './OperationsDashboard';
import { DivisionDashboard } from './DivisionDashboard';
import { PersonalDashboard } from './PersonalDashboard';

interface DashboardConfig {
  title: string;
  description: string;
  component: React.ComponentType;
}

const ROLE_DASHBOARD: Record<UserRole, DashboardConfig> = {
  SUPERADMIN: {
    title: 'Dashboard Utama',
    description: 'Overview seluruh sistem inventaris',
    component: SuperAdminDashboard,
  },
  ADMIN_PURCHASE: {
    title: 'Dashboard Keuangan',
    description: 'Ringkasan pembelian & depresiasi aset',
    component: FinanceDashboard,
  },
  ADMIN_LOGISTIK: {
    title: 'Dashboard Operasional',
    description: 'Monitoring stok, transaksi aktif, dan kondisi aset',
    component: OperationsDashboard,
  },
  LEADER: {
    title: 'Dashboard Divisi',
    description: 'Aset & transaksi divisi Anda',
    component: DivisionDashboard,
  },
  STAFF: {
    title: 'Dashboard Saya',
    description: 'Aset pribadi, pinjaman, dan riwayat Anda',
    component: PersonalDashboard,
  },
};

const PATH_DASHBOARD: Record<string, DashboardConfig> = {
  '/dashboard/finance': ROLE_DASHBOARD.ADMIN_PURCHASE,
  '/dashboard/operations': ROLE_DASHBOARD.ADMIN_LOGISTIK,
  '/dashboard/division': ROLE_DASHBOARD.LEADER,
  '/dashboard/personal': ROLE_DASHBOARD.STAFF,
};

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const { pathname } = useLocation();
  const role = (user?.role as UserRole) ?? 'STAFF';

  // Jika URL spesifik (/dashboard/finance, dll), tampilkan dashboard sesuai URL
  // Jika URL root (/dashboard), tampilkan dashboard sesuai role user
  const config = PATH_DASHBOARD[pathname] ?? ROLE_DASHBOARD[role] ?? ROLE_DASHBOARD.STAFF;
  const DashboardComponent = config.component;

  return (
    <PageContainer title={config.title} description={config.description}>
      <DashboardComponent />
    </PageContainer>
  );
}

export default DashboardPage;
export const Component = DashboardPage;
