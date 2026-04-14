import { z } from 'zod';

/**
 * Asset Creation & Update Schema
 * Supports both ASSET (individual tracking) and MATERIAL (count-based) classifications
 */
export const createAssetSchema = z.object({
  code: z.string().min(1, 'Kode aset wajib diisi'),
  name: z.string().min(1, 'Nama aset wajib diisi'),
  categoryId: z.number().int().positive('Kategori wajib dipilih'),
  typeId: z.number().int().positive('Tipe wajib dipilih').nullable(),
  modelId: z.number().int().positive('Model wajib dipilih').nullable(),
  brand: z.string().min(1, 'Merek wajib diisi'),
  serialNumber: z.string().optional().nullable(),
  purchasePrice: z
    .string()
    .optional()
    .nullable()
    .refine((val) => {
      if (!val) return true;
      return !Number.isNaN(Number(val)) && Number(val) >= 0;
    }, 'Harga pembelian harus angka positif'),
  purchaseDate: z.string().datetime().optional().nullable(),
  depreciationMethod: z.enum(['STRAIGHT_LINE', 'DECLINING_BALANCE']).optional().nullable(),
  usefulLifeYears: z
    .number()
    .int()
    .positive('Tahun masa hidup harus positif')
    .optional()
    .nullable(),
  salvageValue: z
    .string()
    .optional()
    .nullable()
    .refine((val) => {
      if (!val) return true;
      return !Number.isNaN(Number(val)) && Number(val) >= 0;
    }, 'Nilai sisa harus angka positif'),
  classification: z.enum(['ASSET', 'MATERIAL']),
  trackingMethod: z.enum(['INDIVIDUAL', 'COUNT', 'MEASUREMENT']),
  quantity: z.number().int().positive('Jumlah harus positif'),
  currentBalance: z.number().int().nonnegative('Saldo awal tidak boleh negatif'),
  status: z.enum([
    'IN_STORAGE',
    'IN_USE',
    'IN_CUSTODY',
    'UNDER_REPAIR',
    'OUT_FOR_REPAIR',
    'DAMAGED',
    'LOST',
    'DECOMMISSIONED',
    'CONSUMED',
  ]),
  condition: z.enum(['NEW', 'GOOD', 'FAIR', 'POOR', 'BROKEN']),
  currentUserId: z.number().int().optional().nullable(),
});

export type CreateAssetFormData = z.infer<typeof createAssetSchema>;

/**
 * Batch Asset Registration
 * Register multiple assets with same model at once
 */
export const batchAssetSchema = z.object({
  modelId: z.number().int().positive('Model wajib dipilih'),
  quantity: z.number().int().positive('Jumlah minimal 1'),
  serialNumbers: z.array(z.string().min(1, 'Nomor seri tidak boleh kosong')).min(1),
  purchasePrice: z
    .string()
    .optional()
    .nullable()
    .refine((val) => {
      if (!val) return true;
      return !Number.isNaN(Number(val)) && Number(val) >= 0;
    }, 'Harga wajib berupa angka positif'),
  purchaseDate: z.string().datetime().optional().nullable(),
  status: z.enum([
    'IN_STORAGE',
    'IN_USE',
    'IN_CUSTODY',
    'UNDER_REPAIR',
    'OUT_FOR_REPAIR',
    'DAMAGED',
    'LOST',
    'DECOMMISSIONED',
    'CONSUMED',
  ]),
  condition: z.enum(['NEW', 'GOOD', 'FAIR', 'POOR', 'BROKEN']),
});

export type BatchAssetFormData = z.infer<typeof batchAssetSchema>;

/**
 * Asset Category Schema
 */
export const categorySchema = z.object({
  name: z.string().min(1, 'Nama kategori wajib diisi').max(100),
});

export type CategoryFormData = z.infer<typeof categorySchema>;

/**
 * Asset Type Schema
 */
export const assetTypeSchema = z.object({
  categoryId: z.number().int().positive('Kategori wajib dipilih'),
  name: z.string().min(1, 'Nama tipe wajib diisi').max(100),
});

export type AssetTypeFormData = z.infer<typeof assetTypeSchema>;

/**
 * Asset Model Schema
 */
export const assetModelSchema = z.object({
  typeId: z.number().int().positive('Tipe wajib dipilih'),
  name: z.string().min(1, 'Nama model wajib diisi').max(100),
  brand: z.string().min(1, 'Merek wajib diisi').max(100),
});

export type AssetModelFormData = z.infer<typeof assetModelSchema>;

/**
 * Stock Threshold Schema
 */
export const stockThresholdSchema = z.object({
  modelId: z.number().int().positive('Model wajib dipilih'),
  minQuantity: z.number().int().nonnegative('Ambang batas minimal harus non-negatif'),
});

export type StockThresholdFormData = z.infer<typeof stockThresholdSchema>;
