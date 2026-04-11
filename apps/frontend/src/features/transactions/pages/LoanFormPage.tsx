import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormInput } from '@/components/form/FormInput';
import { FormTextarea } from '@/components/form/FormTextarea';
import { useCreateLoan } from '../hooks';

const loanSchema = z.object({
  purpose: z.string().min(1, 'Tujuan peminjaman wajib diisi'),
  expectedReturn: z.string().min(1, 'Tanggal estimasi kembali wajib diisi'),
  note: z.string().optional(),
});

type LoanFormValues = z.infer<typeof loanSchema>;

interface LoanItemInput {
  description: string;
  quantity: number;
}

export function LoanFormPage() {
  const navigate = useNavigate();
  const form = useForm<LoanFormValues>({
    resolver: zodResolver(loanSchema),
    defaultValues: { purpose: '', expectedReturn: '', note: '' },
  });

  const [items, setItems] = useState<LoanItemInput[]>([{ description: '', quantity: 1 }]);

  const createLoan = useCreateLoan();

  const addItem = () => setItems((prev) => [...prev, { description: '', quantity: 1 }]);
  const removeItem = (index: number) => setItems((prev) => prev.filter((_, i) => i !== index));
  const updateItem = (index: number, field: keyof LoanItemInput, value: string | number) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const onSubmit = (values: LoanFormValues) => {
    const validItems = items.filter((item) => item.description.trim());
    if (validItems.length === 0) {
      toast.error('Minimal 1 item harus diisi');
      return;
    }

    createLoan.mutate(
      { ...values, items: validItems },
      {
        onSuccess: () => {
          toast.success('Peminjaman berhasil dibuat');
          navigate('/loans');
        },
        onError: () => toast.error('Gagal membuat peminjaman'),
      },
    );
  };

  return (
    <PageContainer
      title="Buat Peminjaman Baru"
      description="Ajukan peminjaman aset"
      actions={
        <Button variant="outline" onClick={() => navigate('/loans')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
      }
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informasi Peminjaman</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormTextarea
              form={form}
              name="purpose"
              label="Tujuan Peminjaman"
              placeholder="Jelaskan tujuan peminjaman..."
              className="md:col-span-2"
            />
            <FormInput
              form={form}
              name="expectedReturn"
              label="Estimasi Tanggal Kembali"
              type="date"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Daftar Item</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Item
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-end gap-3 rounded-lg border p-4">
                <span className="mb-2 text-sm font-medium text-muted-foreground">{idx + 1}.</span>
                <div className="flex-1">
                  <Label>Deskripsi Item</Label>
                  <Input
                    value={item.description}
                    onChange={(e) => updateItem(idx, 'description', e.target.value)}
                    placeholder="Nama / deskripsi item"
                  />
                </div>
                <div className="w-24">
                  <Label>Jumlah</Label>
                  <Input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                  />
                </div>
                {items.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => removeItem(idx)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/loans')}>
            Batal
          </Button>
          <Button type="submit" disabled={createLoan.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {createLoan.isPending ? 'Mengirim...' : 'Kirim Peminjaman'}
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}

export default LoanFormPage;
export const Component = LoanFormPage;
