import { api } from '../../../lib/axios';
import type { LoginFormData } from '../../../validation/auth.schema';

export interface LoginResponse {
  user: {
    id: number;
    uuid: string;
    fullName: string;
    email: string;
    role: string;
    division: { id: number; name: string; code: string } | null;
    permissions: Record<string, boolean> | null;
    avatarUrl: string | null;
    mustChangePassword: boolean;
  };
  accessToken: string;
  refreshToken: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const authApi = {
  login: (data: LoginFormData) =>
    api.post<{ success: boolean; data: LoginResponse }>('/auth/login', data),

  refresh: (refreshToken: string) =>
    api.post<{ success: boolean; data: { accessToken: string; refreshToken: string } }>(
      '/auth/refresh',
      { refreshToken },
    ),

  logout: () => api.post('/auth/logout'),

  changePassword: (data: ChangePasswordPayload) =>
    api.patch<{ success: boolean; message: string }>('/auth/change-password', data),
};
