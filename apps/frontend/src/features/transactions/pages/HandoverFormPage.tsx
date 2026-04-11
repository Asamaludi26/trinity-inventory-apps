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
import { useCreateHandover } from '../hooks';

const handoverSchema = z.object({
  toUserId: z.string().min(1, 'Penerima wajib dipilih'),
  witnessUserId: z.string().optional(),
  note: z.string().optional(),
});

type HandoverFormValues = z.infer<typeof handoverSchema>;

export function HandoverFormPage() {
  const navigate = useNavigate();
  const form = useForm<HandoverFormValues>({
    resolver: zodResolver(handoverSchema),
    defaultValues: { toUserId: '', witnessUserId: '', note: '' },
  });

  const createHandover = useCreateHandover();

  const onSubmit = (values: HandoverFormValues) => {
    createHandover.mutate(
      {
        ...values,
        toUserId: Number(values.toUserId),
        witnessUserId: values.witnessUserId ? Number(values.witnessUserId) : undefined,
      },
      {
        onSuccess: () => {
          toast.success('Serah terima berhasil dibuat');
          navigate('/handovers');
        },
        onError: () => toast.error('Gagal membuat serah terima'),
      },
    );
  };

  return (
    <PageContainer
      title="Buat Serah Terima"
      description="Buat dokumen serah terima aset"
      actions={
        <Button variant="outline" onClick={() => navigate('/handovers')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
      }
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informasi Serah Terima</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormInput
              form={form}
              name="toUserId"
              label="ID Penerima"
              placeholder="ID user penerima"
            />
            <FormInput
              form={form}
              name="witnessUserId"
              label="ID Saksi (opsional)"
              placeholder="ID user saksi"
            />
            <FormTextarea
              form={form}
              name="note"
              label="Catatan"
              placeholder="Catatan serah terima (opsional)"
              className="md:col-span-2"
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/handovers')}>
            Batal
          </Button>
          <Button type="submit" disabled={createHandover.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {createHandover.isPending ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}

export default HandoverFormPage;
export const Component = HandoverFormPage;
