import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { AssetStatus, TransactionStatus } from '../../generated/prisma/client';

// Status sets for reusable filtering
const ACTIVE_TRANSACTION_STATUSES: TransactionStatus[] = [
  TransactionStatus.PENDING,
  TransactionStatus.LOGISTIC_APPROVED,
  TransactionStatus.AWAITING_CEO_APPROVAL,
  TransactionStatus.APPROVED,
  TransactionStatus.PURCHASING,
  TransactionStatus.IN_DELIVERY,
  TransactionStatus.ARRIVED,
  TransactionStatus.AWAITING_HANDOVER,
  TransactionStatus.IN_PROGRESS,
];

const PENDING_APPROVAL_STATUSES: TransactionStatus[] = [
  TransactionStatus.PENDING,
  TransactionStatus.LOGISTIC_APPROVED,
  TransactionStatus.AWAITING_CEO_APPROVAL,
];

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * GET /dashboard/main — Superadmin
   * Overview seluruh sistem: total aset, user, transaksi, distribusi, recent activity
   */
  async getMainDashboard(): Promise<Record<string, unknown>> {
    const [
      totalAssets,
      assetsByStatus,
      assetsByCategory,
      totalUsers,
      activeUsers,
      totalDivisions,
      activeRequests,
      activeLoans,
      pendingApprovals,
      recentActivity,
      lowStockAlerts,
    ] = await Promise.all([
      // Total aset aktif
      this.prisma.asset.count({
        where: { isDeleted: false },
      }),

      // Distribusi aset per status
      this.prisma.asset.groupBy({
        by: ['status'],
        where: { isDeleted: false },
        _count: { id: true },
      }),

      // Distribusi aset per kategori
      this.prisma.asset.groupBy({
        by: ['categoryId'],
        where: { isDeleted: false },
        _count: { id: true },
      }),

      // Total users
      this.prisma.user.count({
        where: { isDeleted: false },
      }),

      // Active users
      this.prisma.user.count({
        where: { isActive: true, isDeleted: false },
      }),

      // Total divisi
      this.prisma.division.count({
        where: { isDeleted: false },
      }),

      // Transaksi request aktif
      this.prisma.request.count({
        where: {
          isDeleted: false,
          status: { in: ACTIVE_TRANSACTION_STATUSES },
        },
      }),

      // Peminjaman aktif
      this.prisma.loanRequest.count({
        where: {
          isDeleted: false,
          status: { in: ACTIVE_TRANSACTION_STATUSES },
        },
      }),

      // Pending approvals (requests + loans + handovers)
      this.countPendingApprovals(),

      // Recent activity (last 10)
      this.prisma.activityLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, fullName: true, role: true } },
        },
      }),

      // Low stock alerts
      this.getLowStockAlerts(),
    ]);

    // Resolve category names
    const categoryIds = assetsByCategory.map((c) => c.categoryId);
    const categories = await this.prisma.assetCategory.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true },
    });
    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

    return {
      summary: {
        totalAssets,
        totalUsers,
        activeUsers,
        totalDivisions,
        activeRequests,
        activeLoans,
        pendingApprovals,
      },
      assetsByStatus: assetsByStatus.map((s) => ({
        status: s.status,
        count: s._count.id,
      })),
      assetsByCategory: assetsByCategory.map((c) => ({
        categoryId: c.categoryId,
        categoryName: categoryMap.get(c.categoryId) ?? 'Unknown',
        count: c._count.id,
      })),
      recentActivity,
      lowStockAlerts,
    };
  }

  /**
   * GET /dashboard/finance — Admin Purchase
   * Ringkasan pembelian & depresiasi
   */
  async getFinanceDashboard(): Promise<Record<string, unknown>> {
    const [
      totalPurchases,
      purchaseValueAgg,
      totalDepreciations,
      recentPurchases,
      assetsByCondition,
    ] = await Promise.all([
      // Total data pembelian
      this.prisma.purchaseMasterData.count({
        where: { isDeleted: false },
      }),

      // Aggregate purchase value
      this.prisma.purchaseMasterData.aggregate({
        where: { isDeleted: false },
        _sum: { totalPrice: true },
        _avg: { unitPrice: true },
        _count: { id: true },
      }),

      // Total depresiasi terdaftar
      this.prisma.depreciation.count(),

      // Recent purchases (last 10)
      this.prisma.purchaseMasterData.findMany({
        where: { isDeleted: false },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          model: { select: { id: true, name: true, brand: true } },
          createdBy: { select: { id: true, fullName: true } },
        },
      }),

      // Aset per kondisi
      this.prisma.asset.groupBy({
        by: ['condition'],
        where: { isDeleted: false },
        _count: { id: true },
      }),
    ]);

    return {
      summary: {
        totalPurchases,
        totalPurchaseValue: purchaseValueAgg._sum.totalPrice,
        averageUnitPrice: purchaseValueAgg._avg.unitPrice,
        totalDepreciations,
      },
      assetsByCondition: assetsByCondition.map((c) => ({
        condition: c.condition,
        count: c._count.id,
      })),
      recentPurchases,
    };
  }

  /**
   * GET /dashboard/operations — Admin Logistik
   * Stok, transaksi aktif, low stock alerts
   */
  async getOperationsDashboard(): Promise<Record<string, unknown>> {
    const [
      totalAssetsInStorage,
      totalAssetsInUse,
      totalAssetsUnderRepair,
      activeRequests,
      activeLoans,
      activeHandovers,
      pendingApprovals,
      recentMovements,
      lowStockAlerts,
    ] = await Promise.all([
      this.prisma.asset.count({
        where: { isDeleted: false, status: AssetStatus.IN_STORAGE },
      }),
      this.prisma.asset.count({
        where: { isDeleted: false, status: AssetStatus.IN_USE },
      }),
      this.prisma.asset.count({
        where: { isDeleted: false, status: AssetStatus.UNDER_REPAIR },
      }),

      // Request aktif
      this.prisma.request.count({
        where: {
          isDeleted: false,
          status: { in: ACTIVE_TRANSACTION_STATUSES },
        },
      }),

      // Loan aktif
      this.prisma.loanRequest.count({
        where: {
          isDeleted: false,
          status: { in: ACTIVE_TRANSACTION_STATUSES },
        },
      }),

      // Handover aktif
      this.prisma.handover.count({
        where: {
          isDeleted: false,
          status: { in: ACTIVE_TRANSACTION_STATUSES },
        },
      }),

      // Pending approvals
      this.countPendingApprovals(),

      // Recent stock movements (last 10)
      this.prisma.stockMovement.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          asset: { select: { id: true, code: true, name: true } },
          createdBy: { select: { id: true, fullName: true } },
        },
      }),

      // Low stock alerts
      this.getLowStockAlerts(),
    ]);

    return {
      summary: {
        totalAssetsInStorage,
        totalAssetsInUse,
        totalAssetsUnderRepair,
        activeRequests,
        activeLoans,
        activeHandovers,
        pendingApprovals,
      },
      recentMovements,
      lowStockAlerts,
    };
  }

  /**
   * GET /dashboard/division — Leader
   * Data aset & transaksi khusus divisi user
   */
  async getDivisionDashboard(
    userId: number,
    divisionId: number | null,
  ): Promise<Record<string, unknown>> {
    // Dapatkan semua member divisi
    const divisionMembers = divisionId
      ? await this.prisma.user.findMany({
          where: { divisionId, isActive: true, isDeleted: false },
          select: { id: true, fullName: true, role: true },
        })
      : [];

    const memberIds = divisionMembers.map((m) => m.id);

    const [
      divisionAssets,
      divisionAssetsByStatus,
      divisionActiveRequests,
      divisionActiveLoans,
      divisionPendingApprovals,
    ] = await Promise.all([
      // Aset yang dipegang member divisi
      this.prisma.asset.count({
        where: {
          isDeleted: false,
          currentUserId: { in: memberIds },
        },
      }),

      // Distribusi per status
      this.prisma.asset.groupBy({
        by: ['status'],
        where: {
          isDeleted: false,
          currentUserId: { in: memberIds },
        },
        _count: { id: true },
      }),

      // Request aktif divisi
      this.prisma.request.count({
        where: {
          isDeleted: false,
          createdById: { in: memberIds },
          status: { in: ACTIVE_TRANSACTION_STATUSES },
        },
      }),

      // Loan aktif divisi
      this.prisma.loanRequest.count({
        where: {
          isDeleted: false,
          createdById: { in: memberIds },
          status: { in: ACTIVE_TRANSACTION_STATUSES },
        },
      }),

      // Pending approval (yang perlu di-approve oleh leader ini)
      this.prisma.request.count({
        where: {
          isDeleted: false,
          createdById: { in: memberIds, not: userId },
          status: { in: PENDING_APPROVAL_STATUSES },
        },
      }),
    ]);

    return {
      summary: {
        totalMembers: divisionMembers.length,
        divisionAssets,
        divisionActiveRequests,
        divisionActiveLoans,
        divisionPendingApprovals,
      },
      assetsByStatus: divisionAssetsByStatus.map((s) => ({
        status: s.status,
        count: s._count.id,
      })),
      members: divisionMembers,
    };
  }

  /**
   * GET /dashboard/personal — Staff
   * Aset pribadi, pinjaman aktif, riwayat transaksi
   */
  async getPersonalDashboard(userId: number): Promise<Record<string, unknown>> {
    const [
      myAssets,
      myAssetsByStatus,
      myActiveRequests,
      myActiveLoans,
      myRecentRequests,
      myRecentLoans,
      unreadNotifications,
    ] = await Promise.all([
      // Aset yang saya pegang
      this.prisma.asset.count({
        where: { isDeleted: false, currentUserId: userId },
      }),

      // Distribusi per status
      this.prisma.asset.groupBy({
        by: ['status'],
        where: { isDeleted: false, currentUserId: userId },
        _count: { id: true },
      }),

      // Request aktif saya
      this.prisma.request.count({
        where: {
          isDeleted: false,
          createdById: userId,
          status: { in: ACTIVE_TRANSACTION_STATUSES },
        },
      }),

      // Loan aktif saya
      this.prisma.loanRequest.count({
        where: {
          isDeleted: false,
          createdById: userId,
          status: { in: ACTIVE_TRANSACTION_STATUSES },
        },
      }),

      // 5 request terbaru
      this.prisma.request.findMany({
        where: { createdById: userId, isDeleted: false },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          code: true,
          title: true,
          status: true,
          createdAt: true,
        },
      }),

      // 5 loan terbaru
      this.prisma.loanRequest.findMany({
        where: { createdById: userId, isDeleted: false },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          code: true,
          purpose: true,
          status: true,
          createdAt: true,
        },
      }),

      // Unread notifications
      this.prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return {
      summary: {
        myAssets,
        myActiveRequests,
        myActiveLoans,
        unreadNotifications,
      },
      assetsByStatus: myAssetsByStatus.map((s) => ({
        status: s.status,
        count: s._count.id,
      })),
      recentRequests: myRecentRequests,
      recentLoans: myRecentLoans,
    };
  }

  // ──────────────── Private Helpers ────────────────

  private async countPendingApprovals(): Promise<number> {
    const [requests, loans, handovers] = await Promise.all([
      this.prisma.request.count({
        where: {
          isDeleted: false,
          status: { in: PENDING_APPROVAL_STATUSES },
        },
      }),
      this.prisma.loanRequest.count({
        where: {
          isDeleted: false,
          status: { in: PENDING_APPROVAL_STATUSES },
        },
      }),
      this.prisma.handover.count({
        where: {
          isDeleted: false,
          status: { in: PENDING_APPROVAL_STATUSES },
        },
      }),
    ]);

    return requests + loans + handovers;
  }

  private async getLowStockAlerts(): Promise<
    Array<{
      modelId: number;
      modelName: string;
      brand: string;
      currentStock: number;
      minQuantity: number;
    }>
  > {
    const thresholds = await this.prisma.stockThreshold.findMany({
      include: {
        model: { select: { id: true, name: true, brand: true } },
      },
    });

    const alerts: Array<{
      modelId: number;
      modelName: string;
      brand: string;
      currentStock: number;
      minQuantity: number;
    }> = [];

    for (const threshold of thresholds) {
      const currentStock = await this.prisma.asset.count({
        where: {
          modelId: threshold.modelId,
          status: AssetStatus.IN_STORAGE,
          isDeleted: false,
        },
      });

      if (currentStock < threshold.minQuantity) {
        alerts.push({
          modelId: threshold.model.id,
          modelName: threshold.model.name,
          brand: threshold.model.brand,
          currentStock,
          minQuantity: threshold.minQuantity,
        });
      }
    }

    return alerts;
  }
}
