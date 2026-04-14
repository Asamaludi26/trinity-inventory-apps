import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormInput } from '@/components/form/FormInput';
import { FormSelect } from '@/components/form/FormSelect';
import { createAssetSchema, type CreateAssetFormData } from '@/validation/asset.schema';
import {
  useCategories,
  useTypes,
  useModels,
  useCreateAsset,
  useUpdateAsset,
  useAsset,
} from '../hooks';
import { usePermissions } from '@/hooks/use-permissions';
import { P } from '@/config/permissions';

const CONDITION_OPTIONS = [
  { value: 'NEW', label: 'Baru' },
  { value: 'GOOD', label: 'Baik' },
  { value: 'FAIR', label: 'Cukup' },
  { value: 'POOR', label: 'Buruk' },
  { value: 'BROKEN', label: 'Rusak' },
];

const STATUS_OPTIONS = [
  { value: 'IN_STORAGE', label: 'Di Gudang' },
  { value: 'IN_USE', label: 'Digunakan' },
  { value: 'IN_CUSTODY', label: 'Dipinjam' },
  { value: 'UNDER_REPAIR', label: 'Perbaikan' },
  { value: 'DAMAGED', label: 'Rusak' },
  { value: 'LOST', label: 'Hilang' },
  { value: 'DECOMMISSIONED', label: 'Didekomisikan' },
];

const CLASSIFICATION_OPTIONS = [
  { value: 'ASSET', label: 'Aset Individual' },
  { value: 'MATERIAL', label: 'Material (Konsumtif)' },
];

const TRACKING_OPTIONS = [
  { value: 'INDIVIDUAL', label: 'Tracking Individuah' },
  { value: 'COUNT', label: 'Perhitungan Jumlah' },
  { value: 'MEASUREMENT', label: 'Pengukuran' },
];

const DEPRECIATION_OPTIONS = [
  { value: 'STRAIGHT_LINE', label: 'Garis Lurus' },
  { value: 'DECLINING_BALANCE', label: 'Saldo Menurun' },
];

