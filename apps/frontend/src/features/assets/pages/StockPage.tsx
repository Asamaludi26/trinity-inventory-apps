import { useState, useMemo } from 'react';
import {
  Search,
  Warehouse,
  AlertTriangle,
  MoreHorizontal,
  PackagePlus,
  History,
  AlertCircle,
  CircleOff,
  SlidersHorizontal,
  Eye,
  Clock,
  User,
  MapPin,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Package,
  TrendingUp,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { PageContainer } from '@/components/layout/PageContainer';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ExportButton } from '@/components/form';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  useStock,
  useStockDetailTotal,
  useStockDetailUsage,
  useStockHistory,
  useUpdateStockThreshold,
  useUpdateThresholdBulk,
  useRestock,
  useReportDamage,
  useReportLost,
} from '../hooks';
import { useDebounce } from '@/hooks/use-debounce';
import { useExportStock } from '@/hooks/use-export-import';
import { usePermissions } from '@/hooks/use-permissions';
import { P } from '@/config/permissions';
import type { StockSummary, StockDetailUsageItem, StockHistoryItem } from '../types';

// ─── Format Helpers ────────────────────────────────────────────
function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value);
}

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

// ─── Stock Level Badge ─────────────────────────────────────────
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

// ─── Status color mapping ──────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  IN_STORAGE: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300',
  IN_USE: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300',
  IN_CUSTODY:
    'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300',
  UNDER_REPAIR:
    'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300',
  DAMAGED: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300',
  LOST: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300',
  DECOMMISSIONED:
    'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-300',
};

const STATUS_LABELS: Record<string, string> = {
  IN_STORAGE: 'Di Gudang',
  IN_USE: 'Digunakan',
  IN_CUSTODY: 'Dipinjam',
  UNDER_REPAIR: 'Perbaikan',
  DAMAGED: 'Rusak',
  LOST: 'Hilang',
  DECOMMISSIONED: 'Didekomisikan',
};

const CONDITION_LABELS: Record<string, string> = {
  NEW: 'Baru',
  GOOD: 'Baik',
  FAIR: 'Cukup',
  POOR: 'Buruk',
  BROKEN: 'Rusak',
};

