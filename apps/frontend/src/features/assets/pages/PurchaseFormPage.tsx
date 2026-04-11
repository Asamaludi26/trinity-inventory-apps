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
import { FormTextarea } from '@/components/form/FormTextarea';
import { useCreatePurchase } from '../hooks';

const purchaseSchema = z.object({
  supplier: z.string().min(1, 'Supplier wajib diisi'),
  unitPrice: z.string().min(1, 'Harga satuan wajib diisi'),
  quantity: z.string().min(1, 'Jumlah wajib diisi'),
  purchaseDate: z.string().min(1, 'Tanggal pembelian wajib diisi'),
  warrantyMonths: z.string().optional(),
  invoiceNumber: z.string().optional(),
  note: z.string().optional(),
});

type PurchaseFormValues = z.infer<typeof purchaseSchema>;

export function PurchaseFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const modelId = searchParams.get('modelId');

  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: { supplier: '', unitPrice: '', quantity: '1', note: '' },
  });

  const createPurchase = useCreatePurchase();

  const onSubmit = (values: PurchaseFormValues) => {
    createPurchase.mutate(
      {
        ...values,
        modelId: modelId ? Number(modelId) : undefined,
        unitPrice: Number(values.unitPrice),
        quantity: Number(values.quantity),
        warrantyMonths: values.warrantyMonths ? Number(values.warrantyMonths) : undefined,
      },
      {
        onSuccess: () => {
          toast.success('Data pembelian berhasil disimpan');
          navigate('/assets/purchases');
        },
        onError: () => toast.error('Gagal menyimpan data pembelian'),
      },
    );
  };

  return (
    <PageContainer
      title="Tambah Data Pembelian"
      description="Isi formulir data pembelian aset"
      actions={
        <Button variant="outline" onClick={() => navigate('/assets/purchases')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
      }
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informasi Pembelian</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormInput form={form} name="supplier" label="Supplier" placeholder="Nama supplier" />
            <FormInput
              form={form}
              name="unitPrice"
              label="Harga Satuan (Rp)"
              placeholder="0"
              type="number"
            />
            <FormInput
              form={form}
              name="quantity"
              label="Jumlah Unit"
              placeholder="1"
              type="number"
            />
            <FormInput form={form} name="purchaseDate" label="Tanggal Pembelian" type="date" />
            <FormInput
              form={form}
              name="warrantyMonths"
              label="Masa Garansi (bulan)"
              placeholder="Opsional"
              type="number"
            />
            <FormInput
              form={form}
              name="invoiceNumber"
              label="Nomor Invoice"
              placeholder="Opsional"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Catatan</CardTitle>
          </CardHeader>
          <CardContent>
            <FormTextarea form={form} name="note" label="Catatan" placeholder="Opsional" />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/assets/purchases')}>
            Batal
          </Button>
          <Button type="submit" disabled={createPurchase.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {createPurchase.isPending ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}

export default PurchaseFormPage;
export const Component = PurchaseFormPage;
