import type {
  AssetStatus,
  AssetCondition,
  DepreciationMethod,
  PaginationParams,
  UserSummary,
} from '@/types';

// ================================
// Category → Type → Model Hierarchy
// ================================

export interface AssetCategory {
  id: number;
  name: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { types: number; assets: number };
}

export interface AssetType {
  id: number;
  categoryId: number;
  name: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  category?: AssetCategory;
  _count?: { models: number; assets: number };
}

export interface AssetModel {
  id: number;
  typeId: number;
  name: string;
  brand: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  type?: AssetType;
  _count?: { assets: number };
}

// ================================
// Core Asset
// ================================

export interface Asset {
  id: string;
  code: string;
  name: string;
  categoryId: number;
  typeId: number | null;
  modelId: number | null;
  brand: string;
  serialNumber: string | null;
  purchasePrice: string | null;
  purchaseDate: string | null;
  depreciationMethod: DepreciationMethod | null;
  usefulLifeYears: number | null;
  salvageValue: string | null;
  status: AssetStatus;
  condition: AssetCondition;
  currentUserId: number | null;
  recordedById: number;
  isDeleted: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  category?: AssetCategory;
  type?: AssetType;
  model?: AssetModel;
  currentUser?: UserSummary;
  recordedBy?: UserSummary;
}

// ================================
// Purchase & Depreciation (F-03)
// ================================

export interface PurchaseMasterData {
  id: string;
  modelId: number;
  supplier: string;
  unitPrice: string;
  quantity: number;
  totalPrice: string;
  purchaseDate: string;
  warrantyMonths: number | null;
  invoiceNumber: string | null;
  note: string | null;
  createdById: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  model?: AssetModel;
  createdBy?: UserSummary;
  depreciation?: Depreciation;
}

export interface Depreciation {
  id: string;
  purchaseId: string;
  method: DepreciationMethod;
  usefulLifeYears: number;
  salvageValue: string;
  startDate: string;
  createdById: number;
  createdAt: string;
  updatedAt: string;
  purchase?: PurchaseMasterData;
  createdBy?: UserSummary;
}

// ================================
// Stock
// ================================

export interface StockThreshold {
  id: number;
  modelId: number;
  minQuantity: number;
  model?: AssetModel;
}

export interface StockSummary {
  modelId: number;
  modelName: string;
  brand: string;
  categoryName: string;
  typeName: string;
  totalQuantity: number;
  inStorage: number;
  inUse: number;
  underRepair: number;
  threshold: number;
}

// ================================
// Filter Params
// ================================

export interface AssetFilterParams extends PaginationParams {
  categoryId?: number;
  typeId?: number;
  modelId?: number;
  status?: AssetStatus;
  condition?: AssetCondition;
}

export interface StockFilterParams extends PaginationParams {
  view?: 'main' | 'division' | 'personal';
  categoryId?: number;
}

export interface PurchaseFilterParams extends PaginationParams {
  supplier?: string;
}

export interface DepreciationFilterParams extends PaginationParams {
  method?: DepreciationMethod;
}