export function AssetFormPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const isEditMode = !!id;

  if (isEditMode && !can(P.ASSETS_EDIT)) {
    toast.error('Anda tidak memiliki izin untuk mengubah aset');
    navigate('/assets');
  }

  const form = useForm<CreateAssetFormData>({
    resolver: zodResolver(createAssetSchema),
    defaultValues: {
      code: '',
      name: '',
      brand: '',
      serialNumber: '',
      classification: 'ASSET',
      trackingMethod: 'INDIVIDUAL',
      quantity: 1,
      currentBalance: 0,
      status: 'IN_STORAGE',
      condition: 'GOOD',
    },
  });

  const selectedCategoryId = useWatch({ control: form.control, name: 'categoryId' });
  const selectedTypeId = useWatch({ control: form.control, name: 'typeId' });
  const selectedClassification = useWatch({ control: form.control, name: 'classification' });

  const { data: existingAsset, isLoading: isLoadingAsset } = useAsset(isEditMode ? id : undefined);
  const { data: categories, isLoading: isLoadingCategories } = useCategories();
  const { data: types } = useTypes(
    selectedCategoryId && selectedCategoryId > 0 ? selectedCategoryId : undefined,
  );
  const { data: models } = useModels(
    selectedTypeId && selectedTypeId > 0 ? selectedTypeId : undefined,
  );

  const createAsset = useCreateAsset();
  const updateAsset = useUpdateAsset();

  // Populate form with existing asset data
  useEffect(() => {
    if (isEditMode && existingAsset) {
      form.reset({
        code: existingAsset.code || '',
        name: existingAsset.name || '',
        categoryId: existingAsset.categoryId,
        typeId: existingAsset.typeId || undefined,
        modelId: existingAsset.modelId || undefined,
        brand: existingAsset.brand || '',
        serialNumber: existingAsset.serialNumber || '',
        purchasePrice: existingAsset.purchasePrice || '',
        purchaseDate: existingAsset.purchaseDate ? existingAsset.purchaseDate.split('T')[0] : '',
        depreciationMethod: existingAsset.depreciationMethod,
        usefulLifeYears: existingAsset.usefulLifeYears || undefined,
        salvageValue: existingAsset.salvageValue || '',
        condition: existingAsset.condition,
        status: existingAsset.status,
      });
    }
  }, [isEditMode, existingAsset, form]);

  const onSubmit = async (data: CreateAssetFormData) => {
    try {
      if (isEditMode && existingAsset) {
        await updateAsset.mutateAsync({
          id: existingAsset.id,
          version: existingAsset.version,
          data: {
            ...data,
            categoryId: Number(data.categoryId),
            typeId: data.typeId ? Number(data.typeId) : null,
            modelId: data.modelId ? Number(data.modelId) : null,
          },
        });
        toast.success('Aset berhasil diperbarui');
      } else {
        await createAsset.mutateAsync({
          ...data,
          categoryId: Number(data.categoryId),
          typeId: data.typeId ? Number(data.typeId) : null,
          modelId: data.modelId ? Number(data.modelId) : null,
        });
        toast.success('Aset berhasil dibuat');
      }
      navigate('/assets');
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(axiosError.response?.data?.message || 'Terjadi kesalahan');
    }
  };

  const isLoading =
    isLoadingAsset || isLoadingCategories || createAsset.isPending || updateAsset.isPending;

  return (
    <PageContainer
      title={isEditMode ? 'Edit Aset' : 'Tambah Aset'}
      description={isEditMode ? 'Ubah informasi aset' : 'Daftarkan aset baru'}
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/assets')}
          disabled={isLoading}
        >
          <ArrowLeft className="size-4" />
          Kembali
        </Button>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>{isEditMode ? 'Edit' : 'Form'} Data Aset</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Identitas Aset */}
            <div className="space-y-4">
              <h3 className="font-semibold">Identitas Aset</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormInput
                  form={form}
                  name="code"
                  label="Kode Aset"
                  placeholder="Otomatis dihasilkan"
                  disabled
                />
                <FormInput
                  form={form}
                  name="name"
                  label="Nama Aset"
                  placeholder="Masukkan nama aset"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormInput
                  form={form}
                  name="brand"
                  label="Merek"
                  placeholder="Masukkan merek/brand"
                />
                <FormInput
                  form={form}
                  name="serialNumber"
                  label="Nomor Seri"
                  placeholder="Opsional"
                />
              </div>
            </div>

            {/* Kategorisasi */}
            <div className="space-y-4">
              <h3 className="font-semibold">Kategorisasi (Hierarchy)</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <FormSelect
                  form={form}
                  name="categoryId"
                  label="Kategori"
                  placeholder="Pilih kategori"
                  options={
                    categories?.map((cat) => ({
                      value: cat.id.toString(),
                      label: cat.name,
                    })) || []
                  }
                />

                <FormSelect
                  form={form}
                  name="typeId"
                  label="Tipe"
                  placeholder={selectedCategoryId ? 'Pilih tipe' : 'Pilih kategori dulu'}
                  options={
                    types?.map((type) => ({
                      value: type.id.toString(),
                      label: type.name,
                    })) || []
                  }
                  disabled={!selectedCategoryId}
                />

                <FormSelect
                  form={form}
                  name="modelId"
                  label="Model"
                  placeholder={selectedTypeId ? 'Pilih model' : 'Pilih tipe dulu'}
                  options={
                    models?.map((model) => ({
                      value: model.id.toString(),
                      label: `${model.name} (${model.brand})`,
                    })) || []
                  }
                  disabled={!selectedTypeId}
                />
              </div>
            </div>

            {/* Klasifikasi & Tracking */}
            <div className="space-y-4">
              <h3 className="font-semibold">Klasifikasi & Tracking</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <FormSelect
                  form={form}
                  name="classification"
                  label="Klasifikasi"
                  options={CLASSIFICATION_OPTIONS}
                />

                <FormSelect
                  form={form}
                  name="trackingMethod"
                  label="Metode Tracking"
                  options={TRACKING_OPTIONS}
                />

                <FormInput form={form} name="quantity" label="Jumlah" type="number" />
              </div>

              {selectedClassification === 'MATERIAL' && (
                <FormInput form={form} name="currentBalance" label="Saldo Awal" type="number" />
              )}
            </div>

            {/* Status & Kondisi */}
            <div className="space-y-4">
              <h3 className="font-semibold">Status & Kondisi</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormSelect form={form} name="status" label="Status" options={STATUS_OPTIONS} />

                <FormSelect
                  form={form}
                  name="condition"
                  label="Kondisi"
                  options={CONDITION_OPTIONS}
                />
              </div>
            </div>

            {/* Pembelian & Penyusutan */}
            <div className="space-y-4">
              <h3 className="font-semibold">Pembelian & Penyusutan</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormInput
                  form={form}
                  name="purchasePrice"
                  label="Harga Pembelian (Rp)"
                  placeholder="0"
                />

                <FormInput
                  form={form}
                  name="purchaseDate"
                  label="Tanggal Pembelian"
                  type="datetime-local"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <FormSelect
                  form={form}
                  name="depreciationMethod"
                  label="Metode Penyusutan"
                  options={DEPRECIATION_OPTIONS}
                />

                <FormInput
                  form={form}
                  name="usefulLifeYears"
                  label="Tahun Masa Hidup"
                  type="number"
                />

                <FormInput
                  form={form}
                  name="salvageValue"
                  label="Nilai Sisa (Rp)"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-2 border-t pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/assets')}
                disabled={isLoading}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
                {isEditMode ? 'Perbarui Aset' : 'Buat Aset'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </PageContainer>
  );
}

export default AssetFormPage;
export const Component = AssetFormPage;
