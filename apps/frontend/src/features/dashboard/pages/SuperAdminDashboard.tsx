import { useQuery } from '@tanstack/react-query';
import {
  Package,
  ClipboardList,
  ArrowLeftRight,
  Wrench,
  AlertTriangle,
  Settings,
} from 'lucide-react';
import { dashboardApi } from '../api';
import {
  StatCard,
  RecentActivityTable,
  AssetTrendChart,
  CategoryDistributionChart,
} from '../components';

export function SuperAdminDashboard() {
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => dashboardApi.getStats(),
    select: (res) => res.data.data,
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['dashboard', 'recent-activity'],
    queryFn: () => dashboardApi.getRecentActivity(10),
    select: (res) => res.data.data,
  });

  const { data: trendData, isLoading: trendLoading } = useQuery({
    queryKey: ['dashboard', 'asset-trend'],
    queryFn: () => dashboardApi.getAssetTrend(6),
    select: (res) => res.data.data,
  });

  const { data: categoryData, isLoading: categoryLoading } = useQuery({
    queryKey: ['dashboard', 'category-distribution'],
    queryFn: () => dashboardApi.getCategoryDistribution(),
    select: (res) => res.data.data,
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <StatCard
          title="Total Aset"
          value={statsData?.totalAssets ?? 0}
          icon={Package}
          isLoading={statsLoading}
        />
        <StatCard
          title="Request Pending"
          value={statsData?.pendingRequests ?? 0}
          icon={ClipboardList}
          variant={statsData?.pendingRequests ? 'warning' : 'default'}
          isLoading={statsLoading}
        />
        <StatCard
          title="Pinjaman Aktif"
          value={statsData?.activeLoans ?? 0}
          icon={ArrowLeftRight}
          isLoading={statsLoading}
        />
        <StatCard
          title="Aset Rusak"
          value={statsData?.damagedAssets ?? 0}
          icon={Wrench}
          variant={statsData?.damagedAssets ? 'danger' : 'default'}
          isLoading={statsLoading}
        />
        <StatCard
          title="Dalam Perbaikan"
          value={statsData?.underRepair ?? 0}
          icon={Settings}
          variant={statsData?.underRepair ? 'warning' : 'default'}
          isLoading={statsLoading}
        />
        <StatCard
          title="Stok Low Alert"
          value={statsData?.lowStockAlerts ?? 0}
          icon={AlertTriangle}
          variant={statsData?.lowStockAlerts ? 'danger' : 'default'}
          isLoading={statsLoading}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <AssetTrendChart data={trendData ?? []} isLoading={trendLoading} />
        <CategoryDistributionChart data={categoryData ?? []} isLoading={categoryLoading} />
      </div>

      {/* Recent Activity */}
      <RecentActivityTable activities={activities ?? []} isLoading={activitiesLoading} />
    </div>
  );
}
