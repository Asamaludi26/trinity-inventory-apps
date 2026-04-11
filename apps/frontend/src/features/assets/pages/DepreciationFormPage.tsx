import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormInput } from '@/components/form/FormInput';
import { FormSelect } from '@/components/form/FormSelect';
import { useCreateDepreciation } from '../hooks';

const depreciationSchema = z.object({
  method: z.string().min(1, 'Metode depresiasi wajib dipilih'),
  usefulLifeYears: z.string().min(1, 'Masa manfaat wajib diisi'),
  salvageValue: z.string().min(1, 'Nilai sisa wajib diisi'),
  startDate: z.string().min(1, 'Tanggal mulai wajib diisi'),
});

type DepreciationFormValues = z.infer<typeof depreciationSchema>;

const METHOD_OPTIONS = [
  { value: 'STRAIGHT_LINE', label: 'Garis Lurus (Straight Line)' },
  { value: 'DECLINING_BALANCE', label: 'Saldo Menurun (Declining Balance)' },
];

export function DepreciationFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const purchaseUuid = searchParams.get('purchaseUuid');

  const form = useForm<DepreciationFormValues>({
    resolver: zodResolver(depreciationSchema),
    defaultValues: { method: '', usefulLifeYears: '', salvageValue: '', startDate: '' },
  });

  const createDepreciation = useCreateDepreciation();

  const onSubmit = (values: DepreciationFormValues) => {
    createDepreciation.mutate(
      {
        ...values,
        purchaseId: purchaseUuid ?? undefined,
        usefulLifeYears: Number(values.usefulLifeYears),
        salvageValue: Number(values.salvageValue),
      },
      {
        onSuccess: () => {
          toast.success('Data depresiasi berhasil disimpan');
          navigate('/assets/depreciation');
        },
        onError: () => toast.error('Gagal menyimpan data depresiasi'),
      },
    );
  };

  return (
    <PageContainer
      title="Tambah Data Depresiasi"
      description="Isi parameter depresiasi untuk data pembelian"
      actions={
        <Button variant="outline" onClick={() => navigate('/assets/depreciation')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
      }
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Parameter Depresiasi</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormSelect
              form={form}
              name="method"
              label="Metode Depresiasi"
              placeholder="Pilih metode"
              options={METHOD_OPTIONS}
            />
            <FormInput
              form={form}
              name="usefulLifeYears"
              label="Masa Manfaat (tahun)"
              placeholder="Contoh: 5"
              type="number"
            />
            <FormInput
              form={form}
              name="salvageValue"
              label="Nilai Sisa (Rp)"
              placeholder="0"
              type="number"
            />
            <FormInput form={form} name="startDate" label="Tanggal Mulai" type="date" />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/assets/depreciation')}>
            Batal
          </Button>
          <Button type="submit" disabled={createDepreciation.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {createDepreciation.isPending ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}

export default DepreciationFormPage;
export const Component = DepreciationFormPage;
