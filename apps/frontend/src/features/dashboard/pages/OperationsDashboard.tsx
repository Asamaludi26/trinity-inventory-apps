import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Package,
  AlertTriangle,
  ArrowLeftRight,
  Wrench,
  Activity,
  ClipboardList,
  RefreshCw,
  Repeat,
} from 'lucide-react';
import { dashboardApi } from '../api';
import { StatCard, StockAlertTable, RecentActivityTable, DashboardTimeFilter } from '../components';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DashboardFilter } from '../types';

export function OperationsDashboard() {
  const [filter, setFilter] = useState<DashboardFilter>({ preset: '30d' });

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard', 'operations', 'stats', filter],
    queryFn: () => dashboardApi.getOperationsStats(filter),
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

  const { data: dailyOps, isLoading: dailyOpsLoading } = useQuery({
    queryKey: ['dashboard', 'operations', 'daily-ops'],
    queryFn: () => dashboardApi.getDailyOps(),
    select: (res) => res.data.data,
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Time Filter */}
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">Filter periode</p>
        <DashboardTimeFilter filter={filter} onChange={setFilter} />
      </div>

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

      <Card>
        <CardHeader>
          <CardTitle>Aktivitas Hari Ini</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Request"
              value={dailyOps?.requests ?? 0}
              icon={ClipboardList}
              isLoading={dailyOpsLoading}
            />
            <StatCard
              title="Peminjaman"
              value={dailyOps?.loanRequests ?? 0}
              icon={RefreshCw}
              isLoading={dailyOpsLoading}
            />
            <StatCard
              title="Serah Terima"
              value={dailyOps?.handovers ?? 0}
              icon={Repeat}
              isLoading={dailyOpsLoading}
            />
            <StatCard
              title="Pengembalian"
              value={dailyOps?.returns ?? 0}
              icon={Activity}
              isLoading={dailyOpsLoading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <RecentActivityTable activities={activities ?? []} isLoading={activitiesLoading} />
    </div>
  );
}
