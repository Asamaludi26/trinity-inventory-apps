import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Loader2,
  FileText,
  Package,
  MapPin,
  Paperclip,
  DollarSign,
  TrendingDown,
} from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormInput } from '@/components/form/FormInput';
import { FormSelect } from '@/components/form/FormSelect';
import { AttachmentSection } from '@/components/form';
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
  { value: 'INDIVIDUAL', label: 'Tracking Individual' },
  { value: 'COUNT', label: 'Perhitungan Jumlah' },
  { value: 'MEASUREMENT', label: 'Pengukuran' },
];

const DEPRECIATION_OPTIONS = [
  { value: 'STRAIGHT_LINE', label: 'Garis Lurus' },
  { value: 'DECLINING_BALANCE', label: 'Saldo Menurun' },
];

const RECORDING_SOURCE_OPTIONS = [
  { value: 'MANUAL', label: 'Manual' },
  { value: 'REQUEST', label: 'Dari Request' },
];

export function AssetFormPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { can, canAny } = usePermissions();
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
      macAddress: '',
      classification: 'ASSET',
      trackingMethod: 'INDIVIDUAL',
      quantity: 1,
      currentBalance: 0,
      status: 'IN_STORAGE',
      condition: 'GOOD',
      location: '',
      locationDetail: '',
      locationNote: '',
      recordingSource: 'MANUAL',
      note: '',
    },
  });

  const selectedCategoryId = useWatch({ control: form.control, name: 'categoryId' });
  const selectedTypeId = useWatch({ control: form.control, name: 'typeId' });
  const selectedClassification = useWatch({ control: form.control, name: 'classification' });
  const selectedTracking = useWatch({ control: form.control, name: 'trackingMethod' });

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
        macAddress: existingAsset.macAddress || '',
        purchasePrice: existingAsset.purchasePrice || '',
        purchaseDate: existingAsset.purchaseDate ? existingAsset.purchaseDate.split('T')[0] : '',
        depreciationMethod: existingAsset.depreciationMethod,
        usefulLifeYears: existingAsset.usefulLifeYears || undefined,
        salvageValue: existingAsset.salvageValue || '',
        classification: existingAsset.classification || 'ASSET',
        trackingMethod: existingAsset.trackingMethod || 'INDIVIDUAL',
        quantity: existingAsset.quantity || 1,
        currentBalance: existingAsset.currentBalance ? Number(existingAsset.currentBalance) : 0,
        condition: existingAsset.condition,
        status: existingAsset.status,
        location: existingAsset.location || '',
        locationDetail: existingAsset.locationDetail || '',
        locationNote: existingAsset.locationNote || '',
        recordingSource: existingAsset.recordingSource || 'MANUAL',
        note: existingAsset.note || '',
      });
    }
  }, [isEditMode, existingAsset, form]);

  const onSubmit = async (data: CreateAssetFormData) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- code is auto-generated by backend
      const { code, currentBalance, ...rest } = data;

      // Only include currentBalance for MEASUREMENT tracking
      const payload = {
        ...rest,
        ...(data.trackingMethod === 'MEASUREMENT' ? { currentBalance } : {}),
      };

      if (isEditMode && existingAsset) {
        await updateAsset.mutateAsync({
          id: existingAsset.id,
          version: existingAsset.version,
          data: payload,
        });
        toast.success('Aset berhasil diperbarui');
      } else {
        await createAsset.mutateAsync(payload);
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

  const isIndividual = selectedClassification === 'ASSET' && selectedTracking === 'INDIVIDUAL';
  const isMaterial = selectedClassification === 'MATERIAL';
  const showPurchaseCard = canAny(P.PURCHASES_VIEW, P.PURCHASES_CREATE);
  const showDepreciationCard = canAny(P.DEPRECIATION_VIEW, P.DEPRECIATION_CREATE);

  return (
    <PageContainer
      title={isEditMode ? 'Edit Aset' : 'Pencatatan Aset'}
      description={isEditMode ? 'Ubah informasi aset' : 'Daftarkan aset baru ke sistem inventaris'}
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
        {/* Card 1: Dokumen Pencatatan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="size-5" />
              Dokumen Pencatatan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormInput
                form={form}
                name="code"
                label="Kode Aset"
                placeholder="Otomatis dihasilkan"
                disabled
              />
              <FormSelect
                form={form}
                name="recordingSource"
                label="Sumber Pencatatan"
                options={RECORDING_SOURCE_OPTIONS}
              />
              <FormInput
                form={form}
                name="note"
                label="Catatan Pencatatan"
                placeholder="Catatan opsional"
              />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Informasi Aset */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="size-5" />
              Informasi Aset
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormInput
                form={form}
                name="name"
                label="Nama Aset"
                placeholder="Masukkan nama aset"
              />
              <FormInput
                form={form}
                name="brand"
                label="Merek"
                placeholder="Masukkan merek/brand"
              />
            </div>

            {/* Kategorisasi Hierarchy */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormSelect
                form={form}
                name="categoryId"
                label="Kategori"
                placeholder="Pilih kategori"
                options={
                  categories?.map((cat) => ({ value: cat.id.toString(), label: cat.name })) || []
                }
              />
              <FormSelect
                form={form}
                name="typeId"
                label="Tipe"
                placeholder={selectedCategoryId ? 'Pilih tipe' : 'Pilih kategori dulu'}
                options={
                  types?.map((type) => ({ value: type.id.toString(), label: type.name })) || []
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

            {/* Klasifikasi & Tracking */}
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
              <FormSelect form={form} name="status" label="Status" options={STATUS_OPTIONS} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormSelect
                form={form}
                name="condition"
                label="Kondisi"
                options={CONDITION_OPTIONS}
              />
              {isMaterial && <FormInput form={form} name="quantity" label="Jumlah" type="number" />}
              {isMaterial && selectedTracking === 'MEASUREMENT' && (
                <FormInput form={form} name="currentBalance" label="Saldo Awal" type="number" />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Detail Aset (Individual) */}
        {isIndividual && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Detail Aset Individual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormInput
                  form={form}
                  name="serialNumber"
                  label="Nomor Seri (S/N)"
                  placeholder="Opsional"
                />
                <FormInput
                  form={form}
                  name="macAddress"
                  label="MAC Address"
                  placeholder="XX:XX:XX:XX:XX:XX"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Card 4: Informasi Pembelian (khusus SA & AP) */}
        {showPurchaseCard && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="size-5" />
                Informasi Pembelian
              </CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        )}

        {/* Card 5: Informasi Penyusutan (khusus SA & AF, individual only) */}
        {showDepreciationCard && isIndividual && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingDown className="size-5" />
                Informasi Penyusutan
              </CardTitle>
            </CardHeader>
            <CardContent>
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
                  label="Masa Manfaat (Tahun)"
                  type="number"
                />
                <FormInput
                  form={form}
                  name="salvageValue"
                  label="Nilai Sisa (Rp)"
                  placeholder="0"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Card 6: Lokasi */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="size-5" />
              Informasi Lokasi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormInput
                form={form}
                name="location"
                label="Lokasi Fisik"
                placeholder="Gudang Utama, Gedung A, dll."
              />
              <FormInput
                form={form}
                name="locationDetail"
                label="Detail Lokasi"
                placeholder="Rak 3, Lantai 2, dll."
              />
            </div>
            <div className="mt-4">
              <FormInput
                form={form}
                name="locationNote"
                label="Catatan Lokasi"
                placeholder="Catatan tambahan lokasi"
              />
            </div>
          </CardContent>
        </Card>

        {/* Card 7: Lampiran (only on edit mode with existing ID) */}
        {isEditMode && id && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Paperclip className="size-5" />
                Lampiran
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AttachmentSection entityType="Asset" entityId={id} />
            </CardContent>
          </Card>
        )}

        {/* Submit Buttons */}
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
            {isEditMode ? 'Perbarui Aset' : 'Catat Aset'}
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}

export default AssetFormPage;
export const Component = AssetFormPage;
