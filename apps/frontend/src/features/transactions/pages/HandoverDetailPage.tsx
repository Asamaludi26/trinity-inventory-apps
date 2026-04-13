import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
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
import { useHandover, useApproveHandover, useRejectHandover } from '../hooks';
import { RejectDialog } from '../components';
import { AttachmentSection } from '@/components/form';
import { usePermissions } from '@/hooks';
import { P } from '@/config/permissions';

function formatDate(date: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}

export function HandoverDetailPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { data: handover, isLoading } = useHandover(uuid);
  const approveHandover = useApproveHandover();
  const rejectHandover = useRejectHandover();
  const [rejectOpen, setRejectOpen] = useState(false);
  const { can } = usePermissions();

  const handleApprove = () => {
    if (!uuid || !handover) return;
    approveHandover.mutate(
      { uuid, version: handover.version },
      {
        onSuccess: () => toast.success('Serah terima berhasil disetujui'),
        onError: () => toast.error('Gagal menyetujui serah terima'),
      },
    );
  };

  const handleReject = (reason: string) => {
    if (!uuid || !handover) return;
    rejectHandover.mutate(
      { uuid, version: handover.version, reason },
      {
        onSuccess: () => {
          toast.success('Serah terima berhasil ditolak');
          setRejectOpen(false);
        },
        onError: () => toast.error('Gagal menolak serah terima'),
      },
    );
  };

  if (isLoading) {
    return (
      <PageContainer title="Detail Serah Terima" description="Memuat data...">
        <Card>
          <CardContent className="space-y-3 pt-6">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  if (!handover) {
    return (
      <PageContainer title="Data Tidak Ditemukan">
        <Button variant="outline" onClick={() => navigate('/handovers')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Daftar
        </Button>
      </PageContainer>
    );
  }

  const isPending = handover.status === 'PENDING';
  const canApprove = isPending && can(P.ASSETS_HANDOVER);

  return (
    <PageContainer
      title={`Serah Terima ${handover.code}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/handovers')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
          {canApprove && (
            <>
              <Button
                variant="default"
                onClick={handleApprove}
                disabled={approveHandover.isPending}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                {approveHandover.isPending ? 'Menyetujui...' : 'Approve'}
              </Button>
              <Button variant="destructive" onClick={() => setRejectOpen(true)}>
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
            </>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informasi Serah Terima</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Kode</span>
                <span className="font-mono text-sm">{handover.code}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <StatusBadge status={handover.status} />
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Catatan</span>
                <span className="text-sm">{handover.note || '-'}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Tanggal</span>
                <span className="text-sm">{formatDate(handover.createdAt)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pihak Terlibat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Dari</span>
                <span className="text-sm font-medium">{handover.fromUser?.fullName ?? '-'}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Kepada</span>
                <span className="text-sm font-medium">{handover.toUser?.fullName ?? '-'}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Saksi</span>
                <span className="text-sm">{handover.witnessUser?.fullName ?? 'Tidak ada'}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Daftar Aset ({handover.items?.length ?? 0})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>ID Aset</TableHead>
                    <TableHead>Catatan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!handover.items?.length ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        Tidak ada item
                      </TableCell>
                    </TableRow>
                  ) : (
                    handover.items.map((item, idx) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell className="font-mono text-xs">{item.assetId}</TableCell>
                        <TableCell className="text-muted-foreground">{item.note || '-'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Lampiran */}
        <AttachmentSection entityType="Handover" entityId={uuid} />
      </div>

      <RejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        onConfirm={handleReject}
        isPending={rejectHandover.isPending}
        title="Tolak Serah Terima"
      />
    </PageContainer>
  );
}
export const Component = HandoverDetailPage;
