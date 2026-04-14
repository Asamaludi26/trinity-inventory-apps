import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useMaintenanceDetail, useCompleteMaintenance } from '../hooks';
import { AttachmentSection } from '@/components/form';

function formatDate(date: string | null) {
  if (!date) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}

export function MaintenanceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: maintenance, isLoading } = useMaintenanceDetail(id ? Number(id) : 0);
  const completeMaintenance = useCompleteMaintenance();

  const handleComplete = () => {
    if (!id) return;
    completeMaintenance.mutate(
      { id: Number(id) },
      {
        onSuccess: () => toast.success('Maintenance berhasil diselesaikan'),
        onError: () => toast.error('Gagal menyelesaikan maintenance'),
      },
    );
  };

  if (isLoading) {
    return (
      <PageContainer title="Detail Pemeliharaan" description="Memuat data...">
        <Card>
          <CardContent className="space-y-3 pt-6">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  if (!maintenance) {
    return (
      <PageContainer title="Data Tidak Ditemukan">
        <Button variant="outline" onClick={() => navigate('/maintenance')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Daftar
        </Button>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={`Pemeliharaan ${maintenance.code}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/maintenance')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
          {maintenance.status === 'IN_PROGRESS' && (
            <Button
              variant="default"
              onClick={handleComplete}
              disabled={completeMaintenance.isPending}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              {completeMaintenance.isPending ? 'Menyelesaikan...' : 'Selesaikan'}
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informasi Pemeliharaan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Kode</span>
                <span className="font-mono text-sm">{maintenance.code}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <StatusBadge status={maintenance.status} />
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Dijadwalkan</span>
                <span className="text-sm">{formatDate(maintenance.scheduledAt)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Selesai</span>
                <span className="text-sm">{formatDate(maintenance.completedAt)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Prioritas</span>
                <Badge
                  variant={
                    maintenance.priority === 'HIGH'
                      ? 'destructive'
                      : maintenance.priority === 'LOW'
                        ? 'secondary'
                        : 'default'
                  }
                >
                  {maintenance.priority}
                </Badge>
              </div>
              {maintenance.workTypes && maintenance.workTypes.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <span className="text-sm text-muted-foreground">Jenis Pekerjaan</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {maintenance.workTypes.map((wt) => (
                        <Badge key={wt} variant="outline">
                          {wt}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pelanggan & Laporan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Pelanggan</span>
                <span className="text-sm font-medium">{maintenance.customer?.name ?? '-'}</span>
              </div>
              <Separator />
              <div>
                <span className="text-sm text-muted-foreground">Laporan Masalah</span>
                <p className="mt-1 text-sm">{maintenance.issueReport || '-'}</p>
              </div>
              <Separator />
              <div>
                <span className="text-sm text-muted-foreground">Resolusi</span>
                <p className="mt-1 text-sm">{maintenance.resolution || '-'}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Materials Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Material ({maintenance.materials?.length ?? 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead className="w-24 text-right">Jumlah</TableHead>
                    <TableHead>Catatan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!maintenance.materials?.length ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Tidak ada material
                      </TableCell>
                    </TableRow>
                  ) : (
                    maintenance.materials.map((mat, idx) => (
                      <TableRow key={mat.id}>
                        <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell>{mat.description}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {mat.model?.name || '-'}
                        </TableCell>
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

        {/* Replacements Table */}
        {maintenance.replacements && maintenance.replacements.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Penggantian Aset ({maintenance.replacements.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Aset Lama</TableHead>
                      <TableHead>Aset Baru</TableHead>
                      <TableHead>Kondisi Setelah</TableHead>
                      <TableHead>Catatan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {maintenance.replacements.map((rep, idx) => (
                      <TableRow key={rep.id}>
                        <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell>
                          <div>{rep.oldAssetDesc}</div>
                          {rep.oldAsset && (
                            <span className="text-xs text-muted-foreground font-mono">
                              {rep.oldAsset.code}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>{rep.newAssetDesc}</div>
                          {rep.newAsset && (
                            <span className="text-xs text-muted-foreground font-mono">
                              {rep.newAsset.code}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {rep.conditionAfter ? (
                            <Badge variant="outline">{rep.conditionAfter}</Badge>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{rep.note || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lampiran */}
        <AttachmentSection entityType="Maintenance" entityId={id} />
      </div>
    </PageContainer>
  );
}

export default MaintenanceDetailPage;
export const Component = MaintenanceDetailPage;
