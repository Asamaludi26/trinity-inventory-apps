import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Play, Ban, Wrench } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  useRepair,
  useApproveRepair,
  useRejectRepair,
  useExecuteRepair,
  useCancelRepair,
} from '../hooks';
import { ApprovalTimeline } from '../components';
import type { Repair } from '../types';
import { AttachmentSection } from '@/components/form';
import { usePermissions } from '@/hooks';
import { P } from '@/config/permissions';

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

export function RepairDetailPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useRepair(uuid);
  const repair = data as Repair | undefined;

  const approveMutation = useApproveRepair();
  const rejectMutation = useRejectRepair();
  const executeMutation = useExecuteRepair();
  const cancelMutation = useCancelRepair();

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const { can } = usePermissions();

  if (isLoading) {
    return (
      <PageContainer title="Detail Perbaikan" description="Memuat data...">
        <Card>
          <CardContent className="space-y-3 pt-6">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  if (!repair) {
    return (
      <PageContainer title="Data Tidak Ditemukan">
        <Button variant="outline" onClick={() => navigate('/repairs')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Daftar
        </Button>
      </PageContainer>
    );
  }

  const canApprove =
    ['PENDING', 'LOGISTIC_APPROVED'].includes(repair.status) && can(P.ASSETS_REPAIR_MANAGE);
  const canReject =
    !['REJECTED', 'CANCELLED', 'COMPLETED'].includes(repair.status) && can(P.ASSETS_REPAIR_MANAGE);
  const canExecute = repair.status === 'APPROVED' && can(P.ASSETS_REPAIR_MANAGE);
  const canCancel = repair.status === 'PENDING' && can(P.ASSETS_REPAIR_REPORT);

  function handleApprove() {
    if (!uuid || !repair) return;
    approveMutation.mutate(
      { uuid, version: repair.version },
      {
        onSuccess: () => toast.success('Laporan berhasil di-approve'),
        onError: () => toast.error('Gagal approve laporan'),
      },
    );
  }

  function handleReject() {
    if (!uuid || !repair || !rejectionReason.trim()) return;
    rejectMutation.mutate(
      { uuid, version: repair.version, reason: rejectionReason },
      {
        onSuccess: () => {
          toast.success('Laporan berhasil ditolak');
          setRejectDialogOpen(false);
          setRejectionReason('');
        },
        onError: () => toast.error('Gagal menolak laporan'),
      },
    );
  }

  function handleExecute() {
    if (!uuid || !repair) return;
    executeMutation.mutate(
      { uuid, version: repair.version },
      {
        onSuccess: () => toast.success('Perbaikan dimulai'),
        onError: () => toast.error('Gagal memulai perbaikan'),
      },
    );
  }

  function handleCancel() {
    if (!uuid || !repair) return;
    cancelMutation.mutate(
      { uuid, version: repair.version },
      {
        onSuccess: () => toast.success('Laporan berhasil dibatalkan'),
        onError: () => toast.error('Gagal membatalkan laporan'),
      },
    );
  }

  return (
    <PageContainer
      title={`Perbaikan ${repair.code ?? ''}`}
      actions={
        <Button variant="outline" onClick={() => navigate('/repairs')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
      }
    >
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {canApprove && (
          <Button onClick={handleApprove} disabled={approveMutation.isPending}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Approve
          </Button>
        )}
        {canReject && (
          <Button variant="destructive" onClick={() => setRejectDialogOpen(true)}>
            <XCircle className="mr-2 h-4 w-4" />
            Reject
          </Button>
        )}
        {canExecute && (
          <Button variant="secondary" onClick={handleExecute} disabled={executeMutation.isPending}>
            <Play className="mr-2 h-4 w-4" />
            Mulai Perbaikan
          </Button>
        )}
        {canCancel && (
          <Button variant="outline" onClick={handleCancel} disabled={cancelMutation.isPending}>
            <Ban className="mr-2 h-4 w-4" />
            Batalkan
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informasi Perbaikan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Kode</span>
              <span className="font-mono text-sm">{repair.code ?? '-'}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <StatusBadge status={repair.status ?? 'PENDING'} />
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Aset</span>
              <span className="text-sm">
                {repair.asset?.code ? `${repair.asset.code} — ${repair.asset.name}` : '-'}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Pelapor</span>
              <span className="text-sm">{repair.createdBy?.fullName ?? '-'}</span>
            </div>
            <Separator />
            <div>
              <span className="text-sm text-muted-foreground">Deskripsi Masalah</span>
              <p className="mt-1 text-sm">{repair.issueDescription ?? '-'}</p>
            </div>
            {repair.rejectionReason && (
              <>
                <Separator />
                <div>
                  <span className="text-sm text-destructive font-medium">Alasan Penolakan</span>
                  <p className="mt-1 text-sm text-destructive">{repair.rejectionReason}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Detail Perbaikan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Tindakan</span>
              <span className="text-sm">{repair.repairAction ?? '-'}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Vendor</span>
              <span className="text-sm">{repair.repairVendor ?? '-'}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Biaya</span>
              <span className="text-sm">{formatCurrency(repair.repairCost ?? null)}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Mulai</span>
              <span className="text-sm">{formatDate(repair.startedAt ?? null)}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Selesai</span>
              <span className="text-sm">{formatDate(repair.completedAt ?? null)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Approval Timeline */}
        {repair.approvalChain && repair.approvalChain.length > 0 && (
          <ApprovalTimeline steps={repair.approvalChain} />
        )}

        {/* Lampiran */}
        <AttachmentSection entityType="Repair" entityId={uuid} />
      </div>

      {/* Rejection Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak Laporan Perbaikan</DialogTitle>
            <DialogDescription>Berikan alasan penolakan untuk laporan ini.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="rejectionReason">Alasan Penolakan</Label>
            <Textarea
              id="rejectionReason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Tulis alasan penolakan..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectionReason.trim() || rejectMutation.isPending}
            >
              {rejectMutation.isPending ? 'Menolak...' : 'Tolak'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}

export default RepairDetailPage;
export const Component = RepairDetailPage;
