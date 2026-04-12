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

  cancel: (uuid: string) => api.patch<ApiResponse<void>>(`/requests/${uuid}/cancel`),

  approve: (uuid: string, data?: { note?: string }) =>
    api.patch<ApiResponse<void>>(`/requests/${uuid}/approve`, data),

  reject: (uuid: string, data: { reason: string }) =>
    api.patch<ApiResponse<void>>(`/requests/${uuid}/reject`, data),
};

// ================================
// Loan (Peminjaman) — /loans
// ================================

export const loanApi = {
  getAll: (params?: LoanFilterParams) =>
    api.get<ApiResponse<PaginatedResponse<LoanRequest>>>('/loans', { params }),

  getById: (uuid: string) => api.get<ApiResponse<LoanRequest>>(`/loans/${uuid}`),

  create: (data: Record<string, unknown>) => api.post<ApiResponse<LoanRequest>>('/loans', data),

  cancel: (uuid: string) => api.patch<ApiResponse<void>>(`/loans/${uuid}/cancel`),

  approve: (uuid: string, data?: { note?: string }) =>
    api.patch<ApiResponse<void>>(`/loans/${uuid}/approve`, data),

  reject: (uuid: string, data: { reason: string }) =>
    api.patch<ApiResponse<void>>(`/loans/${uuid}/reject`, data),

  assignAssets: (uuid: string, assetIds: string[]) =>
    api.patch<ApiResponse<void>>(`/loans/${uuid}/assign`, { assetIds }),
};

// ================================
// Return (Pengembalian) — /returns
// ================================

export const returnApi = {
  getAll: (params?: TransactionFilterParams) =>
    api.get<ApiResponse<PaginatedResponse<AssetReturn>>>('/returns', { params }),

  getById: (uuid: string) => api.get<ApiResponse<AssetReturn>>(`/returns/${uuid}`),

  create: (data: Record<string, unknown>) => api.post<ApiResponse<AssetReturn>>('/returns', data),

  verify: (uuid: string, data: Record<string, unknown>) =>
    api.patch<ApiResponse<void>>(`/returns/${uuid}/verify`, data),
};

// ================================
// Handover (Serah Terima) — /handovers
// ================================

export const handoverApi = {
  getAll: (params?: TransactionFilterParams) =>
    api.get<ApiResponse<PaginatedResponse<Handover>>>('/handovers', { params }),

  getById: (uuid: string) => api.get<ApiResponse<Handover>>(`/handovers/${uuid}`),

  create: (data: Record<string, unknown>) => api.post<ApiResponse<Handover>>('/handovers', data),

  approve: (uuid: string, data?: { note?: string }) =>
    api.patch<ApiResponse<void>>(`/handovers/${uuid}/approve`, data),

  reject: (uuid: string, data: { reason: string }) =>
    api.patch<ApiResponse<void>>(`/handovers/${uuid}/reject`, data),
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

  approve: (uuid: string, data?: { note?: string }) =>
    api.patch<ApiResponse<void>>(`/repairs/${uuid}/approve`, data),

  reject: (uuid: string, data: { reason: string }) =>
    api.patch<ApiResponse<void>>(`/repairs/${uuid}/reject`, data),

  execute: (uuid: string) => api.patch<ApiResponse<void>>(`/repairs/${uuid}/execute`),

  complete: (
    uuid: string,
    data: { repairAction?: string; repairVendor?: string; repairCost?: number },
  ) => api.patch<ApiResponse<void>>(`/repairs/${uuid}/complete`, data),

  cancel: (uuid: string) => api.patch<ApiResponse<void>>(`/repairs/${uuid}/cancel`),
};

// ================================
// Project (Proyek Infrastruktur) — /projects
// ================================

export const projectApi = {
  getAll: (params?: ProjectFilterParams) =>
    api.get<ApiResponse<PaginatedResponse<InfraProject>>>('/projects', { params }),

  getById: (uuid: string) => api.get<ApiResponse<InfraProject>>(`/projects/${uuid}`),

  create: (data: Record<string, unknown>) => api.post<ApiResponse<InfraProject>>('/projects', data),

  update: (uuid: string, data: Record<string, unknown>) =>
    api.patch<ApiResponse<InfraProject>>(`/projects/${uuid}`, data),

  remove: (uuid: string) => api.delete<ApiResponse<void>>(`/projects/${uuid}`),
};
