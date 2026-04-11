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
import { useCreateDismantle } from '../hooks';

const dismantleSchema = z.object({
  customerId: z.string().min(1, 'Pelanggan wajib dipilih'),
  scheduledAt: z.string().min(1, 'Jadwal wajib diisi'),
  reason: z.string().min(1, 'Alasan pembongkaran wajib diisi'),
  note: z.string().optional(),
});

type DismantleFormValues = z.infer<typeof dismantleSchema>;

export function DismantleFormPage() {
  const navigate = useNavigate();
  const form = useForm<DismantleFormValues>({
    resolver: zodResolver(dismantleSchema),
    defaultValues: { customerId: '', scheduledAt: '', reason: '', note: '' },
  });

  const createDismantle = useCreateDismantle();

  const onSubmit = (values: DismantleFormValues) => {
    createDismantle.mutate(
      { ...values, customerId: Number(values.customerId) },
      {
        onSuccess: () => {
          toast.success('Pembongkaran berhasil dijadwalkan');
          navigate('/dismantles');
        },
        onError: () => toast.error('Gagal menjadwalkan pembongkaran'),
      },
    );
  };

  return (
    <PageContainer
      title="Jadwalkan Pembongkaran"
      description="Buat jadwal pembongkaran baru"
      actions={
        <Button variant="outline" onClick={() => navigate('/dismantles')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
      }
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Detail Pembongkaran</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormInput
              form={form}
              name="customerId"
              label="ID Pelanggan"
              placeholder="ID pelanggan"
            />
            <FormInput form={form} name="scheduledAt" label="Jadwal" type="date" />
            <FormTextarea
              form={form}
              name="reason"
              label="Alasan Pembongkaran"
              placeholder="Jelaskan alasan pembongkaran..."
              className="md:col-span-2"
              rows={4}
            />
            <FormTextarea
              form={form}
              name="note"
              label="Catatan"
              placeholder="Opsional"
              className="md:col-span-2"
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/dismantles')}>
            Batal
          </Button>
          <Button type="submit" disabled={createDismantle.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {createDismantle.isPending ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}

export default DismantleFormPage;
export const Component = DismantleFormPage;