const CONDITION_COLORS: Record<string, string> = {
  NEW: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  GOOD: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  FAIR: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  POOR: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  BROKEN: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

const MOVEMENT_COLORS: Record<string, string> = {
  NEW_STOCK: 'bg-green-500',
  CONSUMED: 'bg-orange-500',
  INSTALLATION: 'bg-blue-500',
  DISMANTLE: 'bg-slate-500',
  RETURN: 'bg-purple-500',
  RESTOCK: 'bg-emerald-500',
  ADJUSTMENT: 'bg-yellow-500',
  TRANSFER: 'bg-cyan-500',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

// ─── Total Detail Modal ────────────────────────────────────────
function TotalDetailModal({
  modelId,
  modelName,
  open,
  onClose,
}: {
  modelId: number | null;
  modelName: string;
  open: boolean;
  onClose: () => void;
}) {
  const { data, isLoading } = useStockDetailTotal(open ? modelId : null);

  const totalCount = useMemo(() => {
    if (!data?.byStatus) return 0;
    return data.byStatus.reduce((acc: number, s: { count: number }) => acc + s.count, 0);
  }, [data]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <Package className="size-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-base">Detail Total Stok</DialogTitle>
              <DialogDescription className="text-xs">{modelName}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        {isLoading ? (
          <div className="flex flex-col gap-3 py-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : data ? (
          <ScrollArea className="max-h-[60vh]">
            <div className="flex flex-col gap-5 pr-3">
              {/* Summary count */}
              <div className="rounded-lg border bg-muted/30 p-4 text-center">
                <p className="text-3xl font-bold">{totalCount}</p>
                <p className="text-xs text-muted-foreground">Total unit aset</p>
              </div>

              {/* By Status */}
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <ShieldCheck className="size-4 text-muted-foreground" />
                  <p className="text-sm font-semibold">Berdasarkan Status</p>
                </div>
                {data.byStatus?.length ? (
                  <div className="grid gap-2">
                    {data.byStatus.map((s: { status: string; count: number }) => (
                      <div
                        key={s.status}
                        className="flex items-center justify-between rounded-lg border px-3 py-2.5"
                      >
                        <Badge
                          variant="outline"
                          className={STATUS_COLORS[s.status] ?? 'bg-muted text-muted-foreground'}
                        >
                          {STATUS_LABELS[s.status] ?? s.status}
                        </Badge>
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={{
                                width: `${totalCount > 0 ? (s.count / totalCount) * 100 : 0}%`,
                              }}
                            />
                          </div>
                          <span className="min-w-[2rem] text-right text-sm font-semibold">
                            {s.count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">
                    Tidak ada data status
                  </p>
                )}
              </div>

              {/* By Condition */}
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <TrendingUp className="size-4 text-muted-foreground" />
                  <p className="text-sm font-semibold">Berdasarkan Kondisi</p>
                </div>
                {data.byCondition?.length ? (
                  <div className="grid gap-2">
                    {data.byCondition.map((c: { condition: string; count: number }) => (
                      <div
                        key={c.condition}
                        className="flex items-center justify-between rounded-lg border px-3 py-2.5"
                      >
                        <Badge
                          variant="outline"
                          className={
                            CONDITION_COLORS[c.condition] ?? 'bg-muted text-muted-foreground'
                          }
                        >
                          {CONDITION_LABELS[c.condition] ?? c.condition}
                        </Badge>
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary/70 transition-all"
                              style={{
                                width: `${totalCount > 0 ? (c.count / totalCount) * 100 : 0}%`,
                              }}
                            />
                          </div>
                          <span className="min-w-[2rem] text-right text-sm font-semibold">
                            {c.count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">
                    Tidak ada data kondisi
                  </p>
                )}
              </div>

              {/* By Location */}
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <MapPin className="size-4 text-muted-foreground" />
                  <p className="text-sm font-semibold">Berdasarkan Lokasi</p>
                </div>
                {data.byLocation?.length ? (
                  <div className="grid gap-2">
                    {data.byLocation.map((l: { location: string; count: number }) => (
                      <div
                        key={l.location}
                        className="flex items-center justify-between rounded-lg border px-3 py-2.5"
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className="size-3.5 text-muted-foreground" />
                          <span className="text-sm">{l.location || 'Belum diset'}</span>
                        </div>
                        <span className="text-sm font-semibold">{l.count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">
                    Tidak ada data lokasi
                  </p>
                )}
              </div>
            </div>
          </ScrollArea>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

// ─── Usage Detail Modal ────────────────────────────────────────
function UsageDetailModal({
  modelId,
  modelName,
  open,
  onClose,
}: {
  modelId: number | null;
  modelName: string;
  open: boolean;
  onClose: () => void;
}) {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useStockDetailUsage(open ? modelId : null, page);
  const items =
    (data as unknown as { data?: StockDetailUsageItem[]; meta?: { totalPages: number } })?.data ??
    (data as StockDetailUsageItem[] | undefined) ??
    [];
  const meta = (data as unknown as { meta?: { totalPages: number } })?.meta;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-green-500/10">
              <User className="size-5 text-green-600" />
            </div>
            <div>
              <DialogTitle className="text-base">Aset Sedang Digunakan</DialogTitle>
              <DialogDescription className="text-xs">{modelName}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        {isLoading ? (
          <div className="flex flex-col gap-3 py-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : !items.length ? (
          <div className="flex flex-col items-center gap-2 py-8">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <Package className="size-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              Tidak ada aset yang sedang digunakan
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[50vh]">
            <div className="flex flex-col gap-2 pr-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <Avatar className="size-9">
                    <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                      {item.currentUser?.fullName ? getInitials(item.currentUser.fullName) : '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{item.code}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium">
                      {item.currentUser?.fullName ?? 'Tidak diketahui'}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Pemegang</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t pt-3">
            <span className="text-xs text-muted-foreground">
              Halaman {page} dari {meta.totalPages}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="size-7"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="size-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-7"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── History Modal ─────────────────────────────────────────────
function HistoryModal({
  modelId,
  modelName,
  open,
  onClose,
}: {
  modelId: number | null;
  modelName: string;
  open: boolean;
  onClose: () => void;
}) {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useStockHistory(open ? modelId : null, page);
  const items =
    (data as unknown as { data?: StockHistoryItem[]; meta?: { totalPages: number } })?.data ??
    (data as StockHistoryItem[] | undefined) ??
    [];
  const meta = (data as unknown as { meta?: { totalPages: number } })?.meta;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-violet-500/10">
              <History className="size-5 text-violet-600" />
            </div>
            <div>
              <DialogTitle className="text-base">Riwayat Pergerakan Stok</DialogTitle>
              <DialogDescription className="text-xs">{modelName}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        {isLoading ? (
          <div className="flex flex-col gap-3 py-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : !items.length ? (
          <div className="flex flex-col items-center gap-2 py-8">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <History className="size-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Belum ada riwayat</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[55vh]">
            <div className="relative pl-6 pr-3">
              {/* Timeline line */}
              <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />

              <div className="flex flex-col gap-4">
                {items.map((h) => (
                  <div key={h.id} className="relative flex gap-3">
                    {/* Timeline dot */}
                    <div
                      className={cn(
                        'absolute -left-6 top-1.5 size-3 rounded-full border-2 border-background',
                        MOVEMENT_COLORS[h.type] ?? 'bg-gray-400',
                      )}
                    />
                    <div className="flex-1 rounded-lg border p-3 transition-colors hover:bg-muted/30">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="text-[10px] font-semibold uppercase tracking-wider"
                          >
                            {h.type.replace(/_/g, ' ')}
                          </Badge>
                          <span className="text-sm font-semibold">
                            {h.quantity > 0 ? `+${h.quantity}` : h.quantity}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Clock className="size-3" />
                          {formatDateTime(h.createdAt)}
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                        {h.asset?.code && (
                          <span className="flex items-center gap-1 font-mono">
                            <Package className="size-3" />
                            {h.asset.code}
                          </span>
                        )}
                      </div>
                      {h.note && (
                        <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                          {h.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
        )}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t pt-3">
            <span className="text-xs text-muted-foreground">
              Halaman {page} dari {meta.totalPages}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="size-7"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="size-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-7"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Restock Modal ─────────────────────────────────────────────
function RestockModal({
  modelId,
  modelName,
  open,
  onClose,
}: {
  modelId: number | null;
  modelName: string;
  open: boolean;
  onClose: () => void;
}) {
  const [quantity, setQuantity] = useState('');
  const [source, setSource] = useState('PURCHASE');
  const [note, setNote] = useState('');
  const restock = useRestock();

  const handleSubmit = async () => {
    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      toast.error('Jumlah harus angka bulat positif');
      return;
    }
    try {
      await restock.mutateAsync({
        modelId: modelId!,
        data: { quantity: qty, source, note: note || undefined },
      });
      toast.success('Restock berhasil');
      setQuantity('');
      setNote('');
      onClose();
    } catch {
      toast.error('Gagal melakukan restock');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <PackagePlus className="size-5 text-emerald-600" />
            </div>
            <div>
              <DialogTitle className="text-base">Restock</DialogTitle>
              <DialogDescription className="text-xs">{modelName}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="restock-qty">Jumlah</Label>
            <Input
              id="restock-qty"
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Masukkan jumlah restock"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="restock-source">Sumber</Label>
            <select
              id="restock-source"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            >
              <option value="PURCHASE">Pembelian Baru</option>
              <option value="RETURN">Pengembalian</option>
              <option value="TRANSFER">Transfer Antar Gudang</option>
              <option value="OTHER">Lainnya</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="restock-note">Catatan (opsional)</Label>
            <Textarea
              id="restock-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Tambahkan catatan restock..."
              rows={2}
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button disabled={restock.isPending || !quantity} onClick={handleSubmit}>
            {restock.isPending ? 'Menyimpan...' : 'Konfirmasi Restock'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Threshold Modal ───────────────────────────────────────────
function ThresholdModal({
  stockItems,
  open,
  onClose,
}: {
  stockItems: StockSummary[];
  open: boolean;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<'bulk' | 'per-item'>('bulk');
  const [bulkMin, setBulkMin] = useState('');
  const [perItemDrafts, setPerItemDrafts] = useState<Record<number, string>>({});
  const updateThreshold = useUpdateStockThreshold();
  const updateBulk = useUpdateThresholdBulk();

  const getPerItemValue = (item: StockSummary) => {
    return perItemDrafts[item.modelId] ?? String(item.threshold);
  };

  const handleBulkSave = async () => {
    const parsed = Number(bulkMin);
    if (!Number.isInteger(parsed) || parsed < 0) {
      toast.error('Threshold harus angka bulat minimal 0');
      return;
    }
    const items = stockItems.map((s) => ({ modelId: s.modelId, minQuantity: parsed }));
    try {
      await updateBulk.mutateAsync(items);
      toast.success('Threshold berhasil diperbarui untuk semua model');
      onClose();
    } catch {
      toast.error('Gagal memperbarui threshold');
    }
  };

  const handlePerItemSave = async (modelId: number, currentThreshold: number) => {
    const raw = getPerItemValue({ modelId, threshold: currentThreshold } as StockSummary).trim();
    const parsed = Number(raw);
    if (!Number.isInteger(parsed) || parsed < 0) {
      toast.error('Threshold harus angka bulat minimal 0');
      return;
    }
    if (parsed === currentThreshold) return;
    try {
      await updateThreshold.mutateAsync({ modelId, minQuantity: parsed });
      toast.success('Threshold berhasil diperbarui');
    } catch {
      toast.error('Gagal memperbarui threshold');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10">
              <SlidersHorizontal className="size-5 text-amber-600" />
            </div>
            <div>
              <DialogTitle className="text-base">Atur Threshold Stok</DialogTitle>
              <DialogDescription className="text-xs">
                Batas minimum stok untuk notifikasi otomatis
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as 'bulk' | 'per-item')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bulk">Atur Semuanya</TabsTrigger>
            <TabsTrigger value="per-item">Per Item</TabsTrigger>
          </TabsList>

          <TabsContent value="bulk" className="mt-4">
            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="mb-3 text-sm text-muted-foreground">
                Terapkan threshold yang sama untuk semua{' '}
                <span className="font-semibold text-foreground">{stockItems.length} model</span>{' '}
                sekaligus.
              </p>
              <div className="flex items-end gap-3">
                <div className="flex-1 flex flex-col gap-1.5">
                  <Label htmlFor="bulk-threshold">Threshold Minimum</Label>
                  <Input
                    id="bulk-threshold"
                    type="number"
                    min={0}
                    value={bulkMin}
                    onChange={(e) => setBulkMin(e.target.value)}
                    placeholder="Contoh: 5"
                  />
                </div>
                <Button
                  disabled={updateBulk.isPending || !bulkMin}
                  onClick={handleBulkSave}
                  className="shrink-0"
                >
                  {updateBulk.isPending ? 'Menyimpan...' : 'Terapkan Semua'}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="per-item" className="mt-4">
            <ScrollArea className="max-h-80">
              <div className="flex flex-col gap-2 pr-3">
                {stockItems.map((item) => {
                  const currentVal = Number(getPerItemValue(item));
                  const isDirty = perItemDrafts[item.modelId] !== undefined;
                  return (
                    <div
                      key={item.modelId}
                      className="flex items-center gap-3 rounded-lg border p-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.modelName}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">
                            Stok: {item.totalQuantity}
                          </span>
                          <StockLevelBadge
                            total={item.totalQuantity}
                            threshold={isDirty ? currentVal : item.threshold}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Input
                          type="number"
                          min={0}
                          className="h-8 w-20 text-center"
                          value={getPerItemValue(item)}
                          onChange={(e) =>
                            setPerItemDrafts((prev) => ({
                              ...prev,
                              [item.modelId]: e.target.value,
                            }))
                          }
                        />
                        <Button
                          size="sm"
                          variant={isDirty ? 'default' : 'outline'}
                          disabled={updateThreshold.isPending || !isDirty}
                          onClick={() => handlePerItemSave(item.modelId, item.threshold)}
                          className="h-8"
                        >
                          Simpan
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// ─── Report Modal ──────────────────────────────────────────────
function ReportModal({
  type,
  modelName,
  open,
  onClose,
  onSubmit,
  isPending,
}: {
  type: 'damage' | 'lost';
  modelName: string;
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { assetId: string; description: string }) => void;
  isPending: boolean;
}) {
  const [assetId, setAssetId] = useState('');
  const [description, setDescription] = useState('');

  const isDamage = type === 'damage';

  const handleSubmit = () => {
    if (!assetId.trim()) {
      toast.error('Asset ID / Kode wajib diisi');
      return;
    }
    if (!description.trim()) {
      toast.error('Deskripsi wajib diisi');
      return;
    }
    onSubmit({ assetId: assetId.trim(), description: description.trim() });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex size-10 items-center justify-center rounded-lg',
                isDamage ? 'bg-orange-500/10' : 'bg-red-500/10',
              )}
            >
              {isDamage ? (
                <AlertCircle className="size-5 text-orange-600" />
              ) : (
                <CircleOff className="size-5 text-red-600" />
              )}
            </div>
            <div>
              <DialogTitle className="text-base">
                {isDamage ? 'Lapor Kerusakan' : 'Lapor Kehilangan'}
              </DialogTitle>
              <DialogDescription className="text-xs">{modelName}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Warning Banner */}
        <div
          className={cn(
            'flex items-start gap-2 rounded-lg border p-3 text-xs',
            isDamage
              ? 'border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-800 dark:bg-orange-950/30 dark:text-orange-300'
              : 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300',
          )}
        >
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
          <p>
            {isDamage
              ? 'Laporan ini akan membuat record perbaikan dan mengubah status aset.'
              : 'Laporan ini akan mengubah status aset menjadi HILANG. Tindakan ini perlu persetujuan.'}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="report-asset-id">Kode Aset</Label>
            <Input
              id="report-asset-id"
              value={assetId}
              onChange={(e) => setAssetId(e.target.value)}
              placeholder="Contoh: AS-2026-0115-0001"
              className="font-mono"
            />
            <p className="text-[10px] text-muted-foreground">
              Masukkan ID atau kode aset individual yang akan dilaporkan.
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="report-desc">Deskripsi {isDamage ? 'Kerusakan' : 'Kehilangan'}</Label>
            <Textarea
              id="report-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                isDamage
                  ? 'Jelaskan kerusakan yang terjadi, contoh: layar retak, port USB tidak berfungsi...'
                  : 'Jelaskan kronologi kehilangan, contoh: hilang saat pekerjaan lapangan di...'
              }
              rows={3}
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button
            variant="destructive"
            disabled={isPending || !assetId.trim() || !description.trim()}
            onClick={handleSubmit}
          >
            {isPending ? 'Mengirim...' : 'Kirim Laporan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Stock Page ───────────────────────────────────────────
export function StockPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const view = (searchParams.get('view') ?? 'main') as 'main' | 'division' | 'personal';
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);
  const exportStock = useExportStock();
  const { canAny } = usePermissions();

  // Modals state
  const [totalModal, setTotalModal] = useState<{ modelId: number; modelName: string } | null>(null);
  const [usageModal, setUsageModal] = useState<{ modelId: number; modelName: string } | null>(null);
  const [historyModal, setHistoryModal] = useState<{ modelId: number; modelName: string } | null>(
    null,
  );
  const [restockModal, setRestockModal] = useState<{ modelId: number; modelName: string } | null>(
    null,
  );
  const [thresholdOpen, setThresholdOpen] = useState(false);
  const [reportModal, setReportModal] = useState<{
    type: 'damage' | 'lost';
    modelId: number;
    modelName: string;
  } | null>(null);

  const reportDamage = useReportDamage();
  const reportLost = useReportLost();

  const { data, isLoading } = useStock({
    view,
    page,
    limit: 20,
    search: debouncedSearch || undefined,
  });

  const allStockItems = useMemo<StockSummary[]>(() => data?.data ?? [], [data]);
  const showPrice = canAny(P.PURCHASES_VIEW, P.PURCHASES_CREATE);

  const handleTabChange = (val: string) => {
    setSearchParams({ view: val });
    setPage(1);
  };

  const handleReport = async (reportData: { assetId: string; description: string }) => {
    if (!reportModal) return;
    try {
      if (reportModal.type === 'damage') {
        await reportDamage.mutateAsync({
          assetId: reportData.assetId,
          description: reportData.description,
        });
      } else {
        await reportLost.mutateAsync({
          assetId: reportData.assetId,
          description: reportData.description,
        });
      }
      toast.success(
        reportModal.type === 'damage'
          ? 'Laporan kerusakan berhasil dikirim'
          : 'Laporan kehilangan berhasil dikirim',
      );
      setReportModal(null);
    } catch {
      toast.error('Gagal mengirim laporan');
    }
  };

  return (
    <PageContainer
      title="Stok Aset"
      description="Monitoring stok gudang utama, divisi, dan pribadi"
      actions={
        <div className="flex items-center gap-2">
          {view === 'main' && (
            <Button variant="outline" size="sm" onClick={() => setThresholdOpen(true)}>
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Threshold
            </Button>
          )}
          <ExportButton
            onExport={(format) =>
              exportStock.mutate({ format, search: debouncedSearch || undefined })
            }
            isLoading={exportStock.isPending}
          />
        </div>
      }
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
                  {showPrice && <TableHead className="text-right">Harga Aset</TableHead>}
                  <TableHead className="text-center">Level</TableHead>
                  <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: showPrice ? 11 : 10 }).map((__, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : !allStockItems.length ? (
                  <TableRow>
                    <TableCell colSpan={showPrice ? 11 : 10}>
                      <EmptyState
                        icon={<Warehouse className="h-12 w-12" />}
                        title="Belum ada data stok"
                        description="Data stok akan muncul setelah aset dicatat di sistem."
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  allStockItems.map((item) => (
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
                      <TableCell className="text-center">
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 font-semibold"
                          onClick={() =>
                            setTotalModal({ modelId: item.modelId, modelName: item.modelName })
                          }
                        >
                          <Eye className="mr-1 size-3" />
                          {item.totalQuantity}
                        </Button>
                      </TableCell>
                      <TableCell className="text-center">{item.inStorage}</TableCell>
                      <TableCell className="text-center">
                        {item.inUse > 0 ? (
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0"
                            onClick={() =>
                              setUsageModal({ modelId: item.modelId, modelName: item.modelName })
                            }
                          >
                            <Eye className="mr-1 size-3" />
                            {item.inUse}
                          </Button>
                        ) : (
                          item.inUse
                        )}
                      </TableCell>
                      <TableCell className="text-center">{item.underRepair}</TableCell>
                      {showPrice && (
                        <TableCell className="text-right text-sm">
                          {item.totalPrice ? formatCurrency(item.totalPrice) : '—'}
                        </TableCell>
                      )}
                      <TableCell className="text-center">
                        <StockLevelBadge total={item.totalQuantity} threshold={item.threshold} />
                      </TableCell>
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                setRestockModal({
                                  modelId: item.modelId,
                                  modelName: item.modelName,
                                })
                              }
                            >
                              <PackagePlus className="mr-2 size-4" />
                              Restock
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                setHistoryModal({
                                  modelId: item.modelId,
                                  modelName: item.modelName,
                                })
                              }
                            >
                              <History className="mr-2 size-4" />
                              Riwayat
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                setReportModal({
                                  type: 'damage',
                                  modelId: item.modelId,
                                  modelName: item.modelName,
                                })
                              }
                            >
                              <AlertCircle className="mr-2 size-4" />
                              Lapor Kerusakan
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                setReportModal({
                                  type: 'lost',
                                  modelId: item.modelId,
                                  modelName: item.modelName,
                                })
                              }
                            >
                              <CircleOff className="mr-2 size-4" />
                              Lapor Hilang
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
                Menampilkan {allStockItems.length} dari {data.meta.total} model
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
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <TotalDetailModal
        modelId={totalModal?.modelId ?? null}
        modelName={totalModal?.modelName ?? ''}
        open={!!totalModal}
        onClose={() => setTotalModal(null)}
      />
      <UsageDetailModal
        modelId={usageModal?.modelId ?? null}
        modelName={usageModal?.modelName ?? ''}
        open={!!usageModal}
        onClose={() => setUsageModal(null)}
      />
      <HistoryModal
        modelId={historyModal?.modelId ?? null}
        modelName={historyModal?.modelName ?? ''}
        open={!!historyModal}
        onClose={() => setHistoryModal(null)}
      />
      <RestockModal
        modelId={restockModal?.modelId ?? null}
        modelName={restockModal?.modelName ?? ''}
        open={!!restockModal}
        onClose={() => setRestockModal(null)}
      />
      <ThresholdModal
        stockItems={allStockItems}
        open={thresholdOpen}
        onClose={() => setThresholdOpen(false)}
      />
      {reportModal && (
        <ReportModal
          type={reportModal.type}
          modelName={reportModal.modelName}
          open={true}
          onClose={() => setReportModal(null)}
          onSubmit={handleReport}
          isPending={reportDamage.isPending || reportLost.isPending}
        />
      )}
    </PageContainer>
  );
}

export default StockPage;
export const Component = StockPage;
