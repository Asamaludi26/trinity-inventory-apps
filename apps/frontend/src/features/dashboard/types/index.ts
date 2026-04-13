// ================================
// Dashboard Types
// ================================

export interface DashboardStats {
  totalAssets: number;
  pendingRequests: number;
  activeLoans: number;
  damagedAssets: number;
  underRepair: number;
  lowStockAlerts: number;
}

export interface FinanceDashboardStats {
  totalPurchases: number;
  monthlyDepreciation: number;
  remainingBudget: number;
  pendingApprovals: number;
}

export interface CategorySpending {
  category: string;
  totalSpent: number;
  fill: string;
}

export interface DailyOpsStats {
  handovers: number;
  loanRequests: number;
  returns: number;
  requests: number;
}

export interface OperationsDashboardStats {
  totalAssets: number;
  criticalStock: number;
  overdueLoans: number;
  underRepair: number;
}

export interface DivisionDashboardStats {
  divisionAssets: number;
  pendingRequests: number;
  activeMembers: number;
  teamLoans: number;
}

export interface PersonalDashboardStats {
  myAssets: number;
  activeLoans: number;
  pendingReturns: number;
}

export interface RecentActivity {
  id: string;
  type: 'request' | 'loan' | 'handover' | 'repair' | 'return';
  documentNo: string;
  description: string;
  userName: string;
  userRole: string;
  status: string;
  createdAt: string;
}

export interface AssetTrendData {
  month: string;
  total: number;
  added: number;
  removed: number;
}

export interface AssetCategoryDistribution {
  category: string;
  count: number;
  fill: string;
}

export interface StockAlertItem {
  id: number;
  modelName: string;
  brand: string;
  currentStock: number;
  threshold: number;
  status: 'CRITICAL' | 'WARNING' | 'SAFE';
}

export interface DivisionMemberAsset {
  id: number;
  fullName: string;
  role: string;
  assetCount: number;
  lastAsset: string;
}

export interface PersonalAssetItem {
  id: number;
  name: string;
  category: string;
  condition: string;
  assignedAt: string;
}

export interface PendingReturnItem {
  id: number;
  assetName: string;
  loanDate: string;
  dueDate: string;
  isOverdue: boolean;
}
