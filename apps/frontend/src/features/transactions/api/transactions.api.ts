import { api } from '@/lib/axios';
import type { ApiResponse, PaginatedResponse } from '@/types';
import type {
  Request,
  LoanRequest,
  AssetReturn,
  Handover,
  InfraProject,
  Repair,
  RequestFilterParams,
  LoanFilterParams,
  TransactionFilterParams,
  ProjectFilterParams,
} from '../types';

// ================================
// Request (Permintaan Baru) — /requests
// ================================

export const requestApi = {
  getAll: (params?: RequestFilterParams) =>
    api.get<ApiResponse<PaginatedResponse<Request>>>('/requests', { params }),

  getById: (uuid: string) => api.get<ApiResponse<Request>>(`/requests/${uuid}`),

  create: (data: Record<string, unknown>) => api.post<ApiResponse<Request>>('/requests', data),

  cancel: (uuid: string, version: number) =>
    api.patch<ApiResponse<void>>(`/requests/${uuid}/cancel`, { version }),

  approve: (
    uuid: string,
    version: number,
    data?: {
      note?: string;
      itemAdjustments?: { itemId: number; approvedQuantity: number }[];
    },
  ) => api.patch<ApiResponse<void>>(`/requests/${uuid}/approve`, { ...data, version }),

  reject: (uuid: string, version: number, data: { reason: string }) =>
    api.patch<ApiResponse<void>>(`/requests/${uuid}/reject`, { ...data, version }),

  execute: (uuid: string, version: number) =>
    api.patch<ApiResponse<void>>(`/requests/${uuid}/execute`, { version }),
};

// ================================
// Loan (Peminjaman) — /loans
// ================================

export const loanApi = {
  getAll: (params?: LoanFilterParams) =>
    api.get<ApiResponse<PaginatedResponse<LoanRequest>>>('/loans', { params }),

  getById: (uuid: string) => api.get<ApiResponse<LoanRequest>>(`/loans/${uuid}`),

  create: (data: Record<string, unknown>) => api.post<ApiResponse<LoanRequest>>('/loans', data),

  cancel: (uuid: string, version: number) =>
    api.patch<ApiResponse<void>>(`/loans/${uuid}/cancel`, { version }),

  approve: (uuid: string, version: number, data?: { note?: string }) =>
    api.patch<ApiResponse<void>>(`/loans/${uuid}/approve`, { ...data, version }),

  reject: (uuid: string, version: number, data: { reason: string }) =>
    api.patch<ApiResponse<void>>(`/loans/${uuid}/reject`, { ...data, version }),

  assignAssets: (uuid: string, assetIds: string[], version: number) =>
    api.patch<ApiResponse<void>>(`/loans/${uuid}/assign-assets`, { assetIds, version }),

  execute: (uuid: string, version: number) =>
    api.patch<ApiResponse<void>>(`/loans/${uuid}/execute`, { version }),
};

// ================================
// Return (Pengembalian) — /returns
// ================================

export const returnApi = {
  getAll: (params?: TransactionFilterParams) =>
    api.get<ApiResponse<PaginatedResponse<AssetReturn>>>('/returns', { params }),

  getById: (uuid: string) => api.get<ApiResponse<AssetReturn>>(`/returns/${uuid}`),

  create: (data: Record<string, unknown>) => api.post<ApiResponse<AssetReturn>>('/returns', data),

  approve: (uuid: string, version: number) =>
    api.patch<ApiResponse<void>>(`/returns/${uuid}/approve`, { version }),

  reject: (uuid: string, version: number, data: { reason: string }) =>
    api.patch<ApiResponse<void>>(`/returns/${uuid}/reject`, { ...data, version }),

  execute: (uuid: string, version: number) =>
    api.patch<ApiResponse<void>>(`/returns/${uuid}/execute`, { version }),

  cancel: (uuid: string, version: number) =>
    api.patch<ApiResponse<void>>(`/returns/${uuid}/cancel`, { version }),

  resubmit: (uuid: string, version: number) =>
    api.patch<ApiResponse<void>>(`/returns/${uuid}/resubmit`, { version }),
};

