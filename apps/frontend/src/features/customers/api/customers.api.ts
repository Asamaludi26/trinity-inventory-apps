import { api } from '@/lib/axios';
import type { ApiResponse, PaginatedResponse } from '@/types';
import type {
  Customer,
  Installation,
  Maintenance,
  Dismantle,
  CustomerFilterParams,
  InstallationFilterParams,
  MaintenanceFilterParams,
  DismantleFilterParams,
} from '../types';

// ================================
// Customer CRUD — /customers
// ================================

export const customerApi = {
  getAll: (params?: CustomerFilterParams) =>
    api.get<ApiResponse<PaginatedResponse<Customer>>>('/customers', { params }),

  getById: (uuid: string) => api.get<ApiResponse<Customer>>(`/customers/${uuid}`),

  create: (data: Record<string, unknown>) => api.post<ApiResponse<Customer>>('/customers', data),

  update: (uuid: string, data: Record<string, unknown>) =>
    api.patch<ApiResponse<Customer>>(`/customers/${uuid}`, data),

  remove: (uuid: string) => api.delete<ApiResponse<void>>(`/customers/${uuid}`),
};

// ================================
// Installation — /installation
// ================================

export const installationApi = {
  getAll: (params?: InstallationFilterParams) =>
    api.get<ApiResponse<PaginatedResponse<Installation>>>('/installation', { params }),

  getById: (id: number) => api.get<ApiResponse<Installation>>(`/installation/${id}`),

  create: (data: Record<string, unknown>) =>
    api.post<ApiResponse<Installation>>('/installation', data),

  update: (id: number, data: Record<string, unknown>) =>
    api.patch<ApiResponse<Installation>>(`/installation/${id}`, data),

  updateStatus: (id: number, data: Record<string, unknown>) =>
    api.patch<ApiResponse<void>>(`/installation/${id}/status`, data),

  complete: (id: number) => api.patch<ApiResponse<void>>(`/installation/${id}/complete`),
};

// ================================
// Maintenance — /maintenance
// ================================

export const maintenanceApi = {
  getAll: (params?: MaintenanceFilterParams) =>
    api.get<ApiResponse<PaginatedResponse<Maintenance>>>('/maintenance', { params }),

  getById: (id: number) => api.get<ApiResponse<Maintenance>>(`/maintenance/${id}`),

  create: (data: Record<string, unknown>) =>
    api.post<ApiResponse<Maintenance>>('/maintenance', data),

  update: (id: number, data: Record<string, unknown>) =>
    api.patch<ApiResponse<Maintenance>>(`/maintenance/${id}`, data),

  updateStatus: (id: number, data: Record<string, unknown>) =>
    api.patch<ApiResponse<void>>(`/maintenance/${id}/status`, data),

  complete: (id: number, data?: { resolution?: string }) =>
    api.patch<ApiResponse<void>>(`/maintenance/${id}/complete`, data),
};

// ================================
// Dismantle — /dismantle
// ================================

export const dismantleApi = {
  getAll: (params?: DismantleFilterParams) =>
    api.get<ApiResponse<PaginatedResponse<Dismantle>>>('/dismantle', { params }),

  getById: (id: number) => api.get<ApiResponse<Dismantle>>(`/dismantle/${id}`),

  create: (data: Record<string, unknown>) => api.post<ApiResponse<Dismantle>>('/dismantle', data),

  update: (id: number, data: Record<string, unknown>) =>
    api.patch<ApiResponse<Dismantle>>(`/dismantle/${id}`, data),

  updateStatus: (id: number, data: Record<string, unknown>) =>
    api.patch<ApiResponse<void>>(`/dismantle/${id}/status`, data),

  complete: (
    id: number,
    data?: { itemConditions?: Array<{ assetId: string; conditionAfter: string }> },
  ) => api.patch<ApiResponse<void>>(`/dismantle/${id}/complete`, data),
};
