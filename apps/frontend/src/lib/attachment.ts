import { api } from '@/lib/axios';
import { ENV } from '@/config/env';
import type { ApiResponse, Attachment } from '@/types';

export const attachmentApi = {
  getByEntity: (entityType: string, entityId: string) =>
    api.get<ApiResponse<Attachment[]>>('/uploads', {
      params: { entityType, entityId },
    }),

  upload: (entityType: string, entityId: string, files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    return api.post<ApiResponse<Attachment[]>>('/uploads', formData, {
      params: { entityType, entityId },
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  remove: (id: number) => api.delete<ApiResponse<void>>(`/uploads/${id}`),

  getFileUrl: (fileUrl: string) => {
    const baseUrl = ENV.API_BASE_URL.replace('/api/v1', '');
    return `${baseUrl}${fileUrl}`;
  },
};
