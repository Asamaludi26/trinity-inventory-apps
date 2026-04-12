// ================================
// Global TypeScript Types
// ================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ApiError {
  success: false;
  statusCode: number;
  message: string | string[];
  timestamp: string;
  path: string;
}

export type UserRole = 'SUPERADMIN' | 'ADMIN_LOGISTIK' | 'ADMIN_PURCHASE' | 'LEADER' | 'STAFF';

export type AssetStatus =
  | 'IN_STORAGE'
  | 'IN_USE'
  | 'IN_CUSTODY'
  | 'UNDER_REPAIR'
  | 'OUT_FOR_REPAIR'
  | 'DAMAGED'
  | 'LOST'
  | 'DECOMMISSIONED'
  | 'CONSUMED';

export type TransactionStatus =
  | 'PENDING'
  | 'LOGISTIC_APPROVED'
  | 'AWAITING_CEO_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'PURCHASING'
  | 'IN_DELIVERY'
  | 'ARRIVED'
  | 'AWAITING_HANDOVER'
  | 'IN_PROGRESS'
  | 'COMPLETED';

export type AssetCondition = 'NEW' | 'GOOD' | 'FAIR' | 'POOR' | 'BROKEN';

export type DepreciationMethod = 'STRAIGHT_LINE' | 'DECLINING_BALANCE';

export type MovementType = 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT';

export type NotificationType =
  | 'INFO'
  | 'WARNING'
  | 'APPROVAL_REQUIRED'
  | 'STATUS_CHANGE'
  | 'REMINDER';

// ================================
// Settings Types
// ================================

export interface Division {
  id: number;
  uuid: string;
  name: string;
  code: string;
  description: string | null;
  canDoFieldwork: boolean;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  userCount?: number;
  users?: UserSummary[];
}

export interface DivisionSummary {
  id: number;
  uuid: string;
  name: string;
  code: string;
}

export interface UserSummary {
  id: number;
  uuid: string;
  fullName: string;
  email: string;
  role: UserRole;
}

export interface User {
  id: number;
  uuid: string;
  employeeId: string;
  fullName: string;
  email: string;
  role: UserRole;
  phone: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  division: DivisionSummary | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// ================================
// Notification Types
// ================================

export interface Notification {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
}

// ================================
// Attachment Types
// ================================

export interface Attachment {
  id: number;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  entityType: string;
  entityId: string;
  uploadedById: number;
  createdAt: string;
  uploadedBy?: { id: number; fullName: string };
}
