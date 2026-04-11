import { useQuery } from '@tanstack/react-query';
import { Package, ArrowLeftRight, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import { dashboardApi } from '../api';
import { StatCard } from '../components';

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr));
}

export function PersonalDashboard() {
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard', 'personal', 'stats'],
    queryFn: () => dashboardApi.getPersonalStats(),
    select: (res) => res.data.data,
  });

  const { data: myAssets, isLoading: assetsLoading } = useQuery({
    queryKey: ['dashboard', 'personal', 'assets'],
    queryFn: () => dashboardApi.getMyAssets(),
    select: (res) => res.data.data,
  });

  const { data: pendingReturns, isLoading: returnsLoading } = useQuery({
    queryKey: ['dashboard', 'personal', 'pending-returns'],
    queryFn: () => dashboardApi.getPendingReturns(),
    select: (res) => res.data.data,
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Aset Saya"
          value={statsData?.myAssets ?? 0}
          icon={Package}
          isLoading={statsLoading}
        />
        <StatCard
          title="Pinjaman Aktif"
          value={statsData?.activeLoans ?? 0}
          icon={ArrowLeftRight}
          isLoading={statsLoading}
        />
        <StatCard
          title="Pending Return"
          value={statsData?.pendingReturns ?? 0}
          icon={RotateCcw}
          variant={statsData?.pendingReturns ? 'warning' : 'default'}
          isLoading={statsLoading}
        />
      </div>

      {/* My Assets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="size-4" />
            Aset yang Saya Pegang
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6">
          {assetsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-28" />
                </div>
              ))}
            </div>
          ) : !myAssets || myAssets.length === 0 ? (
            <EmptyState
              title="Belum ada aset"
              description="Anda belum memiliki aset yang ditugaskan"
              className="py-8"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Aset</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Kondisi</TableHead>
                  <TableHead>Sejak Tanggal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myAssets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium">{asset.name}</TableCell>
                    <TableCell className="text-muted-foreground">{asset.category}</TableCell>
                    <TableCell className="text-muted-foreground">{asset.condition}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(asset.assignedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pending Returns Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <RotateCcw className="size-4" />
            Aset yang Harus Dikembalikan
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6">
          {returnsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="size-4 rounded" />
                  <Skeleton className="h-4 w-64" />
                </div>
              ))}
            </div>
          ) : !pendingReturns || pendingReturns.length === 0 ? (
            <EmptyState
              title="Tidak ada pengembalian pending"
              description="Semua aset sudah dikembalikan tepat waktu"
              className="py-8"
            />
          ) : (
            <div className="space-y-3">
              {pendingReturns.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    'flex items-start gap-3 rounded-lg border p-3',
                    item.isOverdue && 'border-destructive/50 bg-destructive/5',
                  )}
                >
                  <div
                    className={cn(
                      'mt-0.5 size-4 rounded border-2 shrink-0',
                      item.isOverdue ? 'border-destructive' : 'border-muted-foreground/40',
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{item.assetName}</p>
                    <p className="text-xs text-muted-foreground">
                      Pinjam: {formatDate(item.loanDate)} &middot; Jatuh tempo:{' '}
                      {formatDate(item.dueDate)}
                    </p>
                    {item.isOverdue && (
                      <p className="text-xs text-destructive font-medium mt-1">
                        ⚠ Melewati batas waktu pengembalian
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
