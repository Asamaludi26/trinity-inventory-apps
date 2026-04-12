import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, HardHat } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { useProjects } from '../hooks';
import { useDebounce } from '@/hooks/use-debounce';
import type { TransactionStatus } from '@/types';

function formatDate(date: string | null) {
  if (!date) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

export function ProjectListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useProjects({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    status: statusFilter !== 'all' ? (statusFilter as TransactionStatus) : undefined,
  });

  return (
    <PageContainer
      title="Proyek Infrastruktur"
      description="Kelola proyek infrastruktur dan material"
      actions={
        <Button onClick={() => navigate('/projects/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Buat Proyek
        </Button>
      }
    >
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative max-w-sm flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari nama proyek, kode, lokasi..."
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
            <SelectItem value="PENDING">Draft</SelectItem>
            <SelectItem value="IN_PROGRESS">Berlangsung</SelectItem>
            <SelectItem value="COMPLETED">Selesai</SelectItem>
            <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kode</TableHead>
              <TableHead>Nama Proyek</TableHead>
              <TableHead>Lokasi</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Mulai</TableHead>
              <TableHead>Selesai</TableHead>
              <TableHead>PIC</TableHead>
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
                    icon={<HardHat className="h-12 w-12" />}
                    title="Belum ada proyek"
                    description="Buat proyek infrastruktur pertama Anda."
                  />
                </TableCell>
              </TableRow>
            ) : (
              data.data.map((proj) => (
                <TableRow
                  key={proj.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/projects/${proj.id}`)}
                >
                  <TableCell className="font-mono text-xs">{proj.code}</TableCell>
                  <TableCell className="font-medium">{proj.name}</TableCell>
                  <TableCell className="text-muted-foreground">{proj.location || '-'}</TableCell>
                  <TableCell>
                    <StatusBadge status={proj.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(proj.startDate)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(proj.endDate)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {proj.createdBy?.fullName ?? '-'}
                  </TableCell>
                </TableRow>
              ))
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

export default ProjectListPage;
export const Component = ProjectListPage;
