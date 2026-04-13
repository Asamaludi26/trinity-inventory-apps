import { api } from '@/lib/axios';
import type { ApiResponse, PaginatedResponse } from '@/types';
import type {
  Asset,
  AssetCategory,
  AssetType,
  AssetModel,
  PurchaseMasterData,
  Depreciation,
  StockSummary,
  AssetFilterParams,
  StockFilterParams,
  PurchaseFilterParams,
  DepreciationFilterParams,
} from '../types';

// ================================
// Asset CRUD
// ================================

export const assetApi = {
  getAll: (params?: AssetFilterParams) =>
    api.get<ApiResponse<PaginatedResponse<Asset>>>('/assets', { params }),

  getById: (id: string) => api.get<ApiResponse<Asset>>(`/assets/${id}`),

  create: (data: Record<string, unknown>) => api.post<ApiResponse<Asset>>('/assets', data),

  update: (id: string, version: number, data: Record<string, unknown>) =>
    api.patch<ApiResponse<Asset>>(`/assets/${id}`, { ...data, version }),

  remove: (id: string) => api.delete<ApiResponse<void>>(`/assets/${id}`),
};

// ================================
// Stock
// ================================

export const stockApi = {
  getSummary: (params?: StockFilterParams) =>
    api.get<ApiResponse<PaginatedResponse<StockSummary>>>('/assets/stock', { params }),

  updateThreshold: (modelId: number, minQuantity: number) =>
    api.put<ApiResponse<void>>(`/assets/models/${modelId}/threshold`, { minQuantity }),
};

// ================================
// Category CRUD
// ================================

export const categoryApi = {
  getAll: () => api.get<ApiResponse<AssetCategory[]>>('/assets/categories'),

  create: (data: { name: string }) =>
    api.post<ApiResponse<AssetCategory>>('/assets/categories', data),

  update: (id: number, data: { name: string }) =>
    api.patch<ApiResponse<AssetCategory>>(`/assets/categories/${id}`, data),

  remove: (id: number) => api.delete<ApiResponse<void>>(`/assets/categories/${id}`),
};

// ================================
// Type CRUD
// ================================

export const typeApi = {
  getAll: (categoryId?: number) =>
    api.get<ApiResponse<AssetType[]>>('/assets/types', { params: { categoryId } }),

  create: (data: { categoryId: number; name: string }) =>
    api.post<ApiResponse<AssetType>>('/assets/types', data),

  update: (id: number, data: { name: string }) =>
    api.patch<ApiResponse<AssetType>>(`/assets/types/${id}`, data),

  remove: (id: number) => api.delete<ApiResponse<void>>(`/assets/types/${id}`),
};

// ================================
// Model CRUD
// ================================

export const modelApi = {
  getAll: (typeId?: number) =>
    api.get<ApiResponse<AssetModel[]>>('/assets/models', { params: { typeId } }),

  create: (data: { typeId: number; name: string; brand: string }) =>
    api.post<ApiResponse<AssetModel>>('/assets/models', data),

  update: (id: number, data: { name?: string; brand?: string }) =>
    api.patch<ApiResponse<AssetModel>>(`/assets/models/${id}`, data),

  remove: (id: number) => api.delete<ApiResponse<void>>(`/assets/models/${id}`),
};

// ================================
// Purchase CRUD
// ================================

export const purchaseApi = {
  getAll: (params?: PurchaseFilterParams) =>
    api.get<ApiResponse<PaginatedResponse<PurchaseMasterData>>>('/assets/purchases', { params }),

  getById: (uuid: string) => api.get<ApiResponse<PurchaseMasterData>>(`/assets/purchases/${uuid}`),

  create: (data: Record<string, unknown>) =>
    api.post<ApiResponse<PurchaseMasterData>>('/assets/purchases', data),

  update: (uuid: string, data: Record<string, unknown>) =>
    api.patch<ApiResponse<PurchaseMasterData>>(`/assets/purchases/${uuid}`, data),

  remove: (uuid: string) => api.delete<ApiResponse<void>>(`/assets/purchases/${uuid}`),
};

// ================================
// Depreciation CRUD
// ================================

export const depreciationApi = {
  getAll: (params?: DepreciationFilterParams) =>
    api.get<ApiResponse<PaginatedResponse<Depreciation>>>('/assets/depreciations', { params }),

  getById: (uuid: string) => api.get<ApiResponse<Depreciation>>(`/assets/depreciations/${uuid}`),

  create: (data: Record<string, unknown>) =>
    api.post<ApiResponse<Depreciation>>('/assets/depreciations', data),

  update: (uuid: string, data: Record<string, unknown>) =>
    api.patch<ApiResponse<Depreciation>>(`/assets/depreciations/${uuid}`, data),

  remove: (uuid: string) => api.delete<ApiResponse<void>>(`/assets/depreciations/${uuid}`),
};
