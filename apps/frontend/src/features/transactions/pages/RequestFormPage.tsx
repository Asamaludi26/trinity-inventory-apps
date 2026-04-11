import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FormInput } from '@/components/form/FormInput';
import { FormSelect } from '@/components/form/FormSelect';
import { FormTextarea } from '@/components/form/FormTextarea';
import { useCreateRequest } from '../hooks';

const requestSchema = z.object({
  title: z.string().min(1, 'Judul wajib diisi').max(200),
  description: z.string().optional(),
  priority: z.string().min(1, 'Prioritas wajib dipilih'),
  allocation: z.string().min(1, 'Alokasi wajib dipilih'),
});

type RequestFormValues = z.infer<typeof requestSchema>;

interface RequestItemInput {
  description: string;
  quantity: number;
  note: string;
}

const PRIORITY_OPTIONS = [
  { value: 'REGULAR', label: 'Regular' },
  { value: 'URGENT', label: 'Urgent' },
  { value: 'PROJECT', label: 'Project' },
];

const ALLOCATION_OPTIONS = [
  { value: 'USAGE', label: 'Penggunaan' },
  { value: 'INVENTORY', label: 'Inventaris' },
];

export function RequestFormPage() {
  const navigate = useNavigate();
  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: { title: '', description: '', priority: '', allocation: '' },
  });

  const [items, setItems] = useState<RequestItemInput[]>([
    { description: '', quantity: 1, note: '' },
  ]);

  const createRequest = useCreateRequest();

  const addItem = () => {
    setItems((prev) => [...prev, { description: '', quantity: 1, note: '' }]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof RequestItemInput, value: string | number) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const onSubmit = (values: RequestFormValues) => {
    const validItems = items.filter((item) => item.description.trim());
    if (validItems.length === 0) {
      toast.error('Minimal 1 item harus diisi');
      return;
    }

    createRequest.mutate(
      { ...values, items: validItems },
      {
        onSuccess: () => {
          toast.success('Permintaan berhasil dibuat');
          navigate('/requests');
        },
        onError: () => toast.error('Gagal membuat permintaan'),
      },
    );
  };

  return (
    <PageContainer
      title="Buat Permintaan Baru"
      description="Ajukan permintaan pengadaan aset"
      actions={
        <Button variant="outline" onClick={() => navigate('/requests')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
      }
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informasi Permintaan</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormInput
              form={form}
              name="title"
              label="Judul Permintaan"
              placeholder="Contoh: Pengadaan Laptop Divisi IT"
              className="md:col-span-2"
            />
            <FormSelect
              form={form}
              name="priority"
              label="Prioritas"
              placeholder="Pilih prioritas"
              options={PRIORITY_OPTIONS}
            />
            <FormSelect
              form={form}
              name="allocation"
              label="Alokasi"
              placeholder="Pilih alokasi"
              options={ALLOCATION_OPTIONS}
            />
            <FormTextarea
              form={form}
              name="description"
              label="Justifikasi / Deskripsi"
              placeholder="Jelaskan alasan pengadaan..."
              className="md:col-span-2"
              rows={4}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Daftar Item</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Item
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 rounded-lg border p-4">
                <span className="mt-2 text-sm font-medium text-muted-foreground">{idx + 1}.</span>
                <div className="grid flex-1 gap-3 md:grid-cols-3">
                  <div className="md:col-span-2">
                    <Label>Deskripsi Item</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(idx, 'description', e.target.value)}
                      placeholder="Nama / deskripsi item"
                    />
                  </div>
                  <div>
                    <Label>Jumlah</Label>
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                    />
                  </div>
                  <div className="md:col-span-3">
                    <Label>Catatan</Label>
                    <Textarea
                      value={item.note}
                      onChange={(e) => updateItem(idx, 'note', e.target.value)}
                      placeholder="Opsional"
                      rows={2}
                    />
                  </div>
                </div>
                {items.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mt-6 text-destructive"
                    onClick={() => removeItem(idx)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/requests')}>
            Batal
          </Button>
          <Button type="submit" disabled={createRequest.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {createRequest.isPending ? 'Mengirim...' : 'Kirim Permintaan'}
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}

export default RequestFormPage;
export const Component = RequestFormPage;
