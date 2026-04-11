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
import { useCreateRepair } from '../hooks';

const repairSchema = z.object({
  assetCode: z.string().min(1, 'Kode aset wajib diisi'),
  issueDescription: z.string().min(1, 'Deskripsi masalah wajib diisi'),
  note: z.string().optional(),
});

type RepairFormValues = z.infer<typeof repairSchema>;

export function RepairFormPage() {
  const navigate = useNavigate();
  const form = useForm<RepairFormValues>({
    resolver: zodResolver(repairSchema),
    defaultValues: { assetCode: '', issueDescription: '', note: '' },
  });

  const createRepair = useCreateRepair();

  const onSubmit = (values: RepairFormValues) => {
    createRepair.mutate(values, {
      onSuccess: () => {
        toast.success('Laporan kerusakan berhasil dibuat');
        navigate('/repairs');
      },
      onError: () => toast.error('Gagal membuat laporan'),
    });
  };

  return (
    <PageContainer
      title="Lapor Kerusakan Aset"
      description="Laporkan aset yang mengalami kerusakan"
      actions={
        <Button variant="outline" onClick={() => navigate('/repairs')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
      }
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Detail Kerusakan</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormInput
              form={form}
              name="assetCode"
              label="Kode Aset"
              placeholder="Masukkan kode aset"
            />
            <FormTextarea
              form={form}
              name="issueDescription"
              label="Deskripsi Kerusakan"
              placeholder="Jelaskan kerusakan yang terjadi..."
              className="md:col-span-2"
              rows={4}
            />
            <FormTextarea
              form={form}
              name="note"
              label="Catatan Tambahan"
              placeholder="Opsional"
              className="md:col-span-2"
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/repairs')}>
            Batal
          </Button>
          <Button type="submit" disabled={createRepair.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {createRepair.isPending ? 'Mengirim...' : 'Kirim Laporan'}
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}

export default RepairFormPage;
export const Component = RepairFormPage;
