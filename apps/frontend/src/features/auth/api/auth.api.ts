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
  };
  accessToken: string;
  refreshToken: string;
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
};
