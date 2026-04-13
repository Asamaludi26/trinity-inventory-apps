import { useState } from 'react';
import { Search, History } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';
import { useAuditLogs } from '../hooks';
import { useUsers } from '../hooks';
import { useDebounce } from '@/hooks/use-debounce';

const ACTION_LABELS: Record<string, string> = {
  CREATE: 'Buat',
  UPDATE: 'Ubah',
  DELETE: 'Hapus',
};

const ACTION_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  CREATE: 'default',
  UPDATE: 'secondary',
  DELETE: 'destructive',
};

const ENTITY_TYPES = [
  'Asset',
  'Request',
  'LoanRequest',
  'Handover',
  'Repair',
  'User',
  'Division',
  'Customer',
  'AssetModel',
  'AssetCategory',
  'InfraProject',
  'Purchase',
];

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function AuditLogPage() {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [entityTypeFilter, setEntityTypeFilter] = useState('all');
  const [userIdFilter, setUserIdFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);

  const { data: usersData } = useUsers({ limit: 200 });

  const { data, isLoading } = useAuditLogs({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    action: actionFilter !== 'all' ? actionFilter : undefined,
    entityType: entityTypeFilter !== 'all' ? entityTypeFilter : undefined,
    userId: userIdFilter !== 'all' ? Number(userIdFilter) : undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  function resetFilters() {
    setSearch('');
    setActionFilter('all');
    setEntityTypeFilter('all');
    setUserIdFilter('all');
    setStartDate('');
    setEndDate('');
    setPage(1);
  }

  return (
    <PageContainer title="Audit Trail" description="Riwayat aktivitas sistem">
      <div className="mb-4 space-y-3">
        {/* Row 1: search + action + entity type */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari berdasarkan aksi, entitas, atau ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10"
            />
          </div>
          <Select
            value={actionFilter}
            onValueChange={(val) => {
              setActionFilter(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Semua Aksi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Aksi</SelectItem>
              <SelectItem value="CREATE">Buat</SelectItem>
              <SelectItem value="UPDATE">Ubah</SelectItem>
              <SelectItem value="DELETE">Hapus</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={entityTypeFilter}
            onValueChange={(val) => {
              setEntityTypeFilter(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Semua Entitas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Entitas</SelectItem>
              {ENTITY_TYPES.map((et) => (
                <SelectItem key={et} value={et}>
                  {et}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={userIdFilter}
            onValueChange={(val) => {
              setUserIdFilter(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Semua Pengguna" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Pengguna</SelectItem>
              {usersData?.data.map((u) => (
                <SelectItem key={u.id} value={String(u.id)}>
                  {u.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Row 2: date range filters */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Dari Tanggal</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="w-[160px]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Sampai Tanggal</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="w-[160px]"
            />
          </div>
          {(search ||
            actionFilter !== 'all' ||
            entityTypeFilter !== 'all' ||
            userIdFilter !== 'all' ||
            startDate ||
            endDate) && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="self-end">
              Reset Filter
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">Waktu</TableHead>
              <TableHead>Pengguna</TableHead>
              <TableHead className="w-[100px]">Aksi</TableHead>
              <TableHead>Entitas</TableHead>
              <TableHead>ID Entitas</TableHead>
              <TableHead className="w-[140px]">IP Address</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : !data?.data.length ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <EmptyState
                    icon={<History className="h-12 w-12" />}
                    title="Belum ada aktivitas"
                    description="Riwayat aktivitas akan muncul di sini."
                  />
                </TableCell>
              </TableRow>
            ) : (
              data.data.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDateTime(log.createdAt)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {log.user?.fullName ?? `User #${log.userId}`}
                  </TableCell>
                  <TableCell>
                    <Badge variant={ACTION_VARIANTS[log.action] ?? 'outline'}>
                      {ACTION_LABELS[log.action] ?? log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{log.entityType}</TableCell>
                  <TableCell className="font-mono text-xs">{log.entityId}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {log.ipAddress ?? '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data?.meta && data.meta.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Menampilkan {data.data.length} dari {data.meta.total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Sebelumnya
            </Button>
            <span className="text-sm">
              {page} / {data.meta.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Selanjutnya
            </Button>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

export default AuditLogPage;
export const Component = AuditLogPage;
