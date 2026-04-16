import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Package,
  RotateCcw,
  List,
  LayoutGrid,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { ExportButton, ImportDialog, QRScannerDialog } from '@/components/form';
import { useExportAssets } from '@/hooks/use-export-import';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAssets, useAssetsGrouped, useCategories } from '../hooks';
import { useAssetFilterStore } from '../store';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';
import type { AssetStatus, AssetCondition } from '@/types';
import type { Asset, AssetGroup } from '../types';

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

function formatDate(date: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

function AssetRow({ asset, onClick }: { asset: Asset; onClick: () => void }) {
  return (
    <TableRow className="cursor-pointer hover:bg-muted/50" onClick={onClick}>
      <TableCell className="font-mono text-xs">{asset.code}</TableCell>
      <TableCell className="font-medium">{asset.name}</TableCell>
      <TableCell className="text-muted-foreground">{asset.category?.name ?? '-'}</TableCell>
      <TableCell>{asset.brand || '-'}</TableCell>
      <TableCell className="font-mono text-xs">{asset.serialNumber || '-'}</TableCell>
      <TableCell>
        <StatusBadge status={asset.status} />
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={CONDITION_COLORS[asset.condition]}>
          {CONDITION_OPTIONS.find((o) => o.value === asset.condition)?.label ?? asset.condition}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground">{asset.currentUser?.fullName ?? '-'}</TableCell>
    </TableRow>
  );
}

function AssetMobileCard({ asset, onClick }: { asset: Asset; onClick: () => void }) {
  return (
    <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{asset.name}</p>
            <p className="text-xs font-mono text-muted-foreground">{asset.code}</p>
          </div>
          <StatusBadge status={asset.status} />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>Kategori: {asset.category?.name ?? '-'}</span>
          <span>Brand: {asset.brand || '-'}</span>
          <span className="font-mono">S/N: {asset.serialNumber || '-'}</span>
          <span>
            Kondisi:{' '}
            <Badge variant="outline" className={CONDITION_COLORS[asset.condition]}>
              {CONDITION_OPTIONS.find((o) => o.value === asset.condition)?.label ?? asset.condition}
            </Badge>
          </span>
          <span className="col-span-2">Pemegang: {asset.currentUser?.fullName ?? '-'}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function AssetGroupCard({
  group,
  navigate,
}: {
  group: AssetGroup;
  navigate: (path: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const isUnrecorded = !group.recording.id;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className={cn(isUnrecorded && 'border-dashed')}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                <div>
                  <CardTitle
                    className={cn('text-sm font-semibold', isUnrecorded && 'text-muted-foreground')}
                  >
                    {group.recording.docNumber}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(group.recording.recordedAt)}
                    {group.recording.recordedBy && ` • ${group.recording.recordedBy.fullName}`}
                  </p>
                </div>
              </div>
              <Badge variant="secondary">{group.assetCount} aset</Badge>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>S/N</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Kondisi</TableHead>
                    <TableHead>Pemegang</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.assets.map((asset) => (
                    <TableRow
                      key={asset.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/assets/${asset.id}`)}
                    >
                      <TableCell className="font-mono text-xs">{asset.code}</TableCell>
                      <TableCell className="font-medium">{asset.name}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {asset.serialNumber || '-'}
                      </TableCell>
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
                  ))}
                </TableBody>
              </Table>
            </div>
            {group.recording.note && (
              <p className="mt-2 text-xs text-muted-foreground">Catatan: {group.recording.note}</p>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export function AssetListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const {
    categoryId,
    status,
    condition,
    search,
    viewMode,
    setCategoryId,
    setStatus,
    setCondition,
    setSearch,
    setViewMode,
    resetFilters,
  } = useAssetFilterStore();

  const debouncedSearch = useDebounce(search, 300);
  const { data: categories } = useCategories();
  const exportAssets = useExportAssets();
  const isMobile = useIsMobile();

  const filterParams = {
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    categoryId,
    status,
    condition,
    view: viewMode,
  };

  const { data: listData, isLoading: isLoadingList } = useAssets(filterParams);
  const { data: groupData, isLoading: isLoadingGroup } = useAssetsGrouped(filterParams);

  const isGroupView = viewMode === 'group';
  const isLoading = isGroupView ? isLoadingGroup : isLoadingList;
  const meta = isGroupView ? groupData?.meta : listData?.meta;
  const hasData = isGroupView ? !!groupData?.data?.length : !!listData?.data?.length;
  const hasFilters = !!categoryId || !!status || !!condition || !!search;

  return (
    <PageContainer
      title="Daftar Aset"
      description="Kelola semua aset inventaris"
      actions={
        <div className="flex items-center gap-2">
          <QRScannerDialog />
          <ImportDialog />
          <ExportButton
            onExport={(format) =>
              exportAssets.mutate({
                format,
                search: debouncedSearch || undefined,
                status,
                condition,
                categoryId,
              })
            }
            isLoading={exportAssets.isPending}
          />
          <Button onClick={() => navigate('/assets/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Catat Aset Baru
          </Button>
        </div>
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
            {categories?.map((cat: { id: number; name: string }) => (
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

        {/* View toggle */}
        <div className="flex items-center border rounded-md">
          <Button
            variant={isGroupView ? 'default' : 'ghost'}
            size="sm"
            className={cn('rounded-r-none', !isGroupView && 'text-muted-foreground')}
            onClick={() => {
              setViewMode('group');
              setPage(1);
            }}
          >
            <LayoutGrid className="size-4" />
          </Button>
          <Button
            variant={!isGroupView ? 'default' : 'ghost'}
            size="sm"
            className={cn('rounded-l-none', isGroupView && 'text-muted-foreground')}
            onClick={() => {
              setViewMode('list');
              setPage(1);
            }}
          >
            <List className="size-4" />
          </Button>
        </div>

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

      {/* Content */}
      {isLoading ? (
        <LoadingSkeleton isMobile={isMobile} isGroupView={isGroupView} />
      ) : !hasData ? (
        <EmptyState
          icon={<Package className="h-12 w-12" />}
          title="Belum ada data aset"
          description={
            hasFilters ? 'Tidak ada aset yang sesuai filter.' : 'Mulai catat aset pertama Anda.'
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
              <Button onClick={() => navigate('/assets/new')}>
                <Plus className="mr-2 h-4 w-4" />
                Catat Aset
              </Button>
            )
          }
        />
      ) : isGroupView ? (
        <div className="flex flex-col gap-3">
          {groupData?.data?.map((group, idx) => (
            <AssetGroupCard key={group.recording.id ?? idx} group={group} navigate={navigate} />
          ))}
        </div>
      ) : isMobile ? (
        <div className="flex flex-col gap-3">
          {listData?.data?.map((asset) => (
            <AssetMobileCard
              key={asset.id}
              asset={asset}
              onClick={() => navigate(`/assets/${asset.id}`)}
            />
          ))}
        </div>
      ) : (
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
              {listData?.data?.map((asset) => (
                <AssetRow
                  key={asset.id}
                  asset={asset}
                  onClick={() => navigate(`/assets/${asset.id}`)}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Halaman {page} dari {meta.totalPages} ({meta.total} total)
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
              {page} / {meta.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.totalPages}
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

function LoadingSkeleton({ isMobile, isGroupView }: { isMobile: boolean; isGroupView: boolean }) {
  if (isGroupView || isMobile) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex flex-col gap-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            {Array.from({ length: 8 }).map((_, j) => (
              <TableHead key={j}>
                <Skeleton className="h-4 w-16" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 10 }).map((_, i) => (
            <TableRow key={i}>
              {Array.from({ length: 8 }).map((__, j) => (
                <TableCell key={j}>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default AssetListPage;
export const Component = AssetListPage;
