import { useQuery } from '@tanstack/react-query';
import { ShoppingCart, TrendingDown, Wallet, ClipboardList } from 'lucide-react';
import { dashboardApi } from '../api';
import { StatCard, RecentActivityTable } from '../components';

export function FinanceDashboard() {
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard', 'finance', 'stats'],
    queryFn: () => dashboardApi.getFinanceStats(),
    select: (res) => res.data.data,
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['dashboard', 'recent-activity'],
    queryFn: () => dashboardApi.getRecentActivity(10),
    select: (res) => res.data.data,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Pembelian"
          value={formatCurrency(statsData?.totalPurchases ?? 0)}
          icon={ShoppingCart}
          isLoading={statsLoading}
        />
        <StatCard
          title="Depresiasi Bulan Ini"
          value={formatCurrency(statsData?.monthlyDepreciation ?? 0)}
          icon={TrendingDown}
          isLoading={statsLoading}
        />
        <StatCard
          title="Budget Tersisa"
          value={formatCurrency(statsData?.remainingBudget ?? 0)}
          icon={Wallet}
          isLoading={statsLoading}
        />
        <StatCard
          title="Pending Approval"
          value={statsData?.pendingApprovals ?? 0}
          icon={ClipboardList}
          variant={statsData?.pendingApprovals ? 'warning' : 'default'}
          isLoading={statsLoading}
        />
      </div>

      {/* Recent Activity */}
      <RecentActivityTable activities={activities ?? []} isLoading={activitiesLoading} />
    </div>
  );
}
