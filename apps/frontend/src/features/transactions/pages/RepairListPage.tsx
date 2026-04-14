import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Wrench, AlertTriangle } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
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
import { useRepairs } from '../hooks';
import { ReportLostDialog } from '../components';
import { useDebounce } from '@/hooks/use-debounce';
import { ExportButton } from '@/components/form';
import { useExportRepairs } from '@/hooks/use-export-import';
import { usePermissions } from '@/hooks';
import { P } from '@/config/permissions';
import type { TransactionStatus } from '@/types';
import type { Repair } from '../types';

function formatDate(date: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

export function RepairListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [reportLostOpen, setReportLostOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 300);
  const exportRepairs = useExportRepairs();
  const { can } = usePermissions();

  const { data, isLoading } = useRepairs({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    status: statusFilter !== 'all' ? (statusFilter as TransactionStatus) : undefined,
  });

  return (
    <PageContainer
      title="Perbaikan Aset"
      description="Kelola laporan kerusakan dan perbaikan aset"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton
            onExport={(format) =>
              exportRepairs.mutate({
                format,
                search: debouncedSearch || undefined,
                status: statusFilter !== 'all' ? statusFilter : undefined,
              })
            }
            isLoading={exportRepairs.isPending}
          />
          <Button onClick={() => navigate('/repairs/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Lapor Kerusakan
          </Button>
          {can(P.ASSETS_REPAIR_REPORT) && (
            <Button variant="destructive" onClick={() => setReportLostOpen(true)}>
              <AlertTriangle className="mr-2 h-4 w-4" />
              Lapor Hilang
            </Button>
          )}
        </div>
      }
    >
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative max-w-sm flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari laporan perbaikan..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(val) => {
            setStatusFilter(val);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="PENDING">Menunggu</SelectItem>
            <SelectItem value="IN_PROGRESS">Sedang Diperbaiki</SelectItem>
            <SelectItem value="COMPLETED">Selesai</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kode</TableHead>
              <TableHead>Deskripsi</TableHead>
              <TableHead>Pelapor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tanggal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : !data?.data.length ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <EmptyState
                    icon={<Wrench className="h-12 w-12" />}
                    title="Belum ada laporan perbaikan"
                    description="Laporkan kerusakan aset jika ditemukan."
                  />
                </TableCell>
              </TableRow>
            ) : (
              data.data.map((item: Repair) => {
                const isLost = item.category === 'LOST';
                return (
                  <TableRow
                    key={item.id}
                    className={`cursor-pointer hover:bg-muted/50 ${isLost ? 'bg-destructive/5' : ''}`}
                    onClick={() => navigate(`/repairs/${item.id}`)}
                  >
                    <TableCell className="font-mono text-xs">{item.code ?? '-'}</TableCell>
                    <TableCell className="font-medium max-w-[300px] truncate">
                      <div className="flex items-center gap-1.5">
                        {item.issueDescription ?? '-'}
                        {isLost && (
                          <Badge variant="destructive" className="text-xs">
                            HILANG
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.createdBy?.fullName ?? '-'}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={item.status ?? 'PENDING'} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(item.createdAt)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {data?.meta && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
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

      <ReportLostDialog open={reportLostOpen} onOpenChange={setReportLostOpen} />
    </PageContainer>
  );
}

export default RepairListPage;
export const Component = RepairListPage;
