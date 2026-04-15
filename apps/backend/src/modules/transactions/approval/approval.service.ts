import {
  Injectable,
  Logger,
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { UserRole, TransactionStatus } from '../../../generated/prisma/client';

/**
 * Approval step definition in the matrix (template).
 */
interface ApprovalStepDef {
  sequence: number;
  approverRole: UserRole;
  type: 'APPROVAL' | 'CC';
}

/**
 * Approval step stored in transaction's approvalChain JsonB field.
 * Includes runtime status tracking.
 */
export interface ApprovalChainStep {
  sequence: number;
  approverRole: UserRole;
  type: 'APPROVAL' | 'CC';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SKIPPED';
  approvedById?: number;
  approvedByName?: string;
  approvedAt?: string;
  note?: string;
}

/**
 * Dynamic Approval Matrix per PRD 6.3
 *
 * Workflow 1: REQUEST (Permintaan Baru / Pengadaan)
 * Workflow 2: LOAN, RETURN, HANDOVER, REPAIR
 * Workflow 3: PROJECT, INSTALLATION, MAINTENANCE, DISMANTLE
 */
const APPROVAL_MATRIX: Record<
  string,
  Partial<Record<UserRole, ApprovalStepDef[]>>
> = {
  // Workflow 1: Permintaan Baru — longer chain (budget implication)
  REQUEST: {
    [UserRole.STAFF]: [
      { sequence: 1, approverRole: UserRole.LEADER, type: 'APPROVAL' },
      {
        sequence: 2,
        approverRole: UserRole.ADMIN_LOGISTIK,
        type: 'APPROVAL',
      },
      {
        sequence: 3,
        approverRole: UserRole.ADMIN_PURCHASE,
        type: 'APPROVAL',
      },
      { sequence: 4, approverRole: UserRole.SUPERADMIN, type: 'APPROVAL' },
    ],
    [UserRole.LEADER]: [
      {
        sequence: 1,
        approverRole: UserRole.ADMIN_LOGISTIK,
        type: 'APPROVAL',
      },
      {
        sequence: 2,
        approverRole: UserRole.ADMIN_PURCHASE,
        type: 'APPROVAL',
      },
      { sequence: 3, approverRole: UserRole.SUPERADMIN, type: 'APPROVAL' },
    ],
    [UserRole.ADMIN_LOGISTIK]: [
      {
        sequence: 1,
        approverRole: UserRole.ADMIN_PURCHASE,
        type: 'APPROVAL',
      },
      { sequence: 2, approverRole: UserRole.SUPERADMIN, type: 'APPROVAL' },
    ],
    [UserRole.ADMIN_PURCHASE]: [
      {
        sequence: 1,
        approverRole: UserRole.ADMIN_LOGISTIK,
        type: 'APPROVAL',
      },
      { sequence: 2, approverRole: UserRole.SUPERADMIN, type: 'APPROVAL' },
    ],
    [UserRole.SUPERADMIN]: [
      {
        sequence: 1,
        approverRole: UserRole.ADMIN_LOGISTIK,
        type: 'APPROVAL',
      },
      {
        sequence: 2,
        approverRole: UserRole.ADMIN_PURCHASE,
        type: 'APPROVAL',
      },
    ],
  },

  // Workflow 2: Peminjaman, Pengembalian, Serah Terima, Lapor Rusak
  LOAN: {
    [UserRole.STAFF]: [
      { sequence: 1, approverRole: UserRole.LEADER, type: 'APPROVAL' },
      {
        sequence: 2,
        approverRole: UserRole.ADMIN_LOGISTIK,
        type: 'APPROVAL',
      },
      { sequence: 99, approverRole: UserRole.SUPERADMIN, type: 'CC' },
    ],
    [UserRole.LEADER]: [
      {
        sequence: 1,
        approverRole: UserRole.ADMIN_LOGISTIK,
        type: 'APPROVAL',
      },
      { sequence: 99, approverRole: UserRole.SUPERADMIN, type: 'CC' },
    ],
    [UserRole.ADMIN_LOGISTIK]: [
      { sequence: 1, approverRole: UserRole.SUPERADMIN, type: 'APPROVAL' },
    ],
    [UserRole.ADMIN_PURCHASE]: [
      {
        sequence: 1,
        approverRole: UserRole.ADMIN_LOGISTIK,
        type: 'APPROVAL',
      },
      { sequence: 99, approverRole: UserRole.SUPERADMIN, type: 'CC' },
    ],
    [UserRole.SUPERADMIN]: [
      {
        sequence: 1,
        approverRole: UserRole.ADMIN_LOGISTIK,
        type: 'APPROVAL',
      },
    ],
  },

  // Workflow 3: Proyek Infrastruktur, Instalasi, Maintenance, Dismantle
  PROJECT: {
    [UserRole.STAFF]: [
      { sequence: 1, approverRole: UserRole.LEADER, type: 'APPROVAL' },
      {
        sequence: 2,
        approverRole: UserRole.ADMIN_LOGISTIK,
        type: 'APPROVAL',
      },
      { sequence: 99, approverRole: UserRole.SUPERADMIN, type: 'CC' },
    ],
    [UserRole.LEADER]: [
      {
        sequence: 1,
        approverRole: UserRole.ADMIN_LOGISTIK,
        type: 'APPROVAL',
      },
      { sequence: 99, approverRole: UserRole.SUPERADMIN, type: 'CC' },
    ],
  },
};

// Aliases — modules sharing the same workflow
APPROVAL_MATRIX['RETURN'] = APPROVAL_MATRIX['LOAN'];
APPROVAL_MATRIX['HANDOVER'] = APPROVAL_MATRIX['LOAN'];
APPROVAL_MATRIX['REPAIR'] = APPROVAL_MATRIX['LOAN'];
APPROVAL_MATRIX['INSTALLATION'] = APPROVAL_MATRIX['PROJECT'];
APPROVAL_MATRIX['MAINTENANCE'] = APPROVAL_MATRIX['PROJECT'];
APPROVAL_MATRIX['DISMANTLE'] = APPROVAL_MATRIX['PROJECT'];

@Injectable()
export class ApprovalService {
  private readonly logger = new Logger(ApprovalService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Build the initial approval chain for a new transaction.
   * Returns ApprovalChainStep[] with all steps set to PENDING.
   */
  buildApprovalChain(
    creatorRole: UserRole,
    module: string,
  ): ApprovalChainStep[] {
    const moduleKey = module.toUpperCase();
    const moduleMatrix = APPROVAL_MATRIX[moduleKey];

    if (!moduleMatrix) {
      this.logger.warn(
        `No approval matrix found for module: ${moduleKey}, using empty chain`,
      );
      return [];
    }

    const chain = moduleMatrix[creatorRole];
    if (!chain) {
      this.logger.warn(
        `No approval chain for role ${creatorRole} in module ${moduleKey}`,
      );
      return [];
    }

    // Self-approval prevention: filter out creator's own role
    return chain
      .filter((step) => step.approverRole !== creatorRole)
      .map((step) => ({
        sequence: step.sequence,
        approverRole: step.approverRole,
        type: step.type,
        status: 'PENDING' as const,
      }));
  }

  /**
   * Legacy method: returns just the approver roles (APPROVAL type only).
   * Use buildApprovalChain() for new code.
   */
  determineApprovalChain(creatorRole: UserRole, module: string): UserRole[] {
    const chain = this.buildApprovalChain(creatorRole, module);
    return chain
      .filter((step) => step.type === 'APPROVAL')
      .map((step) => step.approverRole);
  }

  /**
   * Get the current pending APPROVAL step from a stored chain.
   * Returns null if all APPROVAL steps are done.
   */
  getCurrentPendingStep(chain: ApprovalChainStep[]): ApprovalChainStep | null {
    return (
      chain.find(
        (step) => step.type === 'APPROVAL' && step.status === 'PENDING',
      ) ?? null
    );
  }

  /**
   * Check if all APPROVAL steps in the chain are completed.
   */
  isChainComplete(chain: ApprovalChainStep[]): boolean {
    return chain
      .filter((step) => step.type === 'APPROVAL')
      .every((step) => step.status === 'APPROVED');
  }

  /**
   * Process an approval action on the chain.
   *
   * @param chain - The current approval chain (from DB)
   * @param approverRole - The role of the user performing the approval
   * @param approverId - The ID of the user performing the approval
   * @param approverName - The name of the approver
   * @param creatorId - The ID of the transaction creator (for self-approval check)
   * @param note - Optional approval note
   * @returns Updated chain
   * @throws UnprocessableEntityException if self-approval
   * @throws BadRequestException if role doesn't match current step
   */
  processApproval(
    chain: ApprovalChainStep[],
    approverRole: UserRole,
    approverId: number,
    approverName: string,
    creatorId: number,
    note?: string,
  ): ApprovalChainStep[] {
    // Self-approval prevention
    if (approverId === creatorId) {
      throw new UnprocessableEntityException(
        'Anda tidak dapat menyetujui transaksi yang Anda buat sendiri',
      );
    }

    const currentStep = this.getCurrentPendingStep(chain);
    if (!currentStep) {
      throw new BadRequestException('Semua langkah approval sudah selesai');
    }

    // Validate approver role matches current step
    if (currentStep.approverRole !== approverRole) {
      throw new BadRequestException(
        `Approval saat ini membutuhkan role ${currentStep.approverRole}, Anda adalah ${approverRole}`,
      );
    }

    // Update the step
    return chain.map((step) => {
      if (
        step.sequence === currentStep.sequence &&
        step.approverRole === currentStep.approverRole
      ) {
        return {
          ...step,
          status: 'APPROVED' as const,
          approvedById: approverId,
          approvedByName: approverName,
          approvedAt: new Date().toISOString(),
          note,
        };
      }
      return step;
    });
  }

  /**
   * Process a rejection on the chain.
   */
  processRejection(
    chain: ApprovalChainStep[],
    approverRole: UserRole,
    approverId: number,
    approverName: string,
    creatorId: number,
    reason: string,
  ): ApprovalChainStep[] {
    if (approverId === creatorId) {
      throw new UnprocessableEntityException(
        'Anda tidak dapat menolak transaksi yang Anda buat sendiri',
      );
    }

    const currentStep = this.getCurrentPendingStep(chain);
    if (!currentStep) {
      throw new BadRequestException('Semua langkah approval sudah selesai');
    }

    if (currentStep.approverRole !== approverRole) {
      throw new BadRequestException(
        `Rejection saat ini membutuhkan role ${currentStep.approverRole}, Anda adalah ${approverRole}`,
      );
    }

    return chain.map((step) => {
      if (
        step.sequence === currentStep.sequence &&
        step.approverRole === currentStep.approverRole
      ) {
        return {
          ...step,
          status: 'REJECTED' as const,
          approvedById: approverId,
          approvedByName: approverName,
          approvedAt: new Date().toISOString(),
          note: reason,
        };
      }
      // Mark remaining PENDING steps as SKIPPED
      if (step.status === 'PENDING' && step.sequence > currentStep.sequence) {
        return { ...step, status: 'SKIPPED' as const };
      }
      return step;
    });
  }

  /**
   * Parse a stored approval chain from JSON.
   * Handles both old format (UserRole[]) and new format (ApprovalChainStep[]).
   */
  parseChain(stored: unknown): ApprovalChainStep[] {
    if (!stored || !Array.isArray(stored)) return [];

    // New format: already ApprovalChainStep[]
    if (
      stored.length > 0 &&
      typeof stored[0] === 'object' &&
      'sequence' in stored[0]
    ) {
      return stored as ApprovalChainStep[];
    }

    // Old format: UserRole[] → convert to new format
    if (stored.length > 0 && typeof stored[0] === 'string') {
      return (stored as string[]).map((role, idx) => ({
        sequence: idx + 1,
        approverRole: role as UserRole,
        type: 'APPROVAL' as const,
        status: 'PENDING' as const,
      }));
    }

    return [];
  }

  /**
   * Get the user IDs of the first-tier approvers based on the approval chain.
   * Used to send initial approval notifications when a transaction is created.
   */
  async getFirstTierApproverIds(chain: ApprovalChainStep[]): Promise<number[]> {
    const firstStep = this.getCurrentPendingStep(chain);
    if (!firstStep) return [];

    const approvers = await this.prisma.user.findMany({
      where: { role: firstStep.approverRole, isDeleted: false },
      select: { id: true },
    });

    return approvers.map((u) => u.id);
  }

  /**
   * Get transactions pending approval for a specific user based on their role.
   * Queries all transaction types that use approval chains.
   */
  async getPendingApprovalsForUser(
    userId: number,
    userRole: UserRole,
  ): Promise<
    Array<{
      type: string;
      id: string;
      code: string;
      status: string;
      createdAt: Date;
      creatorName: string;
    }>
  > {
    const pendingItems: Array<{
      type: string;
      id: string;
      code: string;
      status: string;
      createdAt: Date;
      creatorName: string;
    }> = [];

    // Query all transaction tables with approval chains
    const [requests, loans, returns, handovers, repairs] = await Promise.all([
      this.prisma.request.findMany({
        where: {
          isDeleted: false,
          status: {
            notIn: [
              'COMPLETED',
              'CANCELLED',
              'REJECTED',
            ] as TransactionStatus[],
          },
        },
        select: {
          id: true,
          code: true,
          status: true,
          approvalChain: true,
          createdAt: true,
          createdBy: { select: { fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.loanRequest.findMany({
        where: {
          isDeleted: false,
          status: {
            notIn: [
              'COMPLETED',
              'CANCELLED',
              'REJECTED',
            ] as TransactionStatus[],
          },
        },
        select: {
          id: true,
          code: true,
          status: true,
          approvalChain: true,
          createdAt: true,
          createdBy: { select: { fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.assetReturn.findMany({
        where: {
          isDeleted: false,
          status: {
            notIn: [
              'COMPLETED',
              'CANCELLED',
              'REJECTED',
            ] as TransactionStatus[],
          },
        },
        select: {
          id: true,
          code: true,
          status: true,
          createdAt: true,
          createdBy: { select: { fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.handover.findMany({
        where: {
          isDeleted: false,
          status: {
            notIn: [
              'COMPLETED',
              'CANCELLED',
              'REJECTED',
            ] as TransactionStatus[],
          },
        },
        select: {
          id: true,
          code: true,
          status: true,
          approvalChain: true,
          createdAt: true,
          fromUser: { select: { fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.repair.findMany({
        where: {
          isDeleted: false,
          status: {
            notIn: [
              'COMPLETED',
              'CANCELLED',
              'REJECTED',
            ] as TransactionStatus[],
          },
        },
        select: {
          id: true,
          code: true,
          status: true,
          approvalChain: true,
          createdAt: true,
          createdBy: { select: { fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ]);

    const checkAndPush = (
      items: Array<{
        id: string;
        code: string;
        status: TransactionStatus;
        approvalChain?: unknown;
        createdAt: Date;
      }>,
      type: string,
      getCreatorName: (item: unknown) => string,
    ) => {
      for (const item of items) {
        if (!item.approvalChain) {
          continue;
        }
        const chain = this.parseChain(item.approvalChain);
        const pendingStep = this.getCurrentPendingStep(chain);
        if (pendingStep && pendingStep.approverRole === userRole) {
          pendingItems.push({
            type,
            id: item.id,
            code: item.code,
            status: item.status,
            createdAt: item.createdAt,
            creatorName: getCreatorName(item),
          });
        }
      }
    };

    checkAndPush(requests, 'REQUEST', (i: any) => i.createdBy?.fullName ?? '-');
    checkAndPush(loans, 'LOAN', (i: any) => i.createdBy?.fullName ?? '-');
    checkAndPush(returns, 'RETURN', (i: any) => i.createdBy?.fullName ?? '-');
    checkAndPush(
      handovers,
      'HANDOVER',
      (i: any) => i.fromUser?.fullName ?? '-',
    );
    checkAndPush(repairs, 'REPAIR', (i: any) => i.createdBy?.fullName ?? '-');

    // Sort by createdAt descending
    pendingItems.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return pendingItems;
  }
}
