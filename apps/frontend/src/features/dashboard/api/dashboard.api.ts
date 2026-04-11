import { api } from '@/lib/axios';
import type {
  DashboardStats,
  FinanceDashboardStats,
  OperationsDashboardStats,
  DivisionDashboardStats,
  PersonalDashboardStats,
  RecentActivity,
  AssetTrendData,
  AssetCategoryDistribution,
  StockAlertItem,
  DivisionMemberAsset,
  PersonalAssetItem,
  PendingReturnItem,
} from '../types';
import type { ApiResponse } from '@/types';

export const dashboardApi = {
  // Super Admin
  getStats: () => api.get<ApiResponse<DashboardStats>>('/dashboard/stats'),
  getRecentActivity: (limit = 10) =>
    api.get<ApiResponse<RecentActivity[]>>('/dashboard/recent-activity', {
      params: { limit },
    }),
  getAssetTrend: (months = 6) =>
    api.get<ApiResponse<AssetTrendData[]>>('/dashboard/asset-trend', {
      params: { months },
    }),
  getCategoryDistribution: () =>
    api.get<ApiResponse<AssetCategoryDistribution[]>>('/dashboard/category-distribution'),

  // Admin Purchase
  getFinanceStats: () => api.get<ApiResponse<FinanceDashboardStats>>('/dashboard/finance/stats'),

  // Admin Logistik
  getOperationsStats: () =>
    api.get<ApiResponse<OperationsDashboardStats>>('/dashboard/operations/stats'),
  getStockAlerts: () =>
    api.get<ApiResponse<StockAlertItem[]>>('/dashboard/operations/stock-alerts'),

  // Leader
  getDivisionStats: () => api.get<ApiResponse<DivisionDashboardStats>>('/dashboard/division/stats'),
  getDivisionMembers: () =>
    api.get<ApiResponse<DivisionMemberAsset[]>>('/dashboard/division/members'),

  // Staff
  getPersonalStats: () => api.get<ApiResponse<PersonalDashboardStats>>('/dashboard/personal/stats'),
  getMyAssets: () => api.get<ApiResponse<PersonalAssetItem[]>>('/dashboard/personal/assets'),
  getPendingReturns: () =>
    api.get<ApiResponse<PendingReturnItem[]>>('/dashboard/personal/pending-returns'),
};
