import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Ban } from 'lucide-react';
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
import { useLoan, useApproveLoan, useRejectLoan, useCancelLoan } from '../hooks';
import { RejectDialog } from '../components';
import { AttachmentSection } from '@/components/form';

function formatDate(date: string | null) {
  if (!date) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}

export function LoanDetailPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { data: loan, isLoading } = useLoan(uuid);
  const approveLoan = useApproveLoan();
  const rejectLoan = useRejectLoan();
  const cancelLoan = useCancelLoan();
  const [rejectOpen, setRejectOpen] = useState(false);

  const handleApprove = () => {
    if (!uuid) return;
    approveLoan.mutate(
      { uuid },
      {
        onSuccess: () => toast.success('Peminjaman berhasil disetujui'),
        onError: () => toast.error('Gagal menyetujui peminjaman'),
      },
    );
  };

  const handleReject = (reason: string) => {
    if (!uuid) return;
    rejectLoan.mutate(
      { uuid, reason },
      {
        onSuccess: () => {
          toast.success('Peminjaman berhasil ditolak');
          setRejectOpen(false);
        },
        onError: () => toast.error('Gagal menolak peminjaman'),
      },
    );
  };

  const handleCancel = () => {
    if (!uuid) return;
    cancelLoan.mutate(uuid, {
      onSuccess: () => toast.success('Peminjaman berhasil dibatalkan'),
      onError: () => toast.error('Gagal membatalkan peminjaman'),
    });
  };

  if (isLoading) {
    return (
      <PageContainer title="Detail Peminjaman" description="Memuat data...">
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
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

  if (!loan) {
    return (
      <PageContainer title="Peminjaman Tidak Ditemukan">
        <Button variant="outline" onClick={() => navigate('/loans')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Daftar
        </Button>
      </PageContainer>
    );
  }

  const isPending = loan.status === 'PENDING';

  return (
    <PageContainer
      title={`Peminjaman ${loan.code}`}
      description={loan.purpose}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/loans')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
          {isPending && (
            <>
              <Button variant="default" onClick={handleApprove} disabled={approveLoan.isPending}>
                <CheckCircle className="mr-2 h-4 w-4" />
                {approveLoan.isPending ? 'Menyetujui...' : 'Approve'}
              </Button>
              <Button variant="destructive" onClick={() => setRejectOpen(true)}>
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
              <Button variant="outline" onClick={handleCancel} disabled={cancelLoan.isPending}>
                <Ban className="mr-2 h-4 w-4" />
                {cancelLoan.isPending ? 'Membatalkan...' : 'Batalkan'}
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
              <CardTitle className="text-lg">Informasi Peminjaman</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Kode</span>
                <span className="font-mono text-sm">{loan.code}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <StatusBadge status={loan.status} />
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Tujuan</span>
                <span className="text-sm">{loan.purpose}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Estimasi Kembali</span>
                <span className="text-sm">{formatDate(loan.expectedReturn)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Peminjam</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Nama</span>
                <span className="text-sm font-medium">{loan.createdBy?.fullName ?? '-'}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Email</span>
                <span className="text-sm">{loan.createdBy?.email ?? '-'}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Tanggal</span>
                <span className="text-sm">{formatDate(loan.createdAt)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Daftar Item */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Daftar Item ({loan.items?.length ?? 0})</CardTitle>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!loan.items?.length ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        Tidak ada item
                      </TableCell>
                    </TableRow>
                  ) : (
                    loan.items.map((item, idx) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell className="font-medium">{item.description}</TableCell>
                        <TableCell>{item.model?.name ?? '-'}</TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Lampiran */}
        <AttachmentSection entityType="LoanRequest" entityId={uuid} />
      </div>

      <RejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        onConfirm={handleReject}
        isPending={rejectLoan.isPending}
        title="Tolak Peminjaman"
      />
    </PageContainer>
  );
}
export const Component = LoanDetailPage;
