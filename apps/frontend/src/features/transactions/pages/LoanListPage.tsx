import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, ArrowRightLeft, AlertTriangle } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
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
import { useLoans } from '../hooks';
import { useDebounce } from '@/hooks/use-debounce';
import { ExportButton } from '@/components/form';
import { useExportLoans } from '@/hooks/use-export-import';
import type { TransactionStatus } from '@/types';
import type { LoanRequest } from '../types';

function isOverdue(loan: LoanRequest): boolean {
  if (loan.status !== 'IN_PROGRESS' || !loan.expectedReturn) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(loan.expectedReturn) < today;
}

function formatDate(date: string | null) {
  if (!date) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

export function LoanListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);
  const exportLoans = useExportLoans();

  const { data, isLoading } = useLoans({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    status: statusFilter !== 'all' ? (statusFilter as TransactionStatus) : undefined,
  });

  return (
    <PageContainer
      title="Daftar Peminjaman"
      description="Kelola peminjaman aset"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton
            onExport={(format) =>
              exportLoans.mutate({
                format,
                search: debouncedSearch || undefined,
                status: statusFilter !== 'all' ? statusFilter : undefined,
              })
            }
            isLoading={exportLoans.isPending}
          />
          <Button onClick={() => navigate('/loans/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Ajukan Peminjaman
          </Button>
        </div>
      }
    >
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative max-w-sm flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari kode, tujuan..."
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
            <SelectItem value="IN_PROGRESS">Berlangsung</SelectItem>
            <SelectItem value="COMPLETED">Selesai</SelectItem>
            <SelectItem value="REJECTED">Ditolak</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kode</TableHead>
              <TableHead>Tujuan Peminjaman</TableHead>
              <TableHead>Peminjam</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Jumlah Item</TableHead>
              <TableHead>Tgl Kembali</TableHead>
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
                    icon={<ArrowRightLeft className="h-12 w-12" />}
                    title="Belum ada peminjaman"
                    description="Ajukan peminjaman aset untuk mulai."
                  />
                </TableCell>
              </TableRow>
            ) : (
              data.data.map((loan: LoanRequest) => {
                const overdue = isOverdue(loan);
                return (
                  <TableRow
                    key={loan.id}
                    className={`cursor-pointer hover:bg-muted/50 ${overdue ? 'bg-destructive/5' : ''}`}
                    onClick={() => navigate(`/loans/${loan.id}`)}
                  >
                    <TableCell className="font-mono text-xs">{loan.code}</TableCell>
                    <TableCell className="font-medium max-w-[300px] truncate">
                      {loan.purpose}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {loan.createdBy?.fullName ?? '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <StatusBadge status={loan.status} />
                        {overdue && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="destructive" className="gap-1 text-xs">
                                <AlertTriangle className="h-3 w-3" />
                                Overdue
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              Peminjaman telah melewati batas waktu pengembalian
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{loan.items?.length ?? 0}</TableCell>
                    <TableCell
                      className={overdue ? 'text-destructive font-medium' : 'text-muted-foreground'}
                    >
                      {formatDate(loan.expectedReturn)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(loan.createdAt)}
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
    </PageContainer>
  );
}

export default LoanListPage;
export const Component = LoanListPage;
