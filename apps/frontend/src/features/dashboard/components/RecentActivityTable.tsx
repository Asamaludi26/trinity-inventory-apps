import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ClipboardList } from 'lucide-react';
import type { RecentActivity } from '../types';

interface RecentActivityTableProps {
  activities: RecentActivity[];
  isLoading?: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  request: 'Request',
  loan: 'Pinjaman',
  handover: 'Handover',
  repair: 'Perbaikan',
  return: 'Pengembalian',
};

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Baru saja';
  if (diffMin < 60) return `${diffMin}m lalu`;
  if (diffHour < 24) return `${diffHour}j lalu`;
  return `${diffDay}h lalu`;
}

export function RecentActivityTable({ activities, isLoading }: RecentActivityTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardList className="size-4" />
          Aktivitas Terbaru
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <EmptyState
            title="Belum ada aktivitas"
            description="Aktivitas terbaru akan muncul di sini"
            className="py-8"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Waktu</TableHead>
                <TableHead>Aksi</TableHead>
                <TableHead>Pengguna</TableHead>
                <TableHead className="w-[120px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatRelativeTime(activity.createdAt)}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-medium text-muted-foreground mr-1">
                      [{TYPE_LABELS[activity.type] ?? activity.type}]
                    </span>
                    {activity.documentNo}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">{activity.userName}</span>
                      <span className="text-xs text-muted-foreground">({activity.userRole})</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={activity.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
