import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormInput } from '@/components/form/FormInput';
import { FormSelect } from '@/components/form/FormSelect';
import { FormTextarea } from '@/components/form/FormTextarea';
import { useCategories, useTypes, useModels, useCreateAsset } from '../hooks';

const assetSchema = z.object({
  name: z.string().min(1, 'Nama aset wajib diisi').max(200),
  categoryId: z.string().min(1, 'Kategori wajib dipilih'),
  typeId: z.string().optional(),
  modelId: z.string().optional(),
  brand: z.string().min(1, 'Brand wajib diisi'),
  serialNumber: z.string().optional(),
  condition: z.string().min(1, 'Kondisi wajib dipilih'),
  note: z.string().optional(),
});

type AssetFormValues = z.infer<typeof assetSchema>;

const CONDITION_OPTIONS = [
  { value: 'NEW', label: 'Baru' },
  { value: 'GOOD', label: 'Baik' },
  { value: 'FAIR', label: 'Cukup' },
  { value: 'POOR', label: 'Buruk' },
  { value: 'BROKEN', label: 'Rusak' },
];

export function AssetFormPage() {
  const navigate = useNavigate();
  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetSchema),
    defaultValues: { name: '', brand: '', serialNumber: '', note: '' },
  });

  const selectedCategoryId = useWatch({ control: form.control, name: 'categoryId' });
  const selectedTypeId = useWatch({ control: form.control, name: 'typeId' });

  const { data: categories } = useCategories();
  const { data: types } = useTypes(selectedCategoryId ? Number(selectedCategoryId) : undefined);
  const { data: models } = useModels(selectedTypeId ? Number(selectedTypeId) : undefined);
  const createAsset = useCreateAsset();

  const onSubmit = (values: AssetFormValues) => {
    createAsset.mutate(
      {
        ...values,
        categoryId: Number(values.categoryId),
        typeId: values.typeId ? Number(values.typeId) : undefined,
        modelId: values.modelId ? Number(values.modelId) : undefined,
      },
      {
        onSuccess: () => {
          toast.success('Aset berhasil dicatat');
          navigate('/assets');
        },
        onError: () => toast.error('Gagal mencatat aset'),
      },
    );
  };

  return (
    <PageContainer
      title="Catat Aset Baru"
      description="Isi formulir untuk mencatat aset inventaris baru"
      actions={
        <Button variant="outline" onClick={() => navigate('/assets')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
      }
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informasi Aset</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormInput form={form} name="name" label="Nama Aset" placeholder="Masukkan nama aset" />
            <FormInput form={form} name="brand" label="Brand" placeholder="Masukkan brand" />
            <FormSelect
              form={form}
              name="categoryId"
              label="Kategori"
              placeholder="Pilih kategori"
              options={categories?.map((c) => ({ value: String(c.id), label: c.name })) ?? []}
            />
            <FormSelect
              form={form}
              name="typeId"
              label="Tipe"
              placeholder="Pilih tipe"
              options={types?.map((t) => ({ value: String(t.id), label: t.name })) ?? []}
              disabled={!selectedCategoryId}
            />
            <FormSelect
              form={form}
              name="modelId"
              label="Model"
              placeholder="Pilih model"
              options={models?.map((m) => ({ value: String(m.id), label: m.name })) ?? []}
              disabled={!selectedTypeId}
            />
            <FormInput
              form={form}
              name="serialNumber"
              label="Serial Number"
              placeholder="Masukkan S/N (opsional)"
            />
            <FormSelect
              form={form}
              name="condition"
              label="Kondisi"
              placeholder="Pilih kondisi"
              options={CONDITION_OPTIONS}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Catatan</CardTitle>
          </CardHeader>
          <CardContent>
            <FormTextarea
              form={form}
              name="note"
              label="Catatan Tambahan"
              placeholder="Catatan tambahan (opsional)"
              rows={4}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/assets')}>
            Batal
          </Button>
          <Button type="submit" disabled={createAsset.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {createAsset.isPending ? 'Menyimpan...' : 'Simpan Aset'}
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}

export default AssetFormPage;
export const Component = AssetFormPage;
