import { useQuery } from '@tanstack/react-query';
import { ShoppingCart, TrendingDown, Wallet, ClipboardList } from 'lucide-react';
import { dashboardApi } from '../api';
import { StatCard, RecentActivityTable } from '../components';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

  const { data: spendingByCategory, isLoading: spendingLoading } = useQuery({
    queryKey: ['dashboard', 'finance', 'spending-by-category'],
    queryFn: () => dashboardApi.getSpendingByCategory(),
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

      <Card>
        <CardHeader>
          <CardTitle>Pengeluaran per Kategori</CardTitle>
        </CardHeader>
        <CardContent>
          {spendingLoading ? (
            <p className="text-sm text-muted-foreground">Memuat data kategori...</p>
          ) : !spendingByCategory?.length ? (
            <p className="text-sm text-muted-foreground">Belum ada data pengeluaran kategori.</p>
          ) : (
            <div className="space-y-3">
              {spendingByCategory.map((item) => (
                <div key={item.category} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: item.fill }}
                      aria-hidden="true"
                    />
                    <span className="text-sm truncate">{item.category}</span>
                  </div>
                  <span className="text-sm font-medium">{formatCurrency(item.totalSpent)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <RecentActivityTable activities={activities ?? []} isLoading={activitiesLoading} />
    </div>
  );
}
