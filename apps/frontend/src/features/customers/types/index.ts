import type { TransactionStatus, PaginationParams, UserSummary, AssetCondition } from '@/types';

// ================================
// Customer (Pelanggan)
// ================================

export interface Customer {
  id: number;
  uuid: string;
  code: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  picName: string | null;
  picPhone: string | null;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    installations: number;
    maintenances: number;
    dismantles: number;
  };
}

// ================================
// Installation (Instalasi)
// ================================

export interface Installation {
  id: number;
  code: string;
  customerId: number;
  status: TransactionStatus;
  scheduledAt: string | null;
  completedAt: string | null;
  location: string | null;
  note: string | null;
  createdById: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  createdBy?: UserSummary;
  materials?: InstallationMaterial[];
}

export interface InstallationMaterial {
  id: number;
  installationId: number;
  description: string;
  quantity: number;
  note: string | null;
  modelId: number | null;
  model?: { id: number; name: string } | null;
}

// ================================
// Maintenance (Pemeliharaan)
// ================================

export interface Maintenance {
  id: number;
  code: string;
  customerId: number;
  status: TransactionStatus;
  scheduledAt: string | null;
  completedAt: string | null;
  issueReport: string | null;
  resolution: string | null;
  priority: string;
  workTypes: string[];
  createdById: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  createdBy?: UserSummary;
  materials?: MaintenanceMaterial[];
  replacements?: MaintenanceReplacement[];
}

export interface MaintenanceMaterial {
  id: number;
  maintenanceId: number;
  description: string;
  quantity: number;
  note: string | null;
  modelId: number | null;
  model?: { id: number; name: string } | null;
}

export interface MaintenanceReplacement {
  id: number;
  maintenanceId: number;
  oldAssetDesc: string;
  newAssetDesc: string;
  oldAssetId: string | null;
  newAssetId: string | null;
  conditionAfter: AssetCondition | null;
  note: string | null;
  oldAsset?: { id: string; code: string; name: string } | null;
  newAsset?: { id: string; code: string; name: string } | null;
}

// ================================
// Dismantle (Pembongkaran)
// ================================

export interface DismantleItem {
  id: number;
  dismantleId: number;
  assetId: string;
  note: string | null;
  conditionAfter: AssetCondition | null;
  asset?: { id: string; code: string; name: string; status: string; condition: string };
}

export interface Dismantle {
  id: number;
  code: string;
  customerId: number;
  status: TransactionStatus;
  scheduledAt: string | null;
  completedAt: string | null;
  reason: string | null;
  note: string | null;
  createdById: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  createdBy?: UserSummary;
  items?: DismantleItem[];
  _count?: { items: number };
}

// ================================
// Filter Params
// ================================

export interface CustomerFilterParams extends PaginationParams {
  isActive?: boolean;
}

export interface InstallationFilterParams extends PaginationParams {
  customerId?: number;
  status?: TransactionStatus;
}

export interface MaintenanceFilterParams extends PaginationParams {
  customerId?: number;
  status?: TransactionStatus;
}

export interface DismantleFilterParams extends PaginationParams {
  customerId?: number;
  status?: TransactionStatus;
}
