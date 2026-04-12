import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import {
  AssetCondition,
  AssetStatus,
  TransactionStatus,
} from '../../generated/prisma/client';

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

// Color palette for category distribution chart
const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(210, 70%, 55%)',
  'hsl(280, 60%, 55%)',
  'hsl(30, 80%, 55%)',
];

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  // ──────────────── Superadmin Dashboard ────────────────

  async getStats() {
    const [totalAssets, pendingRequests, activeLoans, damagedAssets] =
      await Promise.all([
        this.prisma.asset.count({ where: { isDeleted: false } }),
        this.prisma.request.count({
          where: {
            isDeleted: false,
            status: { in: PENDING_APPROVAL_STATUSES },
          },
        }),
        this.prisma.loanRequest.count({
          where: {
            isDeleted: false,
            status: { in: ACTIVE_TRANSACTION_STATUSES },
          },
        }),
        this.prisma.asset.count({
          where: {
            isDeleted: false,
            condition: { in: [AssetCondition.BROKEN, AssetCondition.POOR] },
          },
        }),
      ]);

    const lowStockAlerts = await this.getLowStockAlertCount();

    return {
      totalAssets,
      pendingRequests,
      activeLoans,
      damagedAssets,
      lowStockAlerts,
    };
  }

  async getRecentActivity(limit: number) {
    const logs = await this.prisma.activityLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { fullName: true, role: true } },
      },
    });

    return logs.map((log) => ({
      id: String(log.id),
      type: this.mapEntityTypeToActivityType(log.entityType),
      documentNo: log.entityId,
      description: `${log.action} ${log.entityType}`,
      userName: log.user.fullName,
      userRole: log.user.role,
      status: log.action,
      createdAt: log.createdAt.toISOString(),
    }));
  }

  async getAssetTrend(months: number) {
    const now = new Date();
    const results: Array<{
      month: string;
      total: number;
      added: number;
      removed: number;
    }> = [];

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endDate = new Date(
        now.getFullYear(),
        now.getMonth() - i + 1,
        0,
        23,
        59,
        59,
      );
      const monthLabel = date.toLocaleDateString('id-ID', {
        month: 'short',
        year: 'numeric',
      });

      const [added, removed, total] = await Promise.all([
        this.prisma.asset.count({
          where: {
            isDeleted: false,
            createdAt: { gte: date, lte: endDate },
          },
        }),
        this.prisma.asset.count({
          where: {
            isDeleted: true,
            updatedAt: { gte: date, lte: endDate },
          },
        }),
        this.prisma.asset.count({
          where: {
            isDeleted: false,
            createdAt: { lte: endDate },
          },
        }),
      ]);

      results.push({ month: monthLabel, total, added, removed });
    }

    return results;
  }

  async getCategoryDistribution() {
    const groups = await this.prisma.asset.groupBy({
      by: ['categoryId'],
      where: { isDeleted: false },
      _count: { id: true },
    });

    const categoryIds = groups.map((g) => g.categoryId);
    const categories = await this.prisma.assetCategory.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true },
    });
    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

    return groups.map((g, idx) => ({
      category: categoryMap.get(g.categoryId) ?? 'Unknown',
      count: g._count.id,
      fill: CHART_COLORS[idx % CHART_COLORS.length],
    }));
  }

  // ──────────────── Finance Dashboard ────────────────

  async getFinanceStats() {
    const now = new Date();

    const [totalPurchases, depreciations, pendingApprovals] = await Promise.all(
      [
        this.prisma.purchaseMasterData.count({ where: { isDeleted: false } }),
        this.prisma.depreciation.findMany({
          where: {
            startDate: { lte: now },
          },
          include: {
            purchase: { select: { totalPrice: true } },
          },
        }),
        this.countPendingApprovals(),
      ],
    );

    // Calculate monthly depreciation (straight-line simplified)
    let monthlyDepreciation = 0;
    for (const dep of depreciations) {
      if (dep.usefulLifeYears > 0) {
        const totalPrice = Number(dep.purchase.totalPrice);
        const salvageValue = Number(dep.salvageValue);
        const monthly =
          (totalPrice - salvageValue) / (dep.usefulLifeYears * 12);
        monthlyDepreciation += monthly;
      }
    }

    return {
      totalPurchases,
      monthlyDepreciation: Math.round(monthlyDepreciation),
      remainingBudget: 0, // Budget management not yet implemented
      pendingApprovals,
    };
  }

  // ──────────────── Operations Dashboard ────────────────

  async getOperationsStats() {
    const now = new Date();

    const [totalAssets, underRepair, overdueLoans, criticalStock] =
      await Promise.all([
        this.prisma.asset.count({ where: { isDeleted: false } }),
        this.prisma.asset.count({
          where: { isDeleted: false, status: AssetStatus.UNDER_REPAIR },
        }),
        this.prisma.loanRequest.count({
          where: {
            isDeleted: false,
            status: { in: ACTIVE_TRANSACTION_STATUSES },
            expectedReturn: { lt: now },
          },
        }),
        this.getLowStockAlertCount(),
      ]);

    return { totalAssets, criticalStock, overdueLoans, underRepair };
  }

  async getStockAlerts() {
    const alerts = await this.getLowStockAlerts();
    return alerts.map((alert) => ({
      id: alert.modelId,
      modelName: alert.modelName,
      brand: alert.brand,
      currentStock: alert.currentStock,
      threshold: alert.minQuantity,
      status: this.getStockAlertStatus(alert.currentStock, alert.minQuantity),
    }));
  }

  // ──────────────── Division Dashboard ────────────────

  async getDivisionStats(userId: number, divisionId: number) {
    const members = await this.prisma.user.findMany({
      where: { divisionId, isActive: true, isDeleted: false },
      select: { id: true },
    });
    const memberIds = members.map((m) => m.id);

    const [divisionAssets, pendingRequests, teamLoans] = await Promise.all([
      this.prisma.asset.count({
        where: {
          isDeleted: false,
          currentUserId: { in: memberIds },
        },
      }),
      this.prisma.request.count({
        where: {
          isDeleted: false,
          createdById: { in: memberIds },
          status: { in: PENDING_APPROVAL_STATUSES },
        },
      }),
      this.prisma.loanRequest.count({
        where: {
          isDeleted: false,
          createdById: { in: memberIds },
          status: { in: ACTIVE_TRANSACTION_STATUSES },
        },
      }),
    ]);

    return {
      divisionAssets,
      pendingRequests,
      activeMembers: members.length,
      teamLoans,
    };
  }

  async getDivisionMembers(divisionId: number) {
    const members = await this.prisma.user.findMany({
      where: { divisionId, isActive: true, isDeleted: false },
      select: {
        id: true,
        fullName: true,
        role: true,
        currentAssets: {
          where: { isDeleted: false },
          select: { id: true, name: true },
          orderBy: { updatedAt: 'desc' },
        },
      },
    });

    return members.map((m) => ({
      id: m.id,
      fullName: m.fullName,
      role: m.role,
      assetCount: m.currentAssets.length,
      lastAsset: m.currentAssets[0]?.name ?? '-',
    }));
  }

  // ──────────────── Personal Dashboard ────────────────

  async getPersonalStats(userId: number) {
    const [myAssets, activeLoans, pendingReturns] = await Promise.all([
      this.prisma.asset.count({
        where: { isDeleted: false, currentUserId: userId },
      }),
      this.prisma.loanRequest.count({
        where: {
          isDeleted: false,
          createdById: userId,
          status: { in: ACTIVE_TRANSACTION_STATUSES },
        },
      }),
      this.prisma.loanRequest.count({
        where: {
          isDeleted: false,
          createdById: userId,
          status: TransactionStatus.APPROVED,
          expectedReturn: { not: null },
        },
      }),
    ]);

    return { myAssets, activeLoans, pendingReturns };
  }

  async getPersonalAssets(userId: number) {
    const assets = await this.prisma.asset.findMany({
      where: { isDeleted: false, currentUserId: userId },
      select: {
        id: true,
        name: true,
        condition: true,
        updatedAt: true,
        category: { select: { name: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return assets.map((a) => ({
      id: a.id,
      name: a.name,
      category: a.category.name,
      condition: a.condition,
      assignedAt: a.updatedAt.toISOString(),
    }));
  }

  async getPersonalPendingReturns(userId: number) {
    const now = new Date();
    const loans = await this.prisma.loanRequest.findMany({
      where: {
        isDeleted: false,
        createdById: userId,
        status: { in: ACTIVE_TRANSACTION_STATUSES },
        expectedReturn: { not: null },
      },
      select: {
        id: true,
        createdAt: true,
        expectedReturn: true,
        assetAssignments: {
          select: {
            asset: { select: { name: true } },
          },
          take: 1,
        },
      },
      orderBy: { expectedReturn: 'asc' },
    });

    return loans.map((loan) => ({
      id: loan.id,
      assetName: loan.assetAssignments[0]?.asset.name ?? '-',
      loanDate: loan.createdAt.toISOString(),
      dueDate: loan.expectedReturn!.toISOString(),
      isOverdue: loan.expectedReturn! < now,
    }));
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

  private async getLowStockAlertCount(): Promise<number> {
    const alerts = await this.getLowStockAlerts();
    return alerts.length;
  }

  private getStockAlertStatus(
    currentStock: number,
    minQuantity: number,
  ): 'CRITICAL' | 'WARNING' | 'SAFE' {
    const ratio = currentStock / minQuantity;
    if (ratio === 0) return 'CRITICAL';
    if (ratio < 0.5) return 'CRITICAL';
    if (ratio < 1) return 'WARNING';
    return 'SAFE';
  }

  private mapEntityTypeToActivityType(
    entityType: string,
  ): 'request' | 'loan' | 'handover' | 'repair' | 'return' {
    const map: Record<
      string,
      'request' | 'loan' | 'handover' | 'repair' | 'return'
    > = {
      Request: 'request',
      LoanRequest: 'loan',
      Handover: 'handover',
      AssetReturn: 'return',
      RepairReport: 'repair',
    };
    return map[entityType] ?? 'request';
  }
}
