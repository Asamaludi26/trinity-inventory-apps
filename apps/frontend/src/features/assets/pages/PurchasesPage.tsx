import { useState } from 'react';
import { Search, ShoppingCart } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { usePurchases } from '../hooks';
import { useDebounce } from '@/hooks/use-debounce';

function formatCurrency(value: string | null) {
  if (!value) return '-';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function formatDate(date: string | null) {
  if (!date) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

export function PurchasesPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = usePurchases({
    page,
    limit: 20,
    supplier: debouncedSearch || undefined,
  });

  return (
    <PageContainer title="Data Pembelian" description="Kelola data pembelian per model aset">
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari supplier..."
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
              <TableHead>Supplier</TableHead>
              <TableHead className="text-right">Harga Satuan</TableHead>
              <TableHead className="text-center">Qty</TableHead>
              <TableHead className="text-right">Total Harga</TableHead>
              <TableHead>Tgl Pembelian</TableHead>
              <TableHead>No. Invoice</TableHead>
              <TableHead>Garansi</TableHead>
              <TableHead>Dicatat Oleh</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 9 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : !data?.data.length ? (
              <TableRow>
                <TableCell colSpan={9}>
                  <EmptyState
                    icon={<ShoppingCart className="h-12 w-12" />}
                    title="Belum ada data pembelian"
                    description="Data pembelian akan muncul setelah menambahkan data pembelian aset."
                  />
                </TableCell>
              </TableRow>
            ) : (
              data.data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.model?.name ?? '-'}</TableCell>
                  <TableCell>{item.supplier}</TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {formatCurrency(item.unitPrice)}
                  </TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell className="text-right font-mono text-xs font-semibold">
                    {formatCurrency(item.totalPrice)}
                  </TableCell>
                  <TableCell>{formatDate(item.purchaseDate)}</TableCell>
                  <TableCell className="font-mono text-xs">{item.invoiceNumber || '-'}</TableCell>
                  <TableCell>
                    {item.warrantyMonths ? `${item.warrantyMonths} bulan` : '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.createdBy?.fullName ?? '-'}
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
            Menampilkan {data.data.length} dari {data.meta.total} data
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

export default PurchasesPage;
export const Component = PurchasesPage;
