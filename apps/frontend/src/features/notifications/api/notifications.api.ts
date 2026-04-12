import { api } from '@/lib/axios';
import type { ApiResponse, Notification, PaginatedResponse } from '@/types';

export const notificationApi = {
  getAll: (params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<PaginatedResponse<Notification>>>('/notifications', { params }),

  getUnreadCount: () => api.get<ApiResponse<{ count: number }>>('/notifications/unread-count'),

  markAsRead: (id: number) =>
    api.patch<ApiResponse<{ message: string }>>(`/notifications/${id}/read`),

  markAllAsRead: () => api.patch<ApiResponse<{ message: string }>>('/notifications/read-all'),
};
