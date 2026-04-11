import { z } from 'zod';

// ================================
// Customer Schema
// ================================

export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Nama pelanggan wajib diisi').max(255),
  address: z.string().optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email('Email tidak valid').optional().or(z.literal('')),
  picName: z.string().max(255).optional(),
  picPhone: z.string().max(20).optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

// ================================
// Installation Schema
// ================================

export const createInstallationSchema = z.object({
  customerId: z.coerce.number({ required_error: 'Pelanggan wajib dipilih' }),
  scheduledAt: z.string().optional(),
  location: z.string().optional(),
  note: z.string().optional(),
  materials: z
    .array(
      z.object({
        description: z.string().min(1, 'Deskripsi material wajib diisi').max(255),
        quantity: z.coerce.number().int().positive('Jumlah harus positif'),
        note: z.string().optional(),
      }),
    )
    .optional(),
});

// ================================
// Maintenance Schema
// ================================

export const createMaintenanceSchema = z.object({
  customerId: z.coerce.number({ required_error: 'Pelanggan wajib dipilih' }),
  scheduledAt: z.string().optional(),
  issueReport: z.string().optional(),
  note: z.string().optional(),
  materials: z
    .array(
      z.object({
        description: z.string().min(1, 'Deskripsi material wajib diisi').max(255),
        quantity: z.coerce.number().int().positive('Jumlah harus positif'),
        note: z.string().optional(),
      }),
    )
    .optional(),
});

// ================================
// Dismantle Schema
// ================================

export const createDismantleSchema = z.object({
  customerId: z.coerce.number({ required_error: 'Pelanggan wajib dipilih' }),
  scheduledAt: z.string().optional(),
  reason: z.string().optional(),
  note: z.string().optional(),
});

// ================================
// Inferred Types
// ================================

export type CreateCustomerFormData = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerFormData = z.infer<typeof updateCustomerSchema>;
export type CreateInstallationFormData = z.infer<typeof createInstallationSchema>;
export type CreateMaintenanceFormData = z.infer<typeof createMaintenanceSchema>;
export type CreateDismantleFormData = z.infer<typeof createDismantleSchema>;
