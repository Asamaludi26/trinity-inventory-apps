import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, ClipboardList } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
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
import { useRequests } from '../hooks';
import { useDebounce } from '@/hooks/use-debounce';
import { ExportButton } from '@/components/form';
import { useExportRequests } from '@/hooks/use-export-import';
import type { TransactionStatus } from '@/types';

const PRIORITY_LABELS: Record<string, string> = {
  REGULAR: 'Regular',
  URGENT: 'Urgent',
  PROJECT: 'Project',
};

const PRIORITY_COLORS: Record<string, string> = {
  REGULAR: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  URGENT: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  PROJECT: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

export function RequestListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);
  const exportRequests = useExportRequests();

  const { data, isLoading } = useRequests({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    status: statusFilter !== 'all' ? (statusFilter as TransactionStatus) : undefined,
  });

  return (
    <PageContainer
      title="Daftar Permintaan"
      description="Kelola permintaan pengadaan aset"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton
            onExport={(format) =>
              exportRequests.mutate({
                format,
                search: debouncedSearch || undefined,
                status: statusFilter !== 'all' ? statusFilter : undefined,
              })
            }
            isLoading={exportRequests.isPending}
          />
          <Button onClick={() => navigate('/requests/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Buat Permintaan
          </Button>
        </div>
      }
    >
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative max-w-sm flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari kode, judul..."
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
            <SelectItem value="APPROVED">Disetujui</SelectItem>
            <SelectItem value="REJECTED">Ditolak</SelectItem>
            <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
            <SelectItem value="COMPLETED">Selesai</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kode</TableHead>
              <TableHead>Judul</TableHead>
              <TableHead>Prioritas</TableHead>
              <TableHead>Pemohon</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Jumlah Item</TableHead>
              <TableHead>Tanggal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : !data?.data.length ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <EmptyState
                    icon={<ClipboardList className="h-12 w-12" />}
                    title="Belum ada permintaan"
                    description="Buat permintaan pertama untuk mengajukan pengadaan aset."
                    action={
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Buat Permintaan
                      </Button>
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              data.data.map((req) => (
                <TableRow
                  key={req.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/requests/${req.uuid}`)}
                >
                  <TableCell className="font-mono text-xs">{req.code}</TableCell>
                  <TableCell className="font-medium">{req.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={PRIORITY_COLORS[req.priority] ?? ''}>
                      {PRIORITY_LABELS[req.priority] ?? req.priority}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {req.createdBy?.fullName ?? '-'}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={req.status} />
                  </TableCell>
                  <TableCell className="text-center">{req.items?.length ?? 0}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(req.createdAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data?.meta && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Menampilkan {data.data.length} dari {data.meta.total} permintaan
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

export default RequestListPage;
export const Component = RequestListPage;
