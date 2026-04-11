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
import { useCreateMaintenance } from '../hooks';

const maintenanceSchema = z.object({
  customerId: z.string().min(1, 'Pelanggan wajib dipilih'),
  scheduledAt: z.string().min(1, 'Jadwal wajib diisi'),
  issueReport: z.string().optional(),
  note: z.string().optional(),
});

type MaintenanceFormValues = z.infer<typeof maintenanceSchema>;

export function MaintenanceFormPage() {
  const navigate = useNavigate();
  const form = useForm<MaintenanceFormValues>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: { customerId: '', scheduledAt: '', issueReport: '', note: '' },
  });

  const createMaintenance = useCreateMaintenance();

  const onSubmit = (values: MaintenanceFormValues) => {
    createMaintenance.mutate(
      { ...values, customerId: Number(values.customerId) },
      {
        onSuccess: () => {
          toast.success('Pemeliharaan berhasil dijadwalkan');
          navigate('/maintenance');
        },
        onError: () => toast.error('Gagal menjadwalkan pemeliharaan'),
      },
    );
  };

  return (
    <PageContainer
      title="Jadwalkan Pemeliharaan"
      description="Buat jadwal pemeliharaan baru"
      actions={
        <Button variant="outline" onClick={() => navigate('/maintenance')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
      }
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Detail Pemeliharaan</CardTitle>
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
              name="issueReport"
              label="Laporan Masalah"
              placeholder="Deskripsikan masalah..."
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
          <Button type="button" variant="outline" onClick={() => navigate('/maintenance')}>
            Batal
          </Button>
          <Button type="submit" disabled={createMaintenance.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {createMaintenance.isPending ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}

export default MaintenanceFormPage;
export const Component = MaintenanceFormPage;
