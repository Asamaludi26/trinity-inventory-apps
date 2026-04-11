import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useDepreciation } from '../hooks';

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

const METHOD_LABELS: Record<string, string> = {
  STRAIGHT_LINE: 'Garis Lurus',
  DECLINING_BALANCE: 'Saldo Menurun',
};

export function DepreciationDetailPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { data: depreciation, isLoading } = useDepreciation(uuid);

  if (isLoading) {
    return (
      <PageContainer title="Detail Depresiasi" description="Memuat data...">
        <Card>
          <CardContent className="space-y-3 pt-6">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  if (!depreciation) {
    return (
      <PageContainer title="Data Tidak Ditemukan">
        <Button variant="outline" onClick={() => navigate('/assets/depreciation')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Daftar
        </Button>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Detail Depresiasi"
      description={`Model: ${depreciation.purchase?.model?.name ?? '-'}`}
      actions={
        <Button variant="outline" onClick={() => navigate('/assets/depreciation')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
      }
    >
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Parameter Depresiasi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Metode</span>
              <Badge variant="outline">
                {METHOD_LABELS[depreciation.method] ?? depreciation.method}
              </Badge>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Masa Manfaat</span>
              <span className="text-sm">{depreciation.usefulLifeYears} tahun</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Nilai Sisa</span>
              <span className="text-sm">{formatCurrency(depreciation.salvageValue)}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Tanggal Mulai</span>
              <span className="text-sm">{formatDate(depreciation.startDate)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Data Pembelian Terkait</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Supplier</span>
              <span className="text-sm">{depreciation.purchase?.supplier ?? '-'}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Harga</span>
              <span className="text-sm font-semibold">
                {formatCurrency(depreciation.purchase?.totalPrice ?? null)}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Dicatat Oleh</span>
              <span className="text-sm">{depreciation.createdBy?.fullName ?? '-'}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}

export default DepreciationDetailPage;
export const Component = DepreciationDetailPage;
