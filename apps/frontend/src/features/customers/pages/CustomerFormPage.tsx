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
import { useCreateCustomer } from '../hooks';

const customerSchema = z.object({
  name: z.string().min(1, 'Nama pelanggan wajib diisi').max(200),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email tidak valid').optional().or(z.literal('')),
  picName: z.string().optional(),
  picPhone: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

export function CustomerFormPage() {
  const navigate = useNavigate();
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: { name: '', address: '', phone: '', email: '', picName: '', picPhone: '' },
  });

  const createCustomer = useCreateCustomer();

  const onSubmit = (values: CustomerFormValues) => {
    createCustomer.mutate(values, {
      onSuccess: () => {
        toast.success('Pelanggan berhasil ditambahkan');
        navigate('/customers');
      },
      onError: () => toast.error('Gagal menambahkan pelanggan'),
    });
  };

  return (
    <PageContainer
      title="Tambah Pelanggan"
      description="Tambah data pelanggan baru"
      actions={
        <Button variant="outline" onClick={() => navigate('/customers')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
      }
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informasi Pelanggan</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormInput
              form={form}
              name="name"
              label="Nama Pelanggan"
              placeholder="Nama perusahaan/individu"
              className="md:col-span-2"
            />
            <FormInput form={form} name="phone" label="Telepon" placeholder="08xxxx" />
            <FormInput form={form} name="email" label="Email" placeholder="email@domain.id" />
            <FormTextarea
              form={form}
              name="address"
              label="Alamat"
              placeholder="Alamat lengkap"
              className="md:col-span-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Kontak PIC</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormInput form={form} name="picName" label="Nama PIC" placeholder="Nama kontak" />
            <FormInput form={form} name="picPhone" label="Telepon PIC" placeholder="08xxxx" />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/customers')}>
            Batal
          </Button>
          <Button type="submit" disabled={createCustomer.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {createCustomer.isPending ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}

export default CustomerFormPage;
export const Component = CustomerFormPage;
