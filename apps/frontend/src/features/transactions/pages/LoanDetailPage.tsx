import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Ban, Play, Package } from 'lucide-react';
import { toast } from 'sonner';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
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
  useLoan,
  useApproveLoan,
  useRejectLoan,
  useCancelLoan,
  useAssignLoanAssets,
  useExecuteLoan,
} from '../hooks';
import { RejectDialog } from '../components';
import { AttachmentSection } from '@/components/form';
import { usePermissions } from '@/hooks';
import { P } from '@/config/permissions';
import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types';

function formatDate(date: string | null) {
  if (!date) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}

interface AvailableAsset {
  id: string;
  code: string;
  name: string;
  status: string;
}

export function LoanDetailPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { data: loan, isLoading } = useLoan(uuid);
  const approveLoan = useApproveLoan();
  const rejectLoan = useRejectLoan();
  const cancelLoan = useCancelLoan();
  const assignAssets = useAssignLoanAssets();
  const executeLoan = useExecuteLoan();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [availableAssets, setAvailableAssets] = useState<AvailableAsset[]>([]);
  const [assetSearch, setAssetSearch] = useState('');
  const [loadingAssets, setLoadingAssets] = useState(false);
  const { can } = usePermissions();

  const handleApprove = () => {
    if (!uuid || !loan) return;
    approveLoan.mutate(
      { uuid, version: loan.version },
      {
        onSuccess: () => toast.success('Peminjaman berhasil disetujui'),
        onError: () => toast.error('Gagal menyetujui peminjaman'),
      },
    );
  };

  const handleReject = (reason: string) => {
    if (!uuid || !loan) return;
    rejectLoan.mutate(
      { uuid, version: loan.version, reason },
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
    if (!uuid || !loan) return;
    cancelLoan.mutate(
      { uuid, version: loan.version },
      {
        onSuccess: () => toast.success('Peminjaman berhasil dibatalkan'),
        onError: () => toast.error('Gagal membatalkan peminjaman'),
      },
    );
  };

  const handleOpenAssign = async () => {
    setLoadingAssets(true);
    try {
      const res = await api.get<ApiResponse<{ data: AvailableAsset[] }>>('/assets', {
        params: { status: 'IN_STORAGE', limit: 100 },
      });
      const assets = res.data.data?.data ?? [];
      setAvailableAssets(assets);
      setSelectedAssetIds(loan?.assetAssignments?.map((a) => a.assetId) ?? []);
      setAssignOpen(true);
    } catch {
      toast.error('Gagal memuat daftar aset');
    } finally {
      setLoadingAssets(false);
    }
  };

  const handleAssign = () => {
    if (!uuid || !loan || selectedAssetIds.length === 0) return;
    assignAssets.mutate(
      { uuid, assetIds: selectedAssetIds, version: loan.version },
      {
        onSuccess: () => {
          toast.success('Aset berhasil di-assign');
          setAssignOpen(false);
        },
        onError: () => toast.error('Gagal assign aset'),
      },
    );
  };

  const handleExecute = () => {
    if (!uuid || !loan) return;
    executeLoan.mutate(
      { uuid, version: loan.version },
      {
        onSuccess: () => toast.success('Peminjaman berhasil dieksekusi'),
        onError: () => toast.error('Gagal mengeksekusi peminjaman'),
      },
    );
  };

  const toggleAsset = (assetId: string) => {
    setSelectedAssetIds((prev) =>
      prev.includes(assetId) ? prev.filter((id) => id !== assetId) : [...prev, assetId],
    );
  };

  const filteredAssets = availableAssets.filter(
    (a) =>
      a.code.toLowerCase().includes(assetSearch.toLowerCase()) ||
      a.name.toLowerCase().includes(assetSearch.toLowerCase()),
  );

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

  const isPending = loan.status === 'PENDING' || loan.status === 'LOGISTIC_APPROVED';
  const canApprove = isPending && can(P.LOAN_REQUESTS_APPROVE);
  const canCancel = loan.status === 'PENDING' && can(P.LOAN_REQUESTS_CREATE);
  const canAssign =
    (loan.status === 'APPROVED' || loan.status === 'LOGISTIC_APPROVED') &&
    can(P.LOAN_REQUESTS_APPROVE);
  const canExecute =
    loan.status === 'APPROVED' &&
    (loan.assetAssignments?.length ?? 0) > 0 &&
    can(P.LOAN_REQUESTS_APPROVE);

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
          {canApprove && (
            <>
              <Button variant="default" onClick={handleApprove} disabled={approveLoan.isPending}>
                <CheckCircle className="mr-2 h-4 w-4" />
                {approveLoan.isPending ? 'Menyetujui...' : 'Approve'}
              </Button>
              <Button variant="destructive" onClick={() => setRejectOpen(true)}>
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
            </>
          )}
          {canAssign && (
            <Button variant="outline" onClick={handleOpenAssign} disabled={loadingAssets}>
              <Package className="mr-2 h-4 w-4" />
              {loadingAssets ? 'Memuat...' : 'Assign Aset'}
            </Button>
          )}
          {canExecute && (
            <Button variant="default" onClick={handleExecute} disabled={executeLoan.isPending}>
              <Play className="mr-2 h-4 w-4" />
              {executeLoan.isPending ? 'Eksekusi...' : 'Eksekusi Peminjaman'}
            </Button>
          )}
          {canCancel && (
            <Button variant="outline" onClick={handleCancel} disabled={cancelLoan.isPending}>
              <Ban className="mr-2 h-4 w-4" />
              {cancelLoan.isPending ? 'Membatalkan...' : 'Batalkan'}
            </Button>
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

      {/* Asset Assignments Section */}
      {loan.assetAssignments && loan.assetAssignments.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">
              Aset yang Di-assign ({loan.assetAssignments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Kode Aset</TableHead>
                    <TableHead>Nama Aset</TableHead>
                    <TableHead>Tanggal Assign</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loan.assetAssignments.map((assignment, idx) => (
                    <TableRow key={assignment.id}>
                      <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {assignment.asset?.code ?? '-'}
                      </TableCell>
                      <TableCell>{assignment.asset?.name ?? '-'}</TableCell>
                      <TableCell className="text-sm">{formatDate(assignment.assignedAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <RejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        onConfirm={handleReject}
        isPending={rejectLoan.isPending}
        title="Tolak Peminjaman"
      />

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign Aset ke Peminjaman</DialogTitle>
            <DialogDescription>
              Pilih aset yang tersedia (IN_STORAGE) untuk di-assign ke peminjaman ini.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="asset-search" className="sr-only">
                Cari aset
              </Label>
              <Input
                id="asset-search"
                placeholder="Cari kode atau nama aset..."
                value={assetSearch}
                onChange={(e) => setAssetSearch(e.target.value)}
              />
            </div>
            <div className="max-h-64 overflow-y-auto rounded-lg border">
              {filteredAssets.length === 0 ? (
                <p className="p-4 text-center text-sm text-muted-foreground">
                  Tidak ada aset tersedia
                </p>
              ) : (
                filteredAssets.map((asset) => (
                  <label
                    key={asset.id}
                    className="flex cursor-pointer items-center gap-3 border-b p-3 last:border-b-0 hover:bg-muted/50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedAssetIds.includes(asset.id)}
                      onChange={() => toggleAsset(asset.id)}
                      className="size-4 rounded border-input"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{asset.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">{asset.code}</p>
                    </div>
                  </label>
                ))
              )}
            </div>
            <p className="text-sm text-muted-foreground">{selectedAssetIds.length} aset dipilih</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleAssign}
              disabled={assignAssets.isPending || selectedAssetIds.length === 0}
            >
              {assignAssets.isPending ? 'Menyimpan...' : 'Assign Aset'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
export const Component = LoanDetailPage;
