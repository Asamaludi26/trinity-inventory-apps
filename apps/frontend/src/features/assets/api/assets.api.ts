import { api } from '@/lib/axios';
import type { ApiResponse, PaginatedResponse } from '@/types';
import type {
  Asset,
  AssetCategory,
  AssetType,
  AssetModel,
  AssetClassification,
  BulkTrackingType,
  TrackingMethod,
  PurchaseMasterData,
  Depreciation,
  StockSummary,
  StockMovement,
  AssetFilterParams,
  StockFilterParams,
  PurchaseFilterParams,
  DepreciationFilterParams,
  BatchAssetRegistration,
  DepreciationScheduleEntry,
  DepreciationStatusData,
  AssetGroup,
  AssetHistory,
  StockDetailTotal,
  StockDetailUsageItem,
  StockHistoryItem,
} from '../types';

// ================================
// Asset CRUD
// ================================

export const assetApi = {
  getAll: (params?: AssetFilterParams) =>
    api.get<ApiResponse<PaginatedResponse<Asset>>>('/assets', { params }),

  getAllGrouped: (params?: AssetFilterParams) =>
    api.get<ApiResponse<PaginatedResponse<AssetGroup>>>('/assets', {
      params: { ...params, view: 'group' },
    }),

  getById: (id: string) => api.get<ApiResponse<Asset>>(`/assets/${id}`),

  create: (data: Record<string, unknown>) => api.post<ApiResponse<Asset>>('/assets', data),

  update: (id: string, version: number, data: Record<string, unknown>) =>
    api.patch<ApiResponse<Asset>>(`/assets/${id}`, { ...data, version }),

  remove: (id: string) => api.delete<ApiResponse<void>>(`/assets/${id}`),

  createBatch: (data: Record<string, unknown>) =>
    api.post<ApiResponse<BatchAssetRegistration>>('/assets/batch', data),

  getHistory: (assetId: string, params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<PaginatedResponse<AssetHistory>>>(`/assets/${assetId}/history`, { params }),

  reportDamage: (
    assetId: string,
    data: { issueDescription: string; condition: string; note?: string },
  ) => api.post<ApiResponse<unknown>>(`/assets/${assetId}/report-damage`, data),

  reportLost: (
    assetId: string,
    data: { issueDescription: string; lostDate?: string; note?: string },
  ) => api.post<ApiResponse<unknown>>(`/assets/${assetId}/report-lost`, data),

  getStockMovements: (assetId: string) =>
    api.get<ApiResponse<StockMovement[]>>(`/stock-movements/asset/${assetId}`),
};

// ================================
// Stock
// ================================

export const stockApi = {
  getSummary: (params?: StockFilterParams) =>
    api.get<ApiResponse<PaginatedResponse<StockSummary>>>('/assets/stock', { params }),

  updateThreshold: (modelId: number, minQuantity: number) =>
    api.put<ApiResponse<void>>(`/assets/models/${modelId}/threshold`, { minQuantity }),

  updateThresholdBulk: (
    items: { modelId: number; minQuantity: number; warningQuantity?: number }[],
  ) => api.put<ApiResponse<void>>('/assets/stock/threshold/bulk', { items }),

  getDetailTotal: (modelId: number) =>
    api.get<ApiResponse<StockDetailTotal>>(`/assets/stock/${modelId}/detail-total`),

  getDetailUsage: (modelId: number, params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<PaginatedResponse<StockDetailUsageItem>>>(
      `/assets/stock/${modelId}/detail-usage`,
      { params },
    ),

  getHistory: (modelId: number, params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<PaginatedResponse<StockHistoryItem>>>(`/assets/stock/${modelId}/history`, {
      params,
    }),

  restock: (modelId: number, data: { quantity: number; source: string; note?: string }) =>
    api.post<ApiResponse<{ restockedCount: number }>>(`/assets/stock/${modelId}/restock`, data),
};

// ================================
// Category CRUD
// ================================

export const categoryApi = {
  getAll: () => api.get<ApiResponse<PaginatedResponse<AssetCategory>>>('/assets/categories'),

  create: (data: {
    name: string;
    defaultClassification?: AssetClassification;
    isCustomerInstallable?: boolean;
    isProjectAsset?: boolean;
    divisionIds?: number[];
  }) => api.post<ApiResponse<AssetCategory>>('/assets/categories', data),

  update: (
    id: number,
    data: {
      name?: string;
      defaultClassification?: AssetClassification;
      isCustomerInstallable?: boolean;
      isProjectAsset?: boolean;
      divisionIds?: number[];
    },
  ) => api.patch<ApiResponse<AssetCategory>>(`/assets/categories/${id}`, data),

  remove: (id: number) => api.delete<ApiResponse<void>>(`/assets/categories/${id}`),
};

// ================================
// Type CRUD
// ================================

export const typeApi = {
  getAll: (categoryId?: number) =>
    api.get<ApiResponse<PaginatedResponse<AssetType>>>('/assets/types', { params: { categoryId } }),

  create: (data: {
    categoryId: number;
    name: string;
    classification?: AssetClassification;
    trackingMethod?: TrackingMethod;
    unitOfMeasure?: string;
  }) => api.post<ApiResponse<AssetType>>('/assets/types', data),

  update: (
    id: number,
    data: {
      name?: string;
      classification?: AssetClassification | null;
      trackingMethod?: TrackingMethod | null;
      unitOfMeasure?: string | null;
    },
  ) => api.patch<ApiResponse<AssetType>>(`/assets/types/${id}`, data),

  remove: (id: number) => api.delete<ApiResponse<void>>(`/assets/types/${id}`),
};

// ================================
// Model CRUD
// ================================

export const modelApi = {
  getAll: (typeId?: number) =>
    api.get<ApiResponse<PaginatedResponse<AssetModel>>>('/assets/models', { params: { typeId } }),

  create: (data: {
    typeId: number;
    name: string;
    brand: string;
    unit?: string;
    containerUnit?: string;
    containerSize?: number;
    bulkType?: BulkTrackingType;
    isInstallationTemplate?: boolean;
  }) => api.post<ApiResponse<AssetModel>>('/assets/models', data),

  update: (
    id: number,
    data: {
      name?: string;
      brand?: string;
      unit?: string | null;
      containerUnit?: string | null;
      containerSize?: number | null;
      bulkType?: BulkTrackingType | null;
      isInstallationTemplate?: boolean;
    },
  ) => api.patch<ApiResponse<AssetModel>>(`/assets/models/${id}`, data),

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

  /**
   * Get depreciation calculation schedule
   * GET /assets/depreciations/:id/schedule
   */
  getSchedule: (uuid: string) =>
    api.get<ApiResponse<DepreciationScheduleEntry[]>>(`/assets/depreciations/${uuid}/schedule`),

  /**
   * Get current depreciation status
   * GET /assets/depreciations/:id/status
   */
  getStatus: (uuid: string) =>
    api.get<ApiResponse<DepreciationStatusData>>(`/assets/depreciations/${uuid}/status`),
};
