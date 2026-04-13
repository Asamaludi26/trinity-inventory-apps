import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { Separator } from '@/components/ui/separator';
import { useDismantle, useCompleteDismantle } from '../hooks';
import { AttachmentSection } from '@/components/form';

function formatDate(date: string | null) {
  if (!date) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}

export function DismantleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: dismantle, isLoading } = useDismantle(id ? Number(id) : undefined);
  const completeDismantle = useCompleteDismantle();

  const handleComplete = () => {
    if (!id) return;
    completeDismantle.mutate(Number(id), {
      onSuccess: () => toast.success('Dismantle berhasil diselesaikan'),
      onError: () => toast.error('Gagal menyelesaikan dismantle'),
    });
  };

  if (isLoading) {
    return (
      <PageContainer title="Detail Pembongkaran" description="Memuat data...">
        <Card>
          <CardContent className="space-y-3 pt-6">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  if (!dismantle) {
    return (
      <PageContainer title="Data Tidak Ditemukan">
        <Button variant="outline" onClick={() => navigate('/dismantle')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Daftar
        </Button>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={`Pembongkaran ${dismantle.code}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/dismantle')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
          {dismantle.status === 'IN_PROGRESS' && (
            <Button
              variant="default"
              onClick={handleComplete}
              disabled={completeDismantle.isPending}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              {completeDismantle.isPending ? 'Menyelesaikan...' : 'Selesaikan'}
            </Button>
          )}
        </div>
      }
    >
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informasi Pembongkaran</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Kode</span>
              <span className="font-mono text-sm">{dismantle.code}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <StatusBadge status={dismantle.status} />
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Dijadwalkan</span>
              <span className="text-sm">{formatDate(dismantle.scheduledAt)}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Selesai</span>
              <span className="text-sm">{formatDate(dismantle.completedAt)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pelanggan & Detail</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Pelanggan</span>
              <span className="text-sm font-medium">{dismantle.customer?.name ?? '-'}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Dibuat oleh</span>
              <span className="text-sm">{dismantle.createdBy?.fullName ?? '-'}</span>
            </div>
            <Separator />
            <div>
              <span className="text-sm text-muted-foreground">Alasan</span>
              <p className="mt-1 text-sm">{dismantle.reason || '-'}</p>
            </div>
            <Separator />
            <div>
              <span className="text-sm text-muted-foreground">Catatan</span>
              <p className="mt-1 text-sm">{dismantle.note || '-'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lampiran */}
      <AttachmentSection entityType="Dismantle" entityId={id} />
    </PageContainer>
  );
}

export default DismantleDetailPage;
export const Component = DismantleDetailPage;