export const handoverApi = {
  getAll: (params?: TransactionFilterParams) =>
    api.get<ApiResponse<PaginatedResponse<Handover>>>('/handovers', { params }),

  getById: (uuid: string) => api.get<ApiResponse<Handover>>(`/handovers/${uuid}`),

  create: (data: Record<string, unknown>) => api.post<ApiResponse<Handover>>('/handovers', data),

  approve: (uuid: string, version: number, data?: { note?: string }) =>
    api.patch<ApiResponse<void>>(`/handovers/${uuid}/approve`, { ...data, version }),

  reject: (uuid: string, version: number, data: { reason: string }) =>
    api.patch<ApiResponse<void>>(`/handovers/${uuid}/reject`, { ...data, version }),

  execute: (uuid: string, version: number) =>
    api.patch<ApiResponse<void>>(`/handovers/${uuid}/execute`, { version }),
};

// ================================
// Repair (Lapor Rusak) — /repairs
// ================================

export const repairApi = {
  getAll: (params?: TransactionFilterParams) =>
    api.get<ApiResponse<PaginatedResponse<Repair>>>('/repairs', { params }),

  getById: (uuid: string) => api.get<ApiResponse<Repair>>(`/repairs/${uuid}`),

  create: (data: Record<string, unknown>) => api.post<ApiResponse<Repair>>('/repairs', data),

  update: (uuid: string, data: Record<string, unknown>) =>
    api.patch<ApiResponse<Repair>>(`/repairs/${uuid}`, data),

  approve: (uuid: string, version: number, data?: { note?: string }) =>
    api.patch<ApiResponse<void>>(`/repairs/${uuid}/approve`, { ...data, version }),

  reject: (uuid: string, version: number, data: { reason: string }) =>
    api.patch<ApiResponse<void>>(`/repairs/${uuid}/reject`, { ...data, version }),

  execute: (uuid: string, version: number) =>
    api.patch<ApiResponse<void>>(`/repairs/${uuid}/execute`, { version }),

  complete: (
    uuid: string,
    version: number,
    data: { repairAction?: string; repairVendor?: string; repairCost?: number },
  ) => api.patch<ApiResponse<void>>(`/repairs/${uuid}/complete`, { ...data, version }),

  cancel: (uuid: string, version: number) =>
    api.patch<ApiResponse<void>>(`/repairs/${uuid}/cancel`, { version }),

  reportLost: (data: { assetId: string; description: string; note?: string }) =>
    api.post<ApiResponse<Repair>>('/repairs/report-lost', data),

  resolveLost: (
    uuid: string,
    version: number,
    data: { resolution: 'FOUND' | 'NOT_FOUND'; note?: string },
  ) => api.patch<ApiResponse<void>>(`/repairs/${uuid}/resolve-lost`, { ...data, version }),
};

export const projectApi = {
  getAll: (params?: ProjectFilterParams) =>
    api.get<ApiResponse<PaginatedResponse<InfraProject>>>('/projects', { params }),

  getById: (uuid: string) => api.get<ApiResponse<InfraProject>>(`/projects/${uuid}`),

  create: (data: Record<string, unknown>) => api.post<ApiResponse<InfraProject>>('/projects', data),

  update: (uuid: string, version: number, data: Record<string, unknown>) =>
    api.patch<ApiResponse<InfraProject>>(`/projects/${uuid}`, { ...data, version }),

  approve: (uuid: string, version: number, data?: { note?: string }) =>
    api.patch<ApiResponse<void>>(`/projects/${uuid}/approve`, { ...data, version }),

  reject: (uuid: string, version: number, data: { reason: string }) =>
    api.patch<ApiResponse<void>>(`/projects/${uuid}/reject`, { ...data, version }),

  execute: (uuid: string, version: number) =>
    api.patch<ApiResponse<void>>(`/projects/${uuid}/execute`, { version }),

  cancel: (uuid: string, version: number) =>
    api.patch<ApiResponse<void>>(`/projects/${uuid}/cancel`, { version }),

  complete: (uuid: string, version: number) =>
    api.patch<ApiResponse<void>>(`/projects/${uuid}/complete`, { version }),

  hold: (uuid: string, version: number, data?: { reason?: string }) =>
    api.patch<ApiResponse<void>>(`/projects/${uuid}/hold`, { ...data, version }),

  resume: (uuid: string, version: number) =>
    api.patch<ApiResponse<void>>(`/projects/${uuid}/resume`, { version }),

  remove: (uuid: string) => api.delete<ApiResponse<void>>(`/projects/${uuid}`),
};
