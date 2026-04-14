import { z } from 'zod';

export const createUserSchema = z.object({
  employeeId: z.string().min(1, 'ID Karyawan wajib diisi'),
  fullName: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Email tidak valid'),
  password: z
    .string()
    .min(8, 'Password minimal 8 karakter')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
      'Password harus mengandung huruf besar, huruf kecil, angka, dan karakter spesial',
    ),
  role: z.enum(['SUPERADMIN', 'ADMIN_LOGISTIK', 'ADMIN_PURCHASE', 'LEADER', 'STAFF'], {
    message: 'Role wajib dipilih',
  }),
  divisionId: z.union([z.number(), z.string().transform(Number)]).optional(),
  phone: z.string().optional(),
});

export const updateUserSchema = z.object({
  employeeId: z.string().min(1, 'ID Karyawan wajib diisi').optional(),
  fullName: z.string().min(2, 'Nama minimal 2 karakter').optional(),
  email: z.string().email('Email tidak valid').optional(),
  password: z
    .string()
    .min(8, 'Password minimal 8 karakter')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
      'Password harus mengandung huruf besar, huruf kecil, angka, dan karakter spesial',
    )
    .optional()
    .or(z.literal('')),
  role: z.enum(['SUPERADMIN', 'ADMIN_LOGISTIK', 'ADMIN_PURCHASE', 'LEADER', 'STAFF']).optional(),
  divisionId: z.union([z.number(), z.string().transform(Number)]).optional(),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const createDivisionSchema = z.object({
  name: z.string().min(2, 'Nama divisi minimal 2 karakter'),
  code: z
    .string()
    .min(2, 'Kode minimal 2 karakter')
    .max(10, 'Kode maksimal 10 karakter')
    .regex(/^[A-Z0-9]+$/, 'Kode harus huruf kapital dan angka'),
  description: z.string().optional(),
  canDoFieldwork: z.boolean().optional(),
});

export const updateDivisionSchema = z.object({
  name: z.string().min(2, 'Nama divisi minimal 2 karakter').optional(),
  code: z
    .string()
    .min(2, 'Kode minimal 2 karakter')
    .max(10, 'Kode maksimal 10 karakter')
    .regex(/^[A-Z0-9]+$/, 'Kode harus huruf kapital dan angka')
    .optional(),
  description: z.string().optional(),
  canDoFieldwork: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export type CreateUserFormData = z.infer<typeof createUserSchema>;
export type UpdateUserFormData = z.infer<typeof updateUserSchema>;
export type CreateDivisionFormData = z.infer<typeof createDivisionSchema>;
export type UpdateDivisionFormData = z.infer<typeof updateDivisionSchema>;
