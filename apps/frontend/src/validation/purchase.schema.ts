import { z } from 'zod';

/**
 * Purchase Master Data Schema
 * Tracks purchase information for depreciation calculation
 */
export const createPurchaseSchema = z.object({
  modelId: z.number().int().positive('Model wajib dipilih'),
  supplier: z.string().min(1, 'Nama supplier wajib diisi').max(100),
  unitPrice: z
    .string()
    .refine(
      (val) => !Number.isNaN(Number(val)) && Number(val) > 0,
      'Harga satuan wajib berupa angka positif',
    ),
  quantity: z.number().int().positive('Jumlah minimal 1'),
  totalPrice: z
    .string()
    .refine(
      (val) => !Number.isNaN(Number(val)) && Number(val) > 0,
      'Total harga wajib berupa angka positif',
    ),
  purchaseDate: z.string().datetime('Tanggal pembelian tidak valid'),
  warrantyMonths: z.number().int().nonnegative('Garansi tidak boleh negatif').optional().nullable(),
  invoiceNumber: z.string().max(50).optional().nullable(),
  note: z.string().max(500).optional().nullable(),
});

export type CreatePurchaseFormData = z.infer<typeof createPurchaseSchema>;

/**
 * Update Purchase Schema
 */
export const updatePurchaseSchema = z.object({
  supplier: z.string().min(1, 'Nama supplier wajib diisi').max(100).optional(),
  unitPrice: z
    .string()
    .refine(
      (val) => !Number.isNaN(Number(val)) && Number(val) > 0,
      'Harga satuan wajib berupa angka positif',
    )
    .optional(),
  quantity: z.number().int().positive('Jumlah minimal 1').optional(),
  totalPrice: z
    .string()
    .refine(
      (val) => !Number.isNaN(Number(val)) && Number(val) > 0,
      'Total harga wajib berupa angka positif',
    )
    .optional(),
  purchaseDate: z.string().datetime('Tanggal pembelian tidak valid').optional(),
  warrantyMonths: z.number().int().nonnegative('Garansi tidak boleh negatif').optional().nullable(),
  invoiceNumber: z.string().max(50).optional().nullable(),
  note: z.string().max(500).optional().nullable(),
});

export type UpdatePurchaseFormData = z.infer<typeof updatePurchaseSchema>;

/**
 * Purchase Filter schema
 */
export const purchaseFilterSchema = z.object({
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().optional(),
  search: z.string().optional(),
  modelId: z.number().int().optional(),
  supplierId: z.number().int().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type PurchaseFilterData = z.infer<typeof purchaseFilterSchema>;
