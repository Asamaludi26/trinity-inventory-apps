import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { UserRole } from '../../../generated/prisma/client';

/**
 * Approval step stored in transaction's approvalChain JsonB field.
 */
interface ApprovalStep {
  sequence: number;
  approverRole: UserRole;
  type: 'APPROVAL' | 'CC';
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
  Partial<Record<UserRole, ApprovalStep[]>>
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
   * Determine approval chain based on creator role and module.
   * Ref: PRD 6.3 Approval Workflow
   *
   * Returns the list of approver roles (APPROVAL type only, excluding CC).
   * The full chain (including CC) is stored in approvalChain JsonB.
   */
  determineApprovalChain(creatorRole: UserRole, module: string): UserRole[] {
    const moduleKey = module.toUpperCase();
    const chain = this.getFullChain(creatorRole, moduleKey);

    // Return only APPROVAL steps (not CC) for backward compat
    return chain
      .filter((step) => step.type === 'APPROVAL')
      .map((step) => step.approverRole);
  }

  /**
   * Get the full approval chain including CC steps.
   * Stored in the transaction's approvalChain JSON field.
   */
  getFullChain(creatorRole: UserRole, module: string): ApprovalStep[] {
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
    return chain.filter((step) => step.approverRole !== creatorRole);
  }
}
