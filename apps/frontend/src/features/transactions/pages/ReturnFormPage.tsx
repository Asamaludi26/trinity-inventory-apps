import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, Search } from 'lucide-react';
import { toast } from 'sonner';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCreateReturn } from '../hooks';
import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types';
import type { LoanRequest } from '../types';

const CONDITIONS = [
  { value: 'NEW', label: 'Baru' },
  { value: 'GOOD', label: 'Baik' },
  { value: 'FAIR', label: 'Cukup' },
  { value: 'POOR', label: 'Buruk' },
  { value: 'BROKEN', label: 'Rusak' },
] as const;

interface ReturnItemState {
  assetId: string;
  assetCode: string;
  assetName: string;
  conditionBefore: string;
  conditionAfter: string;
  note: string;
}

export function ReturnFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loanCode, setLoanCode] = useState(searchParams.get('loanCode') ?? '');
  const [loan, setLoan] = useState<LoanRequest | null>(null);
  const [items, setItems] = useState<ReturnItemState[]>([]);
  const [note, setNote] = useState('');
  const [searching, setSearching] = useState(false);
  const createReturn = useCreateReturn();

  const searchLoan = async () => {
    if (!loanCode.trim()) return;
    setSearching(true);
    try {
      const res = await api.get<ApiResponse<{ data: LoanRequest[] }>>('/loans', {
        params: { search: loanCode.trim(), limit: 1 },
      });
      const loans = res.data.data?.data ?? [];
      const found = loans[0];
      if (!found) {
        toast.error('Peminjaman tidak ditemukan');
        return;
      }
      if (found.status !== 'IN_PROGRESS') {
        toast.error('Hanya peminjaman yang sedang berjalan yang dapat dikembalikan');
        return;
      }
      // Fetch detail to get asset assignments
      const detailRes = await api.get<ApiResponse<LoanRequest>>(`/loans/${found.id}`);
      const detail = detailRes.data.data;
      setLoan(detail);
      setItems(
        (detail.assetAssignments ?? []).map((a) => ({
          assetId: a.assetId,
          assetCode: a.asset?.code ?? a.assetId,
          assetName: a.asset?.name ?? '-',
          conditionBefore: 'GOOD',
          conditionAfter: 'GOOD',
          note: '',
        })),
      );
    } catch {
      toast.error('Gagal mencari peminjaman');
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    if (searchParams.get('loanCode')) {
      searchLoan();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateItem = (index: number, field: keyof ReturnItemState, value: string) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const onSubmit = () => {
    if (!loan) return;
    if (items.length === 0) {
      toast.error('Tidak ada aset untuk dikembalikan');
      return;
    }
    createReturn.mutate(
      {
        loanRequestId: loan.id,
        note: note || undefined,
        items: items.map((item) => ({
          assetId: item.assetId,
          conditionBefore: item.conditionBefore,
          conditionAfter: item.conditionAfter,
          note: item.note || undefined,
        })),
      },
      {
        onSuccess: () => {
          toast.success('Pengembalian berhasil dibuat');
          navigate('/returns');
        },
        onError: () => toast.error('Gagal membuat pengembalian'),
      },
    );
  };

  return (
    <PageContainer
      title="Buat Pengembalian"
      description="Ajukan pengembalian aset yang dipinjam"
      actions={
        <Button variant="outline" onClick={() => navigate('/returns')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Lookup Loan */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cari Peminjaman</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="loan-code" className="sr-only">
                  Kode Peminjaman
                </Label>
                <Input
                  id="loan-code"
                  placeholder="Masukkan kode peminjaman (LN-xxx)"
                  value={loanCode}
                  onChange={(e) => setLoanCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchLoan()}
                />
              </div>
              <Button onClick={searchLoan} disabled={searching || !loanCode.trim()}>
                <Search className="mr-2 h-4 w-4" />
                {searching ? 'Mencari...' : 'Cari'}
              </Button>
            </div>
            {loan && (
              <div className="mt-4 rounded-lg border p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Kode</span>
                  <span className="font-mono">{loan.code}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tujuan</span>
                  <span>{loan.purpose}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Peminjam</span>
                  <span>{loan.createdBy?.fullName ?? '-'}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Condition Assessment per Asset */}
        {items.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Kondisi Aset ({items.length} item)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Kode Aset</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Kondisi Sebelum</TableHead>
                      <TableHead>Kondisi Setelah</TableHead>
                      <TableHead>Catatan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, idx) => (
                      <TableRow key={item.assetId}>
                        <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell className="font-mono text-xs">{item.assetCode}</TableCell>
                        <TableCell className="text-sm">{item.assetName}</TableCell>
                        <TableCell>
                          <Select
                            value={item.conditionBefore}
                            onValueChange={(v) => updateItem(idx, 'conditionBefore', v)}
                          >
                            <SelectTrigger className="w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CONDITIONS.map((c) => (
                                <SelectItem key={c.value} value={c.value}>
                                  {c.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={item.conditionAfter}
                            onValueChange={(v) => updateItem(idx, 'conditionAfter', v)}
                          >
                            <SelectTrigger className="w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CONDITIONS.map((c) => (
                                <SelectItem key={c.value} value={c.value}>
                                  {c.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            placeholder="Catatan..."
                            value={item.note}
                            onChange={(e) => updateItem(idx, 'note', e.target.value)}
                            className="w-40"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* General Note */}
        {loan && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Catatan</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Catatan pengembalian (opsional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </CardContent>
          </Card>
        )}

        {/* Submit */}
        {loan && (
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => navigate('/returns')}>
              Batal
            </Button>
            <Button onClick={onSubmit} disabled={createReturn.isPending || items.length === 0}>
              <Save className="mr-2 h-4 w-4" />
              {createReturn.isPending ? 'Mengirim...' : 'Kirim Pengembalian'}
            </Button>
          </div>
        )}
      </div>
    </PageContainer>
  );
}

export default ReturnFormPage;
export const Component = ReturnFormPage;
