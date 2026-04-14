import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useInstallation, useCompleteInstallation } from '../hooks';
import { AttachmentSection } from '@/components/form';

function formatDate(date: string | null) {
  if (!date) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}

export function InstallationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: installation, isLoading } = useInstallation(id ? Number(id) : 0);
  const completeInstallation = useCompleteInstallation();

  const handleComplete = () => {
    if (!id) return;
    completeInstallation.mutate(Number(id), {
      onSuccess: () => toast.success('Instalasi berhasil diselesaikan'),
      onError: () => toast.error('Gagal menyelesaikan instalasi'),
    });
  };

  if (isLoading) {
    return (
      <PageContainer title="Detail Instalasi" description="Memuat data...">
        <Card>
          <CardContent className="space-y-3 pt-6">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  if (!installation) {
    return (
      <PageContainer title="Data Tidak Ditemukan">
        <Button variant="outline" onClick={() => navigate('/installation')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Daftar
        </Button>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={`Instalasi ${installation.code}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/installation')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
          {installation.status === 'IN_PROGRESS' && (
            <Button
              variant="default"
              onClick={handleComplete}
              disabled={completeInstallation.isPending}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              {completeInstallation.isPending ? 'Menyelesaikan...' : 'Selesaikan'}
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informasi Instalasi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Kode</span>
                <span className="font-mono text-sm">{installation.code}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <StatusBadge status={installation.status} />
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Lokasi</span>
                <span className="text-sm">{installation.location || '-'}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Dijadwalkan</span>
                <span className="text-sm">{formatDate(installation.scheduledAt)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Selesai</span>
                <span className="text-sm">{formatDate(installation.completedAt)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pelanggan & PIC</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Pelanggan</span>
                <span className="text-sm font-medium">{installation.customer?.name ?? '-'}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Dibuat oleh</span>
                <span className="text-sm">{installation.createdBy?.fullName ?? '-'}</span>
              </div>
              <Separator />
              <div>
                <span className="text-sm text-muted-foreground">Catatan</span>
                <p className="mt-1 text-sm">{installation.note || '-'}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Material ({installation.materials?.length ?? 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead className="w-24 text-right">Jumlah</TableHead>
                    <TableHead>Catatan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!installation.materials?.length ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        Tidak ada material
                      </TableCell>
                    </TableRow>
                  ) : (
                    installation.materials.map((mat, idx) => (
                      <TableRow key={mat.id}>
                        <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell>{mat.description}</TableCell>
                        <TableCell className="text-right">{mat.quantity}</TableCell>
                        <TableCell className="text-muted-foreground">{mat.note || '-'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Lampiran */}
        <AttachmentSection entityType="Installation" entityId={id} />
      </div>
    </PageContainer>
  );
}

export default InstallationDetailPage;
export const Component = InstallationDetailPage;
