import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Ban } from 'lucide-react';
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
import { useRequest, useApproveRequest, useRejectRequest, useCancelRequest } from '../hooks';
import { RejectDialog } from '../components';
import { AttachmentSection } from '@/components/form';
import { usePermissions } from '@/hooks';
import { P } from '@/config/permissions';

const PRIORITY_LABELS: Record<string, string> = {
  REGULAR: 'Regular',
  URGENT: 'Urgent',
  PROJECT: 'Project',
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function RequestDetailPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { data: request, isLoading } = useRequest(uuid);
  const approveRequest = useApproveRequest();
  const rejectRequest = useRejectRequest();
  const cancelRequest = useCancelRequest();
  const [rejectOpen, setRejectOpen] = useState(false);
  const { canAny, can } = usePermissions();

  const handleApprove = () => {
    if (!uuid || !request) return;
    approveRequest.mutate(
      { uuid, version: request.version },
      {
        onSuccess: () => toast.success('Permintaan berhasil disetujui'),
        onError: () => toast.error('Gagal menyetujui permintaan'),
      },
    );
  };

  const handleReject = (reason: string) => {
    if (!uuid || !request) return;
    rejectRequest.mutate(
      { uuid, version: request.version, reason },
      {
        onSuccess: () => {
          toast.success('Permintaan berhasil ditolak');
          setRejectOpen(false);
        },
        onError: () => toast.error('Gagal menolak permintaan'),
      },
    );
  };

  const handleCancel = () => {
    if (!uuid || !request) return;
    cancelRequest.mutate(
      { uuid, version: request.version },
      {
        onSuccess: () => toast.success('Permintaan berhasil dibatalkan'),
        onError: () => toast.error('Gagal membatalkan permintaan'),
      },
    );
  };

  if (isLoading) {
    return (
      <PageContainer title="Detail Permintaan" description="Memuat data...">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="space-y-3 pt-6">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </PageContainer>
    );
  }

  if (!request) {
    return (
      <PageContainer title="Permintaan Tidak Ditemukan">
        <Button variant="outline" onClick={() => navigate('/requests')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Daftar
        </Button>
      </PageContainer>
    );
  }

  const isPending = request.status === 'PENDING';
  const canApprove =
    isPending &&
    canAny(P.REQUESTS_APPROVE_LOGISTIC, P.REQUESTS_APPROVE_PURCHASE, P.REQUESTS_APPROVE_FINAL);
  const canCancel = isPending && can(P.REQUESTS_CANCEL_OWN);

  return (
    <PageContainer
      title={request.title}
      description={`Kode: ${request.code}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/requests')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
          {canApprove && (
            <>
              <Button variant="default" onClick={handleApprove} disabled={approveRequest.isPending}>
                <CheckCircle className="mr-2 h-4 w-4" />
                {approveRequest.isPending ? 'Menyetujui...' : 'Approve'}
              </Button>
              <Button variant="destructive" onClick={() => setRejectOpen(true)}>
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
            </>
          )}
          {canCancel && (
            <Button variant="outline" onClick={handleCancel} disabled={cancelRequest.isPending}>
              <Ban className="mr-2 h-4 w-4" />
              {cancelRequest.isPending ? 'Membatalkan...' : 'Batalkan'}
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Info Utama */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informasi Permintaan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Kode</span>
                <span className="font-mono text-sm">{request.code}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <StatusBadge status={request.status} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Prioritas</span>
                <Badge variant="outline">
                  {PRIORITY_LABELS[request.priority] ?? request.priority}
                </Badge>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Tanggal Dibuat</span>
                <span className="text-sm">{formatDate(request.createdAt)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pemohon</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Nama</span>
                <span className="text-sm font-medium">{request.createdBy?.fullName ?? '-'}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Email</span>
                <span className="text-sm">{request.createdBy?.email ?? '-'}</span>
              </div>
              {request.description && (
                <>
                  <Separator />
                  <div>
                    <span className="text-sm text-muted-foreground">Deskripsi</span>
                    <p className="mt-1 text-sm">{request.description}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Daftar Item */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Daftar Item ({request.items?.length ?? 0})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead>Catatan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!request.items?.length ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Tidak ada item
                      </TableCell>
                    </TableRow>
                  ) : (
                    request.items.map((item, idx) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell className="font-medium">{item.description}</TableCell>
                        <TableCell>{item.model?.name ?? '-'}</TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-muted-foreground">{item.note || '-'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Approval Timeline */}
        {request.approvalChain && request.approvalChain.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Riwayat Approval</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {request.approvalChain.map((step) => (
                  <div key={step.step} className="flex items-start gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
                      {step.step}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{step.role}</span>
                        <StatusBadge status={step.status} />
                      </div>
                      {step.decidedAt && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatDate(step.decidedAt)}
                        </p>
                      )}
                      {step.note && <p className="mt-1 text-sm">{step.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lampiran */}
        <AttachmentSection entityType="Request" entityId={uuid} />
      </div>

      <RejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        onConfirm={handleReject}
        isPending={rejectRequest.isPending}
        title="Tolak Permintaan"
      />
    </PageContainer>
  );
}

export default RequestDetailPage;
export const Component = RequestDetailPage;
