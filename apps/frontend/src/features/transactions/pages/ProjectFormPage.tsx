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
import { useCreateProject } from '../hooks';

const projectSchema = z.object({
  name: z.string().min(1, 'Nama proyek wajib diisi').max(200),
  description: z.string().optional(),
  location: z.string().optional(),
  startDate: z.string().min(1, 'Tanggal mulai wajib diisi'),
  endDate: z.string().optional(),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

export function ProjectFormPage() {
  const navigate = useNavigate();
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: { name: '', description: '', location: '', startDate: '', endDate: '' },
  });

  const createProject = useCreateProject();

  const onSubmit = (values: ProjectFormValues) => {
    createProject.mutate(values, {
      onSuccess: () => {
        toast.success('Proyek berhasil dibuat');
        navigate('/projects');
      },
      onError: () => toast.error('Gagal membuat proyek'),
    });
  };

  return (
    <PageContainer
      title="Buat Proyek Baru"
      description="Buat proyek infrastruktur baru"
      actions={
        <Button variant="outline" onClick={() => navigate('/projects')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
      }
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informasi Proyek</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormInput
              form={form}
              name="name"
              label="Nama Proyek"
              placeholder="Contoh: Instalasi Jaringan Gedung A"
              className="md:col-span-2"
            />
            <FormInput form={form} name="location" label="Lokasi" placeholder="Opsional" />
            <FormInput form={form} name="startDate" label="Tanggal Mulai" type="date" />
            <FormInput form={form} name="endDate" label="Tanggal Selesai (estimasi)" type="date" />
            <FormTextarea
              form={form}
              name="description"
              label="Deskripsi"
              placeholder="Deskripsi proyek..."
              className="md:col-span-2"
              rows={4}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/projects')}>
            Batal
          </Button>
          <Button type="submit" disabled={createProject.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {createProject.isPending ? 'Menyimpan...' : 'Simpan Proyek'}
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}

export default ProjectFormPage;
export const Component = ProjectFormPage;
