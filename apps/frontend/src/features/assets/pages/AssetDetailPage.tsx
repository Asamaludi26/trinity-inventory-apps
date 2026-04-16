import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  QrCode,
  Barcode,
  ArrowDownUp,
  MapPin,
  Paperclip,
  History,
  Info,
  Package,
  DollarSign,
  TrendingDown,
} from 'lucide-react';
import { useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { useAsset, useDeleteAsset, useStockMovements, useAssetHistory } from '../hooks';
import { AttachmentSection, QrCodeSection } from '@/components/form';
import { BarcodeLabel } from '../components/BarcodeLabel';
import { usePermissions } from '@/hooks/use-permissions';
import { P } from '@/config/permissions';
import { toast } from 'sonner';

const CONDITION_LABELS: Record<string, string> = {
  NEW: 'Baru',
  GOOD: 'Baik',
  FAIR: 'Cukup',
  POOR: 'Buruk',
  BROKEN: 'Rusak',
};

const RECORDING_SOURCE_LABELS: Record<string, string> = {
  REQUEST: 'Dari Request',
  MANUAL: 'Manual',
};

function formatDate(date: string | null) {
  if (!date) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}

function formatDateTime(date: string | null) {
  if (!date) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

function formatCurrency(value: string | null) {
  if (!value) return '-';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(
    Number(value),
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <>
      <div className="flex justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm font-medium text-right">{value}</span>
      </div>
      <Separator />
    </>
  );
}

export function AssetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showQR, setShowQR] = useState(false);
  const [showBarcode, setShowBarcode] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const { data: asset, isLoading } = useAsset(id);
  const { data: movements, isLoading: isLoadingMovements } = useStockMovements(id);
  const { data: historyData, isLoading: isLoadingHistory } = useAssetHistory(id, historyPage);
  const deleteAsset = useDeleteAsset();
  const { can, canAny } = usePermissions();

  if (isLoading) {
    return (
      <PageContainer title="Detail Aset" description="Memuat data...">
        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </PageContainer>
    );
  }

  if (!asset) {
    return (
      <PageContainer title="Aset Tidak Ditemukan" description="Data aset tidak tersedia.">
        <Button variant="outline" onClick={() => navigate('/assets')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Daftar
        </Button>
      </PageContainer>
    );
  }

  const handleDelete = async () => {
    try {
      await deleteAsset.mutateAsync(id!);
      toast.success('Aset berhasil dihapus');
      navigate('/assets');
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(axiosError.response?.data?.message || 'Gagal menghapus aset');
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  const showPurchase = canAny(P.PURCHASES_VIEW, P.PURCHASES_CREATE);
  const showDepreciation = canAny(P.DEPRECIATION_VIEW, P.DEPRECIATION_CREATE);

  return (
    <PageContainer
      title={asset.name}
      description={`Kode: ${asset.code}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowQR(!showQR)}>
            <QrCode className="h-4 w-4" />
            QR
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowBarcode(!showBarcode)}>
            <Barcode className="h-4 w-4" />
            Barcode
          </Button>
          <Button variant="outline" onClick={() => navigate('/assets')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
          {can(P.ASSETS_EDIT) && (
            <Button variant="outline" onClick={() => navigate(`/assets/${id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
          {can(P.ASSETS_DELETE) && (
            <Button
              variant="destructive"
              size="icon"
              disabled={deleteAsset.isPending}
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      }
    >
      {/* QR / Barcode */}
      {showQR && id && <QrCodeSection assetId={id} assetCode={asset.code} />}
      {showBarcode && (
        <BarcodeLabel
          assetCode={asset.code}
          assetName={asset.name}
          serialNumber={asset.serialNumber}
        />
      )}

      {/* Tabbed Content */}
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="general" className="gap-1">
            <Info className="size-4" />
            Umum
          </TabsTrigger>
          <TabsTrigger value="detail" className="gap-1">
            <Package className="size-4" />
            Detail
          </TabsTrigger>
          {showPurchase && (
            <TabsTrigger value="purchase" className="gap-1">
              <DollarSign className="size-4" />
              Pembelian
            </TabsTrigger>
          )}
          {showDepreciation && (
            <TabsTrigger value="depreciation" className="gap-1">
              <TrendingDown className="size-4" />
              Penyusutan
            </TabsTrigger>
          )}
          <TabsTrigger value="location" className="gap-1">
            <MapPin className="size-4" />
            Lokasi
          </TabsTrigger>
          <TabsTrigger value="movements" className="gap-1">
            <ArrowDownUp className="size-4" />
            Pergerakan
          </TabsTrigger>
          <TabsTrigger value="attachments" className="gap-1">
            <Paperclip className="size-4" />
            Lampiran
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1">
            <History className="size-4" />
            Riwayat
          </TabsTrigger>
        </TabsList>

        {/* Tab: Umum */}
        <TabsContent value="general">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informasi Umum</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <DetailRow label="Kode" value={<span className="font-mono">{asset.code}</span>} />
                <DetailRow label="Nama" value={asset.name} />
                <DetailRow label="Brand" value={asset.brand || '-'} />
                <DetailRow label="Kategori" value={asset.category?.name ?? '-'} />
                <DetailRow label="Tipe" value={asset.type?.name ?? '-'} />
                <DetailRow label="Model" value={asset.model?.name ?? '-'} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Status & Kondisi</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <StatusBadge status={asset.status} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Kondisi</span>
                  <Badge variant="outline">
                    {CONDITION_LABELS[asset.condition] ?? asset.condition}
                  </Badge>
                </div>
                <Separator />
                <DetailRow label="Pemegang" value={asset.currentUser?.fullName ?? 'Tidak ada'} />
                <DetailRow
                  label="Sumber Pencatatan"
                  value={RECORDING_SOURCE_LABELS[asset.recordingSource] ?? '-'}
                />
                <DetailRow label="Catatan" value={asset.note || '-'} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Detail */}
        <TabsContent value="detail">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Klasifikasi & Tracking</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <DetailRow
                  label="Klasifikasi"
                  value={asset.classification === 'ASSET' ? 'Aset Individual' : 'Material'}
                />
                <DetailRow label="Metode Tracking" value={asset.trackingMethod ?? '-'} />
                {asset.quantity !== null && <DetailRow label="Jumlah" value={asset.quantity} />}
                {asset.currentBalance !== null && (
                  <DetailRow label="Saldo Saat Ini" value={asset.currentBalance} />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Detail Individual</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <DetailRow
                  label="Serial Number"
                  value={<span className="font-mono">{asset.serialNumber || '-'}</span>}
                />
                <DetailRow
                  label="MAC Address"
                  value={<span className="font-mono">{asset.macAddress || '-'}</span>}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Pembelian */}
        {showPurchase && (
          <TabsContent value="purchase">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informasi Pembelian</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <DetailRow label="Harga Beli" value={formatCurrency(asset.purchasePrice)} />
                <DetailRow label="Tanggal Beli" value={formatDate(asset.purchaseDate)} />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Tab: Penyusutan */}
        {showDepreciation && (
          <TabsContent value="depreciation">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informasi Penyusutan</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <DetailRow
                  label="Metode"
                  value={
                    asset.depreciationMethod === 'STRAIGHT_LINE'
                      ? 'Garis Lurus'
                      : asset.depreciationMethod === 'DECLINING_BALANCE'
                        ? 'Saldo Menurun'
                        : '-'
                  }
                />
                <DetailRow
                  label="Masa Manfaat"
                  value={asset.usefulLifeYears ? `${asset.usefulLifeYears} tahun` : '-'}
                />
                <DetailRow label="Nilai Sisa" value={formatCurrency(asset.salvageValue)} />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Tab: Lokasi */}
        <TabsContent value="location">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="size-5" />
                Informasi Lokasi
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <DetailRow label="Lokasi" value={asset.location || '-'} />
              <DetailRow label="Detail Lokasi" value={asset.locationDetail || '-'} />
              <DetailRow label="Catatan Lokasi" value={asset.locationNote || '-'} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Pergerakan Stok */}
        <TabsContent value="movements">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ArrowDownUp className="size-5" />
                Riwayat Pergerakan Stok
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingMovements ? (
                <div className="flex flex-col gap-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : !movements?.length ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Belum ada riwayat pergerakan stok.
                </p>
              ) : (
                <div className="relative flex flex-col gap-4">
                  <div className="absolute left-4 top-0 h-full w-px bg-border" />
                  {movements.map((movement) => (
                    <div key={movement.id} className="relative flex gap-4 pl-10">
                      <div className="absolute left-2.5 top-1 size-3 rounded-full border-2 border-primary bg-background" />
                      <div className="flex-1 rounded-lg border p-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">{movement.type}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(movement.createdAt)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm">
                          Qty: <span className="font-medium">{movement.quantity}</span>
                        </p>
                        {movement.notes && (
                          <p className="mt-1 text-xs text-muted-foreground">{movement.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Lampiran */}
        <TabsContent value="attachments">
          {id && <AttachmentSection entityType="Asset" entityId={id} />}
        </TabsContent>

        {/* Tab: Riwayat Perubahan */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <History className="size-5" />
                Riwayat Perubahan
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingHistory ? (
                <div className="flex flex-col gap-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : !historyData?.data?.length ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Belum ada riwayat perubahan.
                </p>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Waktu</TableHead>
                        <TableHead>Aksi</TableHead>
                        <TableHead>Field</TableHead>
                        <TableHead>Sebelum</TableHead>
                        <TableHead>Sesudah</TableHead>
                        <TableHead>Diubah Oleh</TableHead>
                        <TableHead>Catatan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historyData.data.map((h) => (
                        <TableRow key={h.id}>
                          <TableCell className="text-xs">{formatDateTime(h.createdAt)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{h.action}</Badge>
                          </TableCell>
                          <TableCell className="text-xs">{h.field || '-'}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {h.oldValue || '-'}
                          </TableCell>
                          <TableCell className="text-xs font-medium">{h.newValue || '-'}</TableCell>
                          <TableCell className="text-xs">{h.changedBy?.fullName ?? '-'}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {h.note || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {historyData.meta && historyData.meta.totalPages > 1 && (
                    <div className="flex items-center justify-end gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={historyPage <= 1}
                        onClick={() => setHistoryPage((p) => p - 1)}
                      >
                        Sebelumnya
                      </Button>
                      <span className="text-sm">
                        {historyPage} / {historyData.meta.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={historyPage >= historyData.meta.totalPages}
                        onClick={() => setHistoryPage((p) => p + 1)}
                      >
                        Selanjutnya
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Aset</DialogTitle>
            <DialogDescription>
              Yakin ingin menghapus aset <strong>{asset.name}</strong> ({asset.code})? Aset yang
              memiliki data terkait (serah terima, peminjaman, perbaikan aktif) tidak dapat dihapus.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" disabled={deleteAsset.isPending} onClick={handleDelete}>
              {deleteAsset.isPending ? 'Menghapus...' : 'Hapus Aset'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}

export default AssetDetailPage;
export const Component = AssetDetailPage;
