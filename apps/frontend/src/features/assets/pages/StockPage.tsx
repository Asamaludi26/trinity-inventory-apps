import { useState } from 'react';
import { Search, Warehouse, AlertTriangle } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useStock } from '../hooks';
import { useDebounce } from '@/hooks/use-debounce';

function StockLevelBadge({ total, threshold }: { total: number; threshold: number }) {
  if (threshold <= 0) return <span className="text-muted-foreground text-xs">—</span>;
  const ratio = total / threshold;
  if (ratio <= 0.5) {
    return (
      <Badge
        variant="outline"
        className="bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400"
      >
        <AlertTriangle className="mr-1 h-3 w-3" />
        Kritis
      </Badge>
    );
  }
  if (ratio <= 1) {
    return (
      <Badge
        variant="outline"
        className="bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400"
      >
        Rendah
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400"
    >
      Aman
    </Badge>
  );
}

export function StockPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const view = (searchParams.get('view') ?? 'main') as 'main' | 'division' | 'personal';
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useStock({
    view,
    page,
    limit: 20,
    search: debouncedSearch || undefined,
  });

  const handleTabChange = (val: string) => {
    setSearchParams({ view: val });
    setPage(1);
  };

  return (
    <PageContainer
      title="Stok Aset"
      description="Monitoring stok gudang utama, divisi, dan pribadi"
    >
      <Tabs value={view} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="main">Gudang Utama</TabsTrigger>
          <TabsTrigger value="division">Gudang Divisi</TabsTrigger>
          <TabsTrigger value="personal">Stok Pribadi</TabsTrigger>
        </TabsList>

        <TabsContent value={view} className="flex flex-col gap-4 mt-4">
          {/* Search */}
          <div className="flex items-center gap-2">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari model, brand, kategori..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
          </div>

          {/* Table */}
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead className="text-center">Total</TableHead>
                  <TableHead className="text-center">Di Gudang</TableHead>
                  <TableHead className="text-center">Digunakan</TableHead>
                  <TableHead className="text-center">Perbaikan</TableHead>
                  <TableHead className="text-center">Threshold</TableHead>
                  <TableHead className="text-center">Level</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 10 }).map((__, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : !data?.data.length ? (
                  <TableRow>
                    <TableCell colSpan={10}>
                      <EmptyState
                        icon={<Warehouse className="h-12 w-12" />}
                        title="Belum ada data stok"
                        description="Data stok akan muncul setelah aset dicatat di sistem."
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  data.data.map((item) => (
                    <TableRow
                      key={item.modelId}
                      className={cn(
                        item.threshold > 0 &&
                          item.totalQuantity <= item.threshold * 0.5 &&
                          'bg-red-50/50 dark:bg-red-950/20',
                      )}
                    >
                      <TableCell className="font-medium">{item.modelName}</TableCell>
                      <TableCell>{item.brand}</TableCell>
                      <TableCell className="text-muted-foreground">{item.categoryName}</TableCell>
                      <TableCell className="text-muted-foreground">{item.typeName}</TableCell>
                      <TableCell className="text-center font-semibold">
                        {item.totalQuantity}
                      </TableCell>
                      <TableCell className="text-center">{item.inStorage}</TableCell>
                      <TableCell className="text-center">{item.inUse}</TableCell>
                      <TableCell className="text-center">{item.underRepair}</TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {item.threshold || '—'}
                      </TableCell>
                      <TableCell className="text-center">
                        <StockLevelBadge total={item.totalQuantity} threshold={item.threshold} />
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
                Menampilkan {data.data.length} dari {data.meta.total} model
              </p>
              <div className="flex items-center gap-2">
                <button
                  className="text-sm px-3 py-1 border rounded disabled:opacity-50"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Sebelumnya
                </button>
                <span className="text-sm">
                  {page} / {data.meta.totalPages}
                </span>
                <button
                  className="text-sm px-3 py-1 border rounded disabled:opacity-50"
                  disabled={page >= data.meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}

export default StockPage;
export const Component = StockPage;
