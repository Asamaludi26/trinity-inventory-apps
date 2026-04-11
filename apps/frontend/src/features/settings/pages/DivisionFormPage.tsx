import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormInput } from '@/components/form/FormInput';
import { FormTextarea } from '@/components/form/FormTextarea';
import { useCreateDivision } from '../hooks';
import { createDivisionSchema, type CreateDivisionFormData } from '@/validation/settings.schema';
import { Label } from '@/components/ui/label';
import { Controller } from 'react-hook-form';

export function DivisionFormPage() {
  const navigate = useNavigate();
  const form = useForm<CreateDivisionFormData>({
    resolver: zodResolver(createDivisionSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      canDoFieldwork: false,
    },
  });

  const createDivision = useCreateDivision();

  const onSubmit = (values: CreateDivisionFormData) => {
    createDivision.mutate(values, {
      onSuccess: () => {
        toast.success('Divisi berhasil ditambahkan');
        navigate('/settings/users-divisions?tab=divisions');
      },
      onError: () => toast.error('Gagal menambahkan divisi'),
    });
  };

  return (
    <PageContainer
      title="Tambah Divisi"
      description="Buat divisi baru"
      actions={
        <Button
          variant="outline"
          onClick={() => navigate('/settings/users-divisions?tab=divisions')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
      }
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informasi Divisi</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormInput form={form} name="name" label="Nama Divisi" placeholder="Nama divisi" />
            <FormInput
              form={form}
              name="code"
              label="Kode Divisi"
              placeholder="KODE (huruf kapital)"
            />
            <FormTextarea
              form={form}
              name="description"
              label="Deskripsi"
              placeholder="Deskripsi divisi (opsional)"
              className="md:col-span-2"
            />
            <div className="flex items-center gap-2">
              <Controller
                control={form.control}
                name="canDoFieldwork"
                render={({ field }) => (
                  <input
                    type="checkbox"
                    id="canDoFieldwork"
                    checked={field.value}
                    onChange={field.onChange}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                )}
              />
              <Label htmlFor="canDoFieldwork">Dapat melakukan pekerjaan lapangan</Label>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={createDivision.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {createDivision.isPending ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}

export default DivisionFormPage;
export const Component = DivisionFormPage;
