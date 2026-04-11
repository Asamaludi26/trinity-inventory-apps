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
