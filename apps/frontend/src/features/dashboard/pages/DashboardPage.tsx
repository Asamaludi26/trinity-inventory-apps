import { PageContainer } from '../../../components/layout/PageContainer';
import { useAuthStore } from '@/store/useAuthStore';
import type { UserRole } from '@/types';
import { SuperAdminDashboard } from './SuperAdminDashboard';
import { FinanceDashboard } from './FinanceDashboard';
import { OperationsDashboard } from './OperationsDashboard';
import { DivisionDashboard } from './DivisionDashboard';
import { PersonalDashboard } from './PersonalDashboard';

const DASHBOARD_CONFIG: Record<
  UserRole,
  { title: string; description: string; component: React.ComponentType }
> = {
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

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const role = (user?.role as UserRole) ?? 'STAFF';
  const config = DASHBOARD_CONFIG[role] ?? DASHBOARD_CONFIG.STAFF;
  const DashboardComponent = config.component;

  return (
    <PageContainer title={config.title} description={config.description}>
      <DashboardComponent />
    </PageContainer>
  );
}

export default DashboardPage;
export const Component = DashboardPage;
