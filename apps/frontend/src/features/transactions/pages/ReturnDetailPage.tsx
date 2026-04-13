import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Play } from 'lucide-react';
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
import { useReturn, useApproveReturn, useRejectReturn, useExecuteReturn } from '../hooks';
import { RejectDialog } from '../components';
import { AttachmentSection } from '@/components/form';
import { usePermissions } from '@/hooks';
import { P } from '@/config/permissions';

const CONDITION_LABELS: Record<string, string> = {
  NEW: 'Baru',
  GOOD: 'Baik',
  FAIR: 'Cukup',
  POOR: 'Buruk',
  BROKEN: 'Rusak',
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}

export function ReturnDetailPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { data: ret, isLoading } = useReturn(uuid);
  const approveReturn = useApproveReturn();
  const rejectReturn = useRejectReturn();
  const executeReturn = useExecuteReturn();
  const [rejectOpen, setRejectOpen] = useState(false);
  const { can } = usePermissions();

  const handleVerify = () => {
    if (!uuid || !ret) return;
    approveReturn.mutate(
      { uuid, version: ret.version },
      {
        onSuccess: () => toast.success('Pengembalian berhasil diverifikasi'),
        onError: () => toast.error('Gagal memverifikasi pengembalian'),
      },
    );
  };

  const handleReject = (reason: string) => {
    if (!uuid || !ret) return;
    rejectReturn.mutate(
      { uuid, version: ret.version, reason },
      {
        onSuccess: () => {
          toast.success('Pengembalian berhasil ditolak');
          setRejectOpen(false);
        },
        onError: () => toast.error('Gagal menolak pengembalian'),
      },
    );
  };

  const handleExecute = () => {
    if (!uuid || !ret) return;
    executeReturn.mutate(
      { uuid, version: ret.version },
      {
        onSuccess: () => toast.success('Pengembalian berhasil diselesaikan'),
        onError: () => toast.error('Gagal menyelesaikan pengembalian'),
      },
    );
  };

  if (isLoading) {
    return (
      <PageContainer title="Detail Pengembalian" description="Memuat data...">
        <Card>
          <CardContent className="space-y-3 pt-6">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  if (!ret) {
    return (
      <PageContainer title="Pengembalian Tidak Ditemukan">
        <Button variant="outline" onClick={() => navigate('/returns')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Daftar
        </Button>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={`Pengembalian ${ret.code}`}
      description={`Peminjaman: ${ret.loanRequest?.code ?? '-'}`}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/returns')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
          {ret.status === 'PENDING' && can(P.RETURNS_APPROVE) && (
            <>
              <Button variant="default" onClick={handleVerify} disabled={approveReturn.isPending}>
                <CheckCircle className="mr-2 h-4 w-4" />
                {approveReturn.isPending ? 'Memverifikasi...' : 'Verifikasi'}
              </Button>
              <Button variant="destructive" onClick={() => setRejectOpen(true)}>
                <XCircle className="mr-2 h-4 w-4" />
                Tolak
              </Button>
            </>
          )}
          {ret.status === 'APPROVED' && can(P.RETURNS_APPROVE) && (
            <Button variant="default" onClick={handleExecute} disabled={executeReturn.isPending}>
              <Play className="mr-2 h-4 w-4" />
              {executeReturn.isPending ? 'Memproses...' : 'Eksekusi'}
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informasi Pengembalian</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Kode</span>
                <span className="font-mono text-sm">{ret.code}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <StatusBadge status={ret.status} />
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Catatan</span>
                <span className="text-sm">{ret.note || '-'}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Tanggal</span>
                <span className="text-sm">{formatDate(ret.createdAt)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pengembalian Oleh</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Nama</span>
                <span className="text-sm font-medium">{ret.createdBy?.fullName ?? '-'}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Email</span>
                <span className="text-sm">{ret.createdBy?.email ?? '-'}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Daftar Aset Dikembalikan ({ret.items?.length ?? 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>ID Aset</TableHead>
                    <TableHead>Kondisi Sebelum</TableHead>
                    <TableHead>Kondisi Sesudah</TableHead>
                    <TableHead>Catatan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!ret.items?.length ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Tidak ada item
                      </TableCell>
                    </TableRow>
                  ) : (
                    ret.items.map((item, idx) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell className="font-mono text-xs">{item.assetId}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {CONDITION_LABELS[item.conditionBefore] ?? item.conditionBefore}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {CONDITION_LABELS[item.conditionAfter] ?? item.conditionAfter}
                          </Badge>
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

        {/* Lampiran */}
        <AttachmentSection entityType="AssetReturn" entityId={uuid} />
      </div>

      <RejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        onConfirm={handleReject}
        isPending={rejectReturn.isPending}
        title="Tolak Pengembalian"
      />
    </PageContainer>
  );
}

export default ReturnDetailPage;
export const Component = ReturnDetailPage;
