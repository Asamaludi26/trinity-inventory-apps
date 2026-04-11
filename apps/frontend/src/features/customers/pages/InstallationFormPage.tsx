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
import { useCreateInstallation } from '../hooks';

const installationSchema = z.object({
  customerId: z.string().min(1, 'Pelanggan wajib dipilih'),
  location: z.string().optional(),
  scheduledAt: z.string().min(1, 'Jadwal wajib diisi'),
  note: z.string().optional(),
});

type InstallationFormValues = z.infer<typeof installationSchema>;

export function InstallationFormPage() {
  const navigate = useNavigate();
  const form = useForm<InstallationFormValues>({
    resolver: zodResolver(installationSchema),
    defaultValues: { customerId: '', location: '', scheduledAt: '', note: '' },
  });

  const createInstallation = useCreateInstallation();

  const onSubmit = (values: InstallationFormValues) => {
    createInstallation.mutate(
      { ...values, customerId: Number(values.customerId) },
      {
        onSuccess: () => {
          toast.success('Instalasi berhasil dijadwalkan');
          navigate('/installation');
        },
        onError: () => toast.error('Gagal menjadwalkan instalasi'),
      },
    );
  };

  return (
    <PageContainer
      title="Jadwalkan Instalasi"
      description="Buat jadwal instalasi baru"
      actions={
        <Button variant="outline" onClick={() => navigate('/installation')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
      }
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Detail Instalasi</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormInput
              form={form}
              name="customerId"
              label="ID Pelanggan"
              placeholder="ID pelanggan"
            />
            <FormInput form={form} name="location" label="Lokasi" placeholder="Lokasi instalasi" />
            <FormInput form={form} name="scheduledAt" label="Jadwal" type="date" />
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
          <Button type="button" variant="outline" onClick={() => navigate('/installation')}>
            Batal
          </Button>
          <Button type="submit" disabled={createInstallation.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {createInstallation.isPending ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}

export default InstallationFormPage;
export const Component = InstallationFormPage;
