import { z } from 'zod';

// ================================
// Request Schema (Permintaan Baru)
// ================================

const requestItemSchema = z.object({
  modelId: z.coerce.number().optional(),
  description: z.string().min(1, 'Deskripsi item wajib diisi').max(255),
  quantity: z.coerce.number().int().positive('Jumlah harus positif'),
  note: z.string().optional(),
});

export const createRequestSchema = z.object({
  title: z.string().min(1, 'Judul request wajib diisi').max(255),
  description: z.string().optional(),
  priority: z.enum(['NORMAL', 'URGENT', 'PROJECT']).default('NORMAL'),
  projectId: z.string().optional(),
  items: z.array(requestItemSchema).min(1, 'Minimal 1 item').max(50, 'Maksimal 50 item'),
});

// ================================
// Loan Schema (Peminjaman)
// ================================

const loanItemSchema = z.object({
  modelId: z.coerce.number().optional(),
  description: z.string().min(1, 'Deskripsi item wajib diisi').max(255),
  quantity: z.coerce.number().int().positive('Jumlah harus positif'),
});

export const createLoanSchema = z.object({
  purpose: z.string().min(1, 'Tujuan peminjaman wajib diisi'),
  expectedReturn: z.string().min(1, 'Tanggal pengembalian wajib diisi'),
  items: z.array(loanItemSchema).min(1, 'Minimal 1 item'),
});

// ================================
// Return Schema (Pengembalian)
// ================================

const returnItemSchema = z.object({
  assetId: z.string().min(1, 'Asset ID wajib diisi'),
  conditionAfter: z.enum(['NEW', 'GOOD', 'FAIR', 'POOR', 'BROKEN'], {
    message: 'Kondisi wajib dipilih',
  }),
  note: z.string().optional(),
});

export const createReturnSchema = z.object({
  loanRequestId: z.string().min(1, 'ID peminjaman wajib diisi'),
  note: z.string().optional(),
  items: z.array(returnItemSchema).min(1, 'Minimal 1 item'),
});

// ================================
// Handover Schema (Serah Terima)
// ================================

const handoverItemSchema = z.object({
  assetId: z.string().min(1, 'Asset ID wajib diisi'),
  note: z.string().optional(),
});

export const createHandoverSchema = z.object({
  toUserId: z.coerce.number({ message: 'Penerima wajib dipilih' }),
  witnessUserId: z.coerce.number().optional(),
  note: z.string().optional(),
  items: z.array(handoverItemSchema).min(1, 'Minimal 1 aset'),
});

// ================================
// Repair Schema (Lapor Rusak)
// ================================

export const createRepairSchema = z.object({
  assetId: z.string().min(1, 'Aset wajib dipilih'),
  description: z.string().min(1, 'Deskripsi kerusakan wajib diisi'),
  note: z.string().optional(),
});

// ================================
// Project Schema (Proyek Infrastruktur)
// ================================

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Nama proyek wajib diisi').max(255),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  location: z.string().max(500).optional(),
  customerId: z.coerce.number().optional(),
});

// ================================
// Approval/Rejection Common
// ================================

export const approvalSchema = z.object({
  note: z.string().optional(),
});

export const rejectionSchema = z.object({
  reason: z.string().min(1, 'Alasan penolakan wajib diisi'),
});

// ================================
// Inferred Types
// ================================

export type CreateRequestFormData = z.infer<typeof createRequestSchema>;
export type CreateLoanFormData = z.infer<typeof createLoanSchema>;
export type CreateReturnFormData = z.infer<typeof createReturnSchema>;
export type CreateHandoverFormData = z.infer<typeof createHandoverSchema>;
export type CreateRepairFormData = z.infer<typeof createRepairSchema>;
export type CreateProjectFormData = z.infer<typeof createProjectSchema>;
export type ApprovalFormData = z.infer<typeof approvalSchema>;
export type RejectionFormData = z.infer<typeof rejectionSchema>;
