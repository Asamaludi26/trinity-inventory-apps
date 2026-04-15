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
// Stats Types
// ================================
export interface UserStats {
  requestCount: number;
  loanRequestCount: number;
  repairCount: number;
  handoverCount: number;
  currentAssetCount: number;
}

export interface DivisionStats {
  totalMembers: number;
  activeMembers: number;
  requestCount: number;
  loanRequestCount: number;
  repairCount: number;
}

// ================================
// Users API
// ================================
export const usersApi = {
  getAll: (params?: UserFilterParams) =>
    api.get<ApiResponse<PaginatedResponse<User>>>('/settings/users', { params }),

  getByUuid: (uuid: string) => api.get<ApiResponse<User>>(`/settings/users/${uuid}`),

  getStats: (uuid: string) => api.get<ApiResponse<UserStats>>(`/settings/users/${uuid}/stats`),

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

  getStats: (uuid: string) =>
    api.get<ApiResponse<DivisionStats>>(`/settings/divisions/${uuid}/stats`),

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

export interface NotificationChannels {
  stock: boolean;
  requests: boolean;
  loans: boolean;
  returns: boolean;
  handovers: boolean;
  repairs: boolean;
  projects: boolean;
}

export interface NotificationPreferences {
  inAppEnabled: boolean;
  emailEnabled: boolean;
  whatsappEnabled: boolean;
  channels: NotificationChannels;
}

// ================================
// Audit API
// ================================
export const auditApi = {
  getAll: (params?: AuditFilterParams) =>
    api.get<ApiResponse<PaginatedResponse<AuditLog>>>('/settings/audit', { params }),
};

export const profileApi = {
  getNotificationPrefs: () =>
    api.get<ApiResponse<NotificationPreferences>>('/settings/profile/notification-prefs'),

  updateNotificationPrefs: (data: Partial<NotificationPreferences>) =>
    api.patch<ApiResponse<NotificationPreferences>>('/settings/profile/notification-prefs', data),

  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post<ApiResponse<{ id: number; uuid: string; avatarUrl: string }>>(
      '/settings/profile/avatar',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
  },
};
