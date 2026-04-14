import { z } from 'zod';

/**
 * Depreciation Schema
 * Straight-line: D = (Cost - Salvage) / Useful Life
 * Declining-balance: D = Remaining Value * Rate (where Rate = 2 / Useful Life)
 */
export const createDepreciationSchema = z.object({
  assetId: z.string().min(1, 'Aset wajib dipilih'),
  method: z.enum(['STRAIGHT_LINE', 'DECLINING_BALANCE']),
  acquiredPrice: z
    .string()
    .refine(
      (val) => !Number.isNaN(Number(val)) && Number(val) > 0,
      'Harga perolehan wajib berupa angka positif',
    ),
  usefulLifeYears: z.number().int().min(1, 'Tahun masa hidup minimal 1'),
  salvageValue: z
    .string()
    .refine(
      (val) => !Number.isNaN(Number(val)) && Number(val) >= 0,
      'Nilai sisa wajib berupa angka non-negatif',
    )
    .optional()
    .nullable(),
  startDate: z.string().datetime('Tanggal mulai tidak valid'),
  note: z.string().max(500).optional().nullable(),
});

export type CreateDepreciationFormData = z.infer<typeof createDepreciationSchema>;

/**
 * Depreciation Calculation Preview
 * Used for frontend preview before submission
 */
export const depreciationCalculationSchema = z.object({
  acquiredPrice: z.number().positive(),
  usefulLifeYears: z.number().int().positive(),
  salvageValue: z.number().nonnegative().optional(),
  method: z.enum(['STRAIGHT_LINE', 'DECLINING_BALANCE']),
  startDate: z.string().datetime().optional(),
});

export type DepreciationCalculationData = z.infer<typeof depreciationCalculationSchema>;

/**
 * Depreciation Schedule Entry (for display)
 */
export const depreciationScheduleEntrySchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int(),
  beginningValue: z.string(), // Decimal represented as string
  depreciation: z.string(),
  endingValue: z.string(),
  cumulativeDepreciation: z.string(),
});

export type DepreciationScheduleEntry = z.infer<typeof depreciationScheduleEntrySchema>;

/**
 * Depreciation Status (for detail view)
 */
export const depreciationStatusSchema = z.object({
  assetId: z.string(),
  currentMonth: z.number().int(),
  currentYear: z.number().int(),
  currentValue: z.string(), // Decimal as string
  cumulativeDepreciation: z.string(),
  remainingUsefulLife: z.number().int(),
  totalDepreciationSchedule: z.number().int(),
  completedMonths: z.number().int(),
});

export type DepreciationStatusData = z.infer<typeof depreciationStatusSchema>;

/**
 * Depreciation Filter Schema
 */
export const depreciationFilterSchema = z.object({
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().optional(),
  search: z.string().optional(),
  method: z.enum(['STRAIGHT_LINE', 'DECLINING_BALANCE']).optional(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'INACTIVE']).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type DepreciationFilterData = z.infer<typeof depreciationFilterSchema>;
