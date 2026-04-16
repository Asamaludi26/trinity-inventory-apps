import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Ban, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useRequest,
  useApproveRequest,
  useRejectRequest,
  useCancelRequest,
  useExecuteRequest,
} from '../hooks';
import { RejectDialog, ApprovalTimeline, PurchaseProcessDialog } from '../components';
import type { PurchaseProcessData } from '../components';
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
  const executeRequest = useExecuteRequest();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [purchaseProcessOpen, setPurchaseProcessOpen] = useState(false);
  const [approveNote, setApproveNote] = useState('');
  const [itemAdjustments, setItemAdjustments] = useState<Record<number, number>>({});
  const { canAny, can } = usePermissions();

  const handleApprove = () => {
    if (!uuid || !request) return;

    const adjustments = Object.entries(itemAdjustments)
      .filter(([, qty]) => qty >= 0)
      .map(([itemId, approvedQuantity]) => ({
        itemId: Number(itemId),
        approvedQuantity,
      }))
      .filter((adj) => {
        const item = request.items?.find((i) => i.id === adj.itemId);
        return item && adj.approvedQuantity !== item.quantity;
      });

    approveRequest.mutate(
      {
        uuid,
        version: request.version,
        note: approveNote || undefined,
        itemAdjustments: adjustments.length > 0 ? adjustments : undefined,
      },
      {
        onSuccess: () => {
          toast.success('Permintaan berhasil disetujui');
          setApproveOpen(false);
          setApproveNote('');
          setItemAdjustments({});
        },
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

  const handleExecute = () => {
    if (!uuid || !request) return;
    // For APPROVED → PURCHASING, open purchase process dialog
    if (request.status === 'APPROVED') {
      setPurchaseProcessOpen(true);
      return;
    }
    executeRequest.mutate(
      { uuid, version: request.version },
      {
        onSuccess: () => toast.success('Status permintaan berhasil diperbarui'),
        onError: () => toast.error('Gagal memperbarui status permintaan'),
      },
    );
  };

  const handlePurchaseProcess = (_data: PurchaseProcessData): void => {
    void _data;
    if (!uuid || !request) return;
    executeRequest.mutate(
      { uuid, version: request.version },
      {
        onSuccess: () => {
          toast.success('Pengadaan berhasil diproses');
          setPurchaseProcessOpen(false);
        },
        onError: () => toast.error('Gagal memproses pengadaan'),
      },
    );
  };

  const EXECUTE_LABELS: Record<string, string> = {
    APPROVED: 'Proses Pengadaan',
    PURCHASING: 'Tandai Dikirim',
    IN_DELIVERY: 'Tandai Diterima',
    ARRIVED: 'Selesai',
  };

  const openApproveDialog = () => {
    if (!request?.items) return;
    const initial: Record<number, number> = {};
    for (const item of request.items) {
      initial[item.id] = item.quantity;
    }
    setItemAdjustments(initial);
    setApproveNote('');
    setApproveOpen(true);
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

  const isPending =
    request.status === 'PENDING' ||
    request.status === 'LOGISTIC_APPROVED' ||
    request.status === 'AWAITING_CEO_APPROVAL';
  const canApprove =
    isPending &&
    canAny(P.REQUESTS_APPROVE_LOGISTIC, P.REQUESTS_APPROVE_PURCHASE, P.REQUESTS_APPROVE_FINAL);
  const canCancel = request.status === 'PENDING' && can(P.REQUESTS_CANCEL_OWN);
  const executeLabel = EXECUTE_LABELS[request.status];
  const canExecute =
    !!executeLabel && canAny(P.REQUESTS_APPROVE_LOGISTIC, P.REQUESTS_APPROVE_PURCHASE);

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
              <Button
                variant="default"
                onClick={openApproveDialog}
                disabled={approveRequest.isPending}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve
              </Button>
              <Button variant="destructive" onClick={() => setRejectOpen(true)}>
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
            </>
          )}
          {canExecute && (
            <Button variant="default" onClick={handleExecute} disabled={executeRequest.isPending}>
              <ArrowRight className="mr-2 h-4 w-4" />
              {executeRequest.isPending ? 'Memproses...' : executeLabel}
            </Button>
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
                    <TableHead className="text-center">Qty Diminta</TableHead>
                    <TableHead className="text-center">Qty Disetujui</TableHead>
                    <TableHead>Catatan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!request.items?.length ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
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
                        <TableCell className="text-center">
                          {item.approvedQuantity != null ? (
                            <span
                              className={
                                item.approvedQuantity < item.quantity
                                  ? 'font-medium text-amber-600'
                                  : ''
                              }
                            >
                              {item.approvedQuantity}
                            </span>
                          ) : (
                            '-'
                          )}
                        </TableCell>
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
          <ApprovalTimeline steps={request.approvalChain} />
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

      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Approve Permintaan</DialogTitle>
            <DialogDescription>
              Anda dapat menyesuaikan jumlah yang disetujui per item (partial approval).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {request?.items?.map((item) => (
              <div key={item.id} className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.description}</p>
                  <p className="text-xs text-muted-foreground">Diminta: {item.quantity}</p>
                </div>
                <div className="w-24">
                  <Label htmlFor={`qty-${item.id}`} className="sr-only">
                    Qty Disetujui
                  </Label>
                  <Input
                    id={`qty-${item.id}`}
                    type="number"
                    min={0}
                    max={item.quantity}
                    value={itemAdjustments[item.id] ?? item.quantity}
                    onChange={(e) =>
                      setItemAdjustments((prev) => ({
                        ...prev,
                        [item.id]: Math.min(Number(e.target.value), item.quantity),
                      }))
                    }
                  />
                </div>
              </div>
            ))}
            <div>
              <Label htmlFor="approve-note">Catatan (opsional)</Label>
              <Textarea
                id="approve-note"
                value={approveNote}
                onChange={(e) => setApproveNote(e.target.value)}
                placeholder="Catatan approval..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleApprove} disabled={approveRequest.isPending}>
              {approveRequest.isPending ? 'Menyetujui...' : 'Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PurchaseProcessDialog
        open={purchaseProcessOpen}
        onOpenChange={setPurchaseProcessOpen}
        onConfirm={handlePurchaseProcess}
        isPending={executeRequest.isPending}
      />
    </PageContainer>
  );
}

export default RequestDetailPage;
export const Component = RequestDetailPage;
