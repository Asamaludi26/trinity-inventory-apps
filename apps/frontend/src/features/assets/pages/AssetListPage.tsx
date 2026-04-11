import { useState } from 'react';
import { Plus, Search, Package, RotateCcw } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { useAssets, useCategories } from '../hooks';
import { useAssetFilterStore } from '../store';
import { useDebounce } from '@/hooks/use-debounce';
import type { AssetStatus, AssetCondition } from '@/types';

const STATUS_OPTIONS: { value: AssetStatus; label: string }[] = [
  { value: 'IN_STORAGE', label: 'Di Gudang' },
  { value: 'IN_USE', label: 'Digunakan' },
  { value: 'IN_CUSTODY', label: 'Dipinjam' },
  { value: 'UNDER_REPAIR', label: 'Perbaikan' },
  { value: 'DAMAGED', label: 'Rusak' },
  { value: 'LOST', label: 'Hilang' },
  { value: 'DECOMMISSIONED', label: 'Didekomisikan' },
];

const CONDITION_OPTIONS: { value: AssetCondition; label: string }[] = [
  { value: 'NEW', label: 'Baru' },
  { value: 'GOOD', label: 'Baik' },
  { value: 'FAIR', label: 'Cukup' },
  { value: 'POOR', label: 'Buruk' },
  { value: 'BROKEN', label: 'Rusak' },
];

const CONDITION_COLORS: Record<AssetCondition, string> = {
  NEW: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  GOOD: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  FAIR: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  POOR: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  BROKEN: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

export function AssetListPage() {
  const [page, setPage] = useState(1);
  const {
    categoryId,
    status,
    condition,
    search,
    setCategoryId,
    setStatus,
    setCondition,
    setSearch,
    resetFilters,
  } = useAssetFilterStore();

  const debouncedSearch = useDebounce(search, 300);
  const { data: categories } = useCategories();

  const { data, isLoading } = useAssets({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    categoryId,
    status,
    condition,
  });

  const hasFilters = !!categoryId || !!status || !!condition || !!search;

  return (
    <PageContainer
      title="Daftar Aset"
      description="Kelola semua aset inventaris"
      actions={
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Catat Aset Baru
        </Button>
      }
    >
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative max-w-sm flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari kode, nama, serial number..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={categoryId ? String(categoryId) : 'all'}
          onValueChange={(val) => {
            setCategoryId(val !== 'all' ? Number(val) : undefined);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kategori</SelectItem>
            {categories?.map((cat) => (
              <SelectItem key={cat.id} value={String(cat.id)}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={status ?? 'all'}
          onValueChange={(val) => {
            setStatus(val !== 'all' ? (val as AssetStatus) : undefined);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={condition ?? 'all'}
          onValueChange={(val) => {
            setCondition(val !== 'all' ? (val as AssetCondition) : undefined);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Kondisi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kondisi</SelectItem>
            {CONDITION_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              resetFilters();
              setPage(1);
            }}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kode</TableHead>
              <TableHead>Nama Aset</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>S/N</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Kondisi</TableHead>
              <TableHead>Pemegang</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : !data?.data.length ? (
              <TableRow>
                <TableCell colSpan={8}>
                  <EmptyState
                    icon={<Package className="h-12 w-12" />}
                    title="Belum ada data aset"
                    description={
                      hasFilters
                        ? 'Tidak ada aset yang sesuai filter.'
                        : 'Mulai catat aset pertama Anda.'
                    }
                    action={
                      hasFilters ? (
                        <Button
                          variant="outline"
                          onClick={() => {
                            resetFilters();
                            setPage(1);
                          }}
                        >
                          Reset Filter
                        </Button>
                      ) : (
                        <Button>
                          <Plus className="mr-2 h-4 w-4" />
                          Catat Aset
                        </Button>
                      )
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              data.data.map((asset) => (
                <TableRow key={asset.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-mono text-xs">{asset.code}</TableCell>
                  <TableCell className="font-medium">{asset.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {asset.category?.name ?? '-'}
                  </TableCell>
                  <TableCell>{asset.brand || '-'}</TableCell>
                  <TableCell className="font-mono text-xs">{asset.serialNumber || '-'}</TableCell>
                  <TableCell>
                    <StatusBadge status={asset.status} />
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={CONDITION_COLORS[asset.condition]}>
                      {CONDITION_OPTIONS.find((o) => o.value === asset.condition)?.label ??
                        asset.condition}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {asset.currentUser?.fullName ?? '-'}
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
            Menampilkan {data.data.length} dari {data.meta.total} aset
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

export default AssetListPage;
export const Component = AssetListPage;
