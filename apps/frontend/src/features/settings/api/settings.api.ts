import { api } from '../../../lib/axios';
import type {
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
  User,
  Division,
  DivisionSummary,
  UserRole,
} from '../../../types';
import type { CreateUserFormData, UpdateUserFormData } from '../../../validation/settings.schema';
import type {
  CreateDivisionFormData,
  UpdateDivisionFormData,
} from '../../../validation/settings.schema';

// ================================
// User Filters
// ================================
export interface UserFilterParams extends PaginationParams {
  role?: UserRole;
  divisionId?: number;
  isActive?: boolean;
}

// ================================
// Users API
// ================================
export const usersApi = {
  getAll: (params?: UserFilterParams) =>
    api.get<ApiResponse<PaginatedResponse<User>>>('/settings/users', { params }),

  getByUuid: (uuid: string) => api.get<ApiResponse<User>>(`/settings/users/${uuid}`),

  create: (data: CreateUserFormData) => api.post<ApiResponse<User>>('/settings/users', data),

  update: (uuid: string, data: UpdateUserFormData) =>
    api.put<ApiResponse<User>>(`/settings/users/${uuid}`, data),

  delete: (uuid: string) => api.delete<ApiResponse<null>>(`/settings/users/${uuid}`),
};

// ================================
// Divisions API
// ================================
export const divisionsApi = {
  getAll: (params?: PaginationParams) =>
    api.get<ApiResponse<PaginatedResponse<Division>>>('/settings/divisions', { params }),

  getByUuid: (uuid: string) => api.get<ApiResponse<Division>>(`/settings/divisions/${uuid}`),

  getActive: () => api.get<ApiResponse<DivisionSummary[]>>('/settings/divisions/active'),

  create: (data: CreateDivisionFormData) =>
    api.post<ApiResponse<Division>>('/settings/divisions', data),

  update: (uuid: string, data: UpdateDivisionFormData) =>
    api.put<ApiResponse<Division>>(`/settings/divisions/${uuid}`, data),

  delete: (uuid: string) => api.delete<ApiResponse<null>>(`/settings/divisions/${uuid}`),
};

// ================================
// Audit Filter
// ================================
export interface AuditFilterParams extends PaginationParams {
  userId?: number;
  action?: string;
  entityType?: string;
  startDate?: string;
  endDate?: string;
}

export interface AuditLog {
  id: number;
  userId: number;
  action: string;
  entityType: string;
  entityId: string;
  dataBefore: Record<string, unknown> | null;
  dataAfter: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user?: { id: number; fullName: string; email: string };
}

// ================================
// Audit API
// ================================
export const auditApi = {
  getAll: (params?: AuditFilterParams) =>
    api.get<ApiResponse<PaginatedResponse<AuditLog>>>('/settings/audit', { params }),
};
