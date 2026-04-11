import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormInput } from '@/components/form/FormInput';
import { FormSelect } from '@/components/form/FormSelect';
import { useCreateUser } from '../hooks';
import { useActiveDivisions } from '../hooks';
import { createUserSchema, type CreateUserFormData } from '@/validation/settings.schema';

const ROLE_OPTIONS = [
  { value: 'SUPERADMIN', label: 'Super Admin' },
  { value: 'ADMIN_LOGISTIK', label: 'Admin Logistik' },
  { value: 'ADMIN_PURCHASE', label: 'Admin Purchase' },
  { value: 'LEADER', label: 'Leader' },
  { value: 'STAFF', label: 'Staff' },
];

export function UserFormPage() {
  const navigate = useNavigate();
  const form = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      employeeId: '',
      fullName: '',
      email: '',
      password: '',
      role: undefined,
      divisionId: undefined,
      phone: '',
    },
  });

  const createUser = useCreateUser();
  const { data: divisions } = useActiveDivisions();

  const divisionOptions = (divisions ?? []).map((d) => ({
    value: String(d.id),
    label: `${d.code} — ${d.name}`,
  }));

  const onSubmit = (values: CreateUserFormData) => {
    createUser.mutate(values, {
      onSuccess: () => {
        toast.success('Akun berhasil ditambahkan');
        navigate('/settings/users-divisions?tab=users');
      },
      onError: () => toast.error('Gagal menambahkan akun'),
    });
  };

  return (
    <PageContainer
      title="Tambah Akun"
      description="Buat akun pengguna baru"
      actions={
        <Button variant="outline" onClick={() => navigate('/settings/users-divisions?tab=users')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
      }
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informasi Akun</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormInput form={form} name="employeeId" label="ID Karyawan" placeholder="EMP-001" />
            <FormInput
              form={form}
              name="fullName"
              label="Nama Lengkap"
              placeholder="Nama lengkap"
            />
            <FormInput
              form={form}
              name="email"
              label="Email"
              type="email"
              placeholder="email@domain.id"
            />
            <FormInput form={form} name="phone" label="Telepon" placeholder="08xxxx" />
            <FormInput
              form={form}
              name="password"
              label="Password"
              type="password"
              placeholder="Minimal 8 karakter"
            />
            <FormSelect
              form={form}
              name="role"
              label="Role"
              options={ROLE_OPTIONS}
              placeholder="Pilih role"
            />
            <FormSelect
              form={form}
              name="divisionId"
              label="Divisi"
              options={divisionOptions}
              placeholder="Pilih divisi"
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={createUser.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {createUser.isPending ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}

export default UserFormPage;
export const Component = UserFormPage;
