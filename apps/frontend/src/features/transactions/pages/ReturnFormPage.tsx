import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormInput } from '@/components/form/FormInput';
import { FormTextarea } from '@/components/form/FormTextarea';
import { useCreateReturn } from '../hooks';

const returnSchema = z.object({
  loanCode: z.string().min(1, 'Kode peminjaman wajib diisi'),
  note: z.string().optional(),
});

type ReturnFormValues = z.infer<typeof returnSchema>;

export function ReturnFormPage() {
  const navigate = useNavigate();
  const form = useForm<ReturnFormValues>({
    resolver: zodResolver(returnSchema),
    defaultValues: { loanCode: '', note: '' },
  });

  const createReturn = useCreateReturn();

  const onSubmit = (values: ReturnFormValues) => {
    createReturn.mutate(values, {
      onSuccess: () => {
        toast.success('Pengembalian berhasil dibuat');
        navigate('/returns');
      },
      onError: () => toast.error('Gagal membuat pengembalian'),
    });
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informasi Pengembalian</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormInput
              form={form}
              name="loanCode"
              label="Kode Peminjaman"
              placeholder="Masukkan kode peminjaman (LN-xxx)"
            />
            <FormTextarea
              form={form}
              name="note"
              label="Catatan"
              placeholder="Catatan pengembalian (opsional)"
              className="md:col-span-2"
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/returns')}>
            Batal
          </Button>
          <Button type="submit" disabled={createReturn.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {createReturn.isPending ? 'Mengirim...' : 'Kirim Pengembalian'}
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}

export default ReturnFormPage;
export const Component = ReturnFormPage;
