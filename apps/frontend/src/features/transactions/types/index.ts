import type { TransactionStatus, AssetCondition, PaginationParams, UserSummary } from '@/types';
import type { AssetModel } from '../assets/types';

// ================================
// Request (Permintaan Baru)
// ================================

export interface Request {
  id: string;
  code: string;
  title: string;
  description: string | null;
  status: TransactionStatus;
  priority: string;
  projectId: string | null;
  createdById: number;
  approvalChain: ApprovalStep[] | null;
  rejectionReason: string | null;
  isDeleted: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: UserSummary;
  items?: RequestItem[];
}

export interface RequestItem {
  id: number;
  requestId: string;
  modelId: number | null;
  description: string;
  quantity: number;
  note: string | null;
  model?: AssetModel;
}

// ================================
// Loan (Peminjaman)
// ================================

export interface LoanRequest {
  id: string;
  code: string;
  purpose: string;
  status: TransactionStatus;
  expectedReturn: string | null;
  createdById: number;
  approvalChain: ApprovalStep[] | null;
  rejectionReason: string | null;
  isDeleted: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: UserSummary;
  items?: LoanItem[];
}

export interface LoanItem {
  id: number;
  loanRequestId: string;
  modelId: number | null;
  description: string;
  quantity: number;
  model?: AssetModel;
}

// ================================
// Return (Pengembalian)
// ================================

export interface AssetReturn {
  id: string;
  code: string;
  loanRequestId: string;
  status: TransactionStatus;
  note: string | null;
  createdById: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  loanRequest?: LoanRequest;
  createdBy?: UserSummary;
  items?: AssetReturnItem[];
}

export interface AssetReturnItem {
  id: number;
  returnId: string;
  assetId: string;
  conditionBefore: AssetCondition;
  conditionAfter: AssetCondition;
  note: string | null;
}

// ================================
// Handover (Serah Terima)
// ================================

export interface Handover {
  id: string;
  code: string;
  status: TransactionStatus;
  fromUserId: number;
  toUserId: number;
  witnessUserId: number | null;
  note: string | null;
  approvalChain: ApprovalStep[] | null;
  rejectionReason: string | null;
  isDeleted: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  fromUser?: UserSummary;
  toUser?: UserSummary;
  witnessUser?: UserSummary;
  items?: HandoverItem[];
}

export interface HandoverItem {
  id: number;
  handoverId: string;
  assetId: string;
  note: string | null;
}

// ================================
// Project (Proyek Infrastruktur)
// ================================

export interface InfraProject {
  id: string;
  code: string;
  name: string;
  description: string | null;
  status: TransactionStatus;
  startDate: string | null;
  endDate: string | null;
  location: string | null;
  customerId: number | null;
  createdById: number;
  isDeleted: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: UserSummary;
  tasks?: InfraProjectTask[];
  materials?: InfraProjectMaterial[];
  team?: InfraProjectTeamMember[];
}

export interface InfraProjectTask {
  id: number;
  projectId: string;
  title: string;
  description: string | null;
  status: string;
  assigneeId: number | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InfraProjectMaterial {
  id: number;
  projectId: string;
  modelId: number | null;
  description: string;
  quantity: number;
  note: string | null;
}

export interface InfraProjectTeamMember {
  id: number;
  projectId: string;
  userId: number;
  role: string;
  joinedAt: string;
}

// ================================
// Repair (Lapor Rusak)
// ================================

export interface Repair {
  id: string;
  code: string;
  assetId: string;
  status: TransactionStatus;
  issueDescription: string;
  repairAction: string | null;
  repairCost: string | null;
  repairVendor: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdById: number;
  isDeleted: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: UserSummary;
}

// ================================
// Approval Chain (Shared)
// ================================

export interface ApprovalStep {
  step: number;
  role: string;
  userId: number | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  decidedAt: string | null;
  note: string | null;
}

// ================================
// Filter Params
// ================================

export interface TransactionFilterParams extends PaginationParams {
  status?: TransactionStatus;
}

export interface RequestFilterParams extends TransactionFilterParams {
  priority?: string;
}

export interface LoanFilterParams extends TransactionFilterParams {
  isOverdue?: boolean;
}

export interface ProjectFilterParams extends TransactionFilterParams {
  customerId?: number;
}
