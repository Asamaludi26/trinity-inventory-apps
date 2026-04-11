import { z } from 'zod';

// ================================
// Asset Schemas
// ================================

export const createAssetSchema = z.object({
  name: z.string().min(1, 'Nama aset wajib diisi').max(255),
  categoryId: z.coerce.number({ required_error: 'Kategori wajib dipilih' }),
  typeId: z.coerce.number().optional(),
  modelId: z.coerce.number().optional(),
  brand: z.string().min(1, 'Brand wajib diisi').max(255),
  serialNumber: z.string().max(255).optional(),
  condition: z.enum(['NEW', 'GOOD', 'FAIR', 'POOR', 'BROKEN'], {
    required_error: 'Kondisi wajib dipilih',
  }),
});

export const updateAssetSchema = createAssetSchema.partial();

// ================================
// Category Schemas
// ================================

export const categorySchema = z.object({
  name: z.string().min(1, 'Nama kategori wajib diisi').max(255),
});

// ================================
// Type Schemas
// ================================

export const typeSchema = z.object({
  categoryId: z.coerce.number({ required_error: 'Kategori wajib dipilih' }),
  name: z.string().min(1, 'Nama tipe wajib diisi').max(255),
});

// ================================
// Model Schemas
// ================================

export const modelSchema = z.object({
  typeId: z.coerce.number({ required_error: 'Tipe wajib dipilih' }),
  name: z.string().min(1, 'Nama model wajib diisi').max(255),
  brand: z.string().min(1, 'Brand wajib diisi').max(255),
});

// ================================
// Purchase Schemas
// ================================

export const purchaseSchema = z.object({
  modelId: z.coerce.number({ required_error: 'Model aset wajib dipilih' }),
  supplier: z.string().min(1, 'Supplier wajib diisi').max(255),
  unitPrice: z.coerce.number().positive('Harga satuan harus positif'),
  quantity: z.coerce.number().int().positive('Jumlah harus positif'),
  purchaseDate: z.string().min(1, 'Tanggal pembelian wajib diisi'),
  warrantyMonths: z.coerce.number().int().nonnegative().optional(),
  invoiceNumber: z.string().max(100).optional(),
  note: z.string().optional(),
});

// ================================
// Depreciation Schemas
// ================================

export const depreciationSchema = z.object({
  purchaseId: z.string().min(1, 'Data pembelian wajib dipilih'),
  method: z.enum(['STRAIGHT_LINE', 'DECLINING_BALANCE'], {
    required_error: 'Metode depresiasi wajib dipilih',
  }),
  usefulLifeYears: z.coerce.number().int().positive('Masa manfaat harus positif'),
  salvageValue: z.coerce.number().nonnegative('Nilai sisa tidak boleh negatif'),
  startDate: z.string().min(1, 'Tanggal mulai wajib diisi'),
});

// ================================
// Inferred Types
// ================================

export type CreateAssetFormData = z.infer<typeof createAssetSchema>;
export type UpdateAssetFormData = z.infer<typeof updateAssetSchema>;
export type CategoryFormData = z.infer<typeof categorySchema>;
export type TypeFormData = z.infer<typeof typeSchema>;
export type ModelFormData = z.infer<typeof modelSchema>;
export type PurchaseFormData = z.infer<typeof purchaseSchema>;
export type DepreciationFormData = z.infer<typeof depreciationSchema>;
