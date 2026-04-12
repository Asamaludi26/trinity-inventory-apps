import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { Separator } from '@/components/ui/separator';
import { useAsset } from '../hooks';
import { AttachmentSection } from '@/components/form';

const CONDITION_LABELS: Record<string, string> = {
  NEW: 'Baru',
  GOOD: 'Baik',
  FAIR: 'Cukup',
  POOR: 'Buruk',
  BROKEN: 'Rusak',
};

function formatDate(date: string | null) {
  if (!date) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}

function formatCurrency(value: string | null) {
  if (!value) return '-';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(
    Number(value),
  );
}

export function AssetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: asset, isLoading } = useAsset(id);

  if (isLoading) {
    return (
      <PageContainer title="Detail Aset" description="Memuat data...">
        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent className="space-y-3">
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

  return (
    <PageContainer
      title={asset.name}
      description={`Kode: ${asset.code}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/assets')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
          <Button variant="outline" onClick={() => navigate(`/assets/${id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive" size="icon">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 md:grid-cols-2">
        {/* Informasi Umum */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informasi Umum</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Kode</span>
              <span className="font-mono text-sm">{asset.code}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Nama</span>
              <span className="text-sm font-medium">{asset.name}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Brand</span>
              <span className="text-sm">{asset.brand || '-'}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Serial Number</span>
              <span className="font-mono text-sm">{asset.serialNumber || '-'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Klasifikasi */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Klasifikasi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Kategori</span>
              <span className="text-sm">{asset.category?.name ?? '-'}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Tipe</span>
              <span className="text-sm">{asset.type?.name ?? '-'}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Model</span>
              <span className="text-sm">{asset.model?.name ?? '-'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Status & Kondisi */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status & Kondisi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
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
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Pemegang Saat Ini</span>
              <span className="text-sm">{asset.currentUser?.fullName ?? 'Tidak ada'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Informasi Pembelian */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informasi Pembelian</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Harga Beli</span>
              <span className="text-sm">{formatCurrency(asset.purchasePrice)}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Tanggal Beli</span>
              <span className="text-sm">{formatDate(asset.purchaseDate)}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Dicatat Oleh</span>
              <span className="text-sm">{asset.recordedBy?.fullName ?? '-'}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Tanggal Dicatat</span>
              <span className="text-sm">{formatDate(asset.createdAt)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lampiran */}
      <AttachmentSection entityType="Asset" entityId={id} />
    </PageContainer>
  );
}

export default AssetDetailPage;
export const Component = AssetDetailPage;
