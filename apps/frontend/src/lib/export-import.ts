import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types';

export type ExportFormat = 'xlsx' | 'csv' | 'pdf';

export interface ImportResult {
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: Array<{ row: number; field: string; message: string }>;
}

// ================================
// Export API
// ================================

export const exportApi = {
  assets: (params?: {
    format?: ExportFormat;
    search?: string;
    status?: string;
    condition?: string;
    categoryId?: number;
  }) => api.get('/export/assets', { params, responseType: 'blob' }),

  requests: (params?: { format?: ExportFormat; search?: string; status?: string }) =>
    api.get('/export/requests', { params, responseType: 'blob' }),

  loans: (params?: { format?: ExportFormat; search?: string; status?: string }) =>
    api.get('/export/loans', { params, responseType: 'blob' }),

  customers: (params?: { format?: ExportFormat; search?: string; isActive?: string }) =>
    api.get('/export/customers', { params, responseType: 'blob' }),
};

// ================================
// Import API
// ================================

export const importApi = {
  assets: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<ApiResponse<ImportResult>>('/import/assets', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  template: () => api.get('/import/assets/template', { responseType: 'blob' }),
};

// ================================
// QR Code API
// ================================

export const qrCodeApi = {
  getImage: (assetId: string) => api.get(`/qrcode/assets/${assetId}`, { responseType: 'blob' }),

  getDataUrl: (assetId: string) =>
    api.get<ApiResponse<{ dataUrl: string }>>(`/qrcode/assets/${assetId}/data-url`),

  getBatch: (assetIds: string[]) =>
    api.post<ApiResponse<Array<{ assetId: string; code: string; dataUrl: string }>>>(
      '/qrcode/assets/batch',
      { assetIds },
    ),
};
