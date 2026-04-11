import { useQuery } from '@tanstack/react-query';
import { Package, AlertTriangle, ArrowLeftRight, Wrench } from 'lucide-react';
import { dashboardApi } from '../api';
import { StatCard, StockAlertTable, RecentActivityTable } from '../components';

export function OperationsDashboard() {
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard', 'operations', 'stats'],
    queryFn: () => dashboardApi.getOperationsStats(),
    select: (res) => res.data.data,
  });

  const { data: stockAlerts, isLoading: stockLoading } = useQuery({
    queryKey: ['dashboard', 'operations', 'stock-alerts'],
    queryFn: () => dashboardApi.getStockAlerts(),
    select: (res) => res.data.data,
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['dashboard', 'recent-activity'],
    queryFn: () => dashboardApi.getRecentActivity(10),
    select: (res) => res.data.data,
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Aset"
          value={statsData?.totalAssets ?? 0}
          icon={Package}
          isLoading={statsLoading}
        />
        <StatCard
          title="Stok Kritis"
          value={statsData?.criticalStock ?? 0}
          icon={AlertTriangle}
          variant={statsData?.criticalStock ? 'danger' : 'default'}
          isLoading={statsLoading}
        />
        <StatCard
          title="Pinjaman Belum Kembali"
          value={statsData?.overdueLoans ?? 0}
          icon={ArrowLeftRight}
          variant={statsData?.overdueLoans ? 'warning' : 'default'}
          isLoading={statsLoading}
        />
        <StatCard
          title="Dalam Perbaikan"
          value={statsData?.underRepair ?? 0}
          icon={Wrench}
          isLoading={statsLoading}
        />
      </div>

      {/* Stock Alerts */}
      <StockAlertTable items={stockAlerts ?? []} isLoading={stockLoading} />

      {/* Recent Activity */}
      <RecentActivityTable activities={activities ?? []} isLoading={activitiesLoading} />
    </div>
  );
}
