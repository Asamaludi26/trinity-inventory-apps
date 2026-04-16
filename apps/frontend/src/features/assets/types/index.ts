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

export interface CategoryDivision {
  division: { id: number; name: string; code: string };
}

export interface AssetCategory {
  id: number;
  name: string;
  defaultClassification: AssetClassification;
  isCustomerInstallable: boolean;
  isProjectAsset: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  divisions?: CategoryDivision[];
  _count?: { types: number; assets: number };
}

export interface AssetType {
  id: number;
  categoryId: number;
  name: string;
  classification: AssetClassification | null;
  trackingMethod: TrackingMethod | null;
  unitOfMeasure: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  category?: Pick<AssetCategory, 'id' | 'name' | 'defaultClassification'>;
  _count?: { models: number; assets: number };
}

export type BulkTrackingType = 'COUNT' | 'MEASUREMENT';

export interface AssetModel {
  id: number;
  typeId: number;
  name: string;
  brand: string;
  unit: string | null;
  containerUnit: string | null;
  containerSize: string | null;
  bulkType: BulkTrackingType | null;
  isInstallationTemplate: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  type?: AssetType;
  _count?: { assets: number };
}

// ================================
// Core Asset
// ================================

export interface AssetRecording {
  id: number;
  docNumber: string;
  recordedAt: string;
  recordedBy?: UserSummary;
  note: string | null;
}

export interface AssetHistory {
  id: number;
  assetId: string;
  action: string;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  note: string | null;
  changedBy?: UserSummary;
  createdAt: string;
}

export interface Asset {
  id: string;
  code: string;
  name: string;
  categoryId: number;
  typeId: number | null;
  modelId: number | null;
  brand: string;
  classification: AssetClassification;
  trackingMethod: TrackingMethod | null;
  serialNumber: string | null;
  macAddress: string | null;
  quantity: number | null;
  currentBalance: string | null;
  purchasePrice: string | null;
  purchaseDate: string | null;
  depreciationMethod: DepreciationMethod | null;
  usefulLifeYears: number | null;
  salvageValue: string | null;
  status: AssetStatus;
  condition: AssetCondition;
  location: string | null;
  locationDetail: string | null;
  locationNote: string | null;
  recordingSource: RecordingSource;
  recordingId: number | null;
  currentUserId: number | null;
  recordedById: number;
  note: string | null;
  isDeleted: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  category?: AssetCategory;
  type?: AssetType;
  model?: AssetModel;
  currentUser?: UserSummary;
  recordedBy?: UserSummary;
  recording?: AssetRecording;
}

export type RecordingSource = 'REQUEST' | 'MANUAL';

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
  warningQuantity: number | null;
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
  warningQuantity?: number;
  totalPrice?: number;
}

// ================================
// Filter Params
// ================================

export type AssetViewMode = 'group' | 'list';

export interface AssetFilterParams extends PaginationParams {
  categoryId?: number;
  typeId?: number;
  modelId?: number;
  status?: AssetStatus;
  condition?: AssetCondition;
  view?: AssetViewMode;
}

export interface AssetGroup {
  recording: {
    id: number | null;
    docNumber: string;
    recordedAt: string;
    recordedBy: UserSummary | null;
    note: string | null;
  };
  assets: Asset[];
  assetCount: number;
}

export interface StockDetailTotal {
  model: { id: number; name: string; brand: string };
  byStatus: { status: AssetStatus; count: number }[];
  byLocation: { location: string; count: number }[];
  byCondition: { condition: AssetCondition; count: number }[];
}

export interface StockDetailUsageItem {
  id: string;
  code: string;
  name: string;
  serialNumber: string | null;
  currentUser?: { id: number; fullName: string; employeeId: string | null };
}

export interface StockHistoryItem {
  id: string;
  type: MovementType;
  quantity: number;
  reference: string | null;
  note: string | null;
  createdAt: string;
  asset?: { id: string; code: string; name: string };
  createdBy?: UserSummary;
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

// ================================
// Asset Classification & Tracking
// ================================

export type AssetClassification = 'ASSET' | 'MATERIAL';
export type TrackingMethod = 'INDIVIDUAL' | 'COUNT' | 'MEASUREMENT';

export interface AssetWithClassification extends Asset {
  classification: AssetClassification;
  trackingMethod: TrackingMethod;
  quantity: number;
  currentBalance: number;
}

// ================================
// Purchase Extended
// ================================

export interface PurchaseDetailView extends PurchaseMasterData {
  modelDetails?: AssetModel & {
    typeDetails?: AssetType & {
      categoryDetails?: AssetCategory;
    };
  };
  depreciationDetails?: Depreciation & {
    schedule?: DepreciationScheduleEntry[];
    currentStatus?: DepreciationStatusData;
  };
}

// ================================
// Depreciation Extended
// ================================

export interface DepreciationScheduleEntry {
  month: number;
  year: number;
  beginningValue: string;
  depreciation: string;
  endingValue: string;
  cumulativeDepreciation: string;
}

export interface DepreciationStatusData {
  assetId: string;
  currentMonth: number;
  currentYear: number;
  currentValue: string;
  cumulativeDepreciation: string;
  remainingUsefulLife: number;
  totalDepreciationSchedule: number;
  completedMonths: number;
}

export interface DepreciationWithDetails extends Depreciation {
  schedule?: DepreciationScheduleEntry[];
  currentStatus?: DepreciationStatusData;
}

// ================================
// Batch Registration
// ================================

export interface BatchAssetRegistration {
  documentNumber: string; // REG-YYYY-MM-XXXX
  modelId: number;
  serialNumbers: string[];
  quantity: number;
  purchasePrice?: string;
  purchaseDate?: string;
  status: AssetStatus;
  condition: AssetCondition;
  createdById: number;
  createdAt: string;
  updatedAt: string;
  assetIds?: string[]; // Created asset IDs
}

// ================================
// Stock Movement
// ================================

export type MovementType =
  | 'NEW_STOCK'
  | 'INSTALLATION'
  | 'DEINSTALLATION'
  | 'LOAN_OUT'
  | 'LOAN_RETURN'
  | 'DISMANTLE'
  | 'DISMANTLE_RETURN'
  | 'MAINTENANCE'
  | 'REPAIR'
  | 'ADJUSTMENT'
  | 'CONSUMPTION'
  | 'DECOMMISSION';

export interface StockMovement {
  id: string;
  assetId: string;
  type: MovementType;
  quantity: number;
  beforeQuantity: number;
  afterQuantity: number;
  notes: string | null;
  createdAt: string;
}

// ================================
// Threshold Alerts
// ================================

export interface ThresholdAlert {
  id: string;
  modelId: number;
  currentQuantity: number;
  minQuantity: number;
  isAlert: boolean;
  lastCheckedAt: string;
  model?: AssetModel;
}
