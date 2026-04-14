import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { EventsService } from '../../../core/events/events.service';
import { NotificationService } from '../../../core/notifications/notification.service';
import { CreateRepairDto } from './dto/create-repair.dto';
import { UpdateRepairDto } from './dto/update-repair.dto';
import { FilterRepairDto } from './dto/filter-repair.dto';
import { ApprovalService } from '../approval/approval.service';
import { StockMovementService } from '../stock-movements/stock-movement.service';
import {
  Prisma,
  TransactionStatus,
  UserRole,
  RepairCategory,
  AssetStatus,
} from '../../../generated/prisma/client';

@Injectable()
export class RepairService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly approvalService: ApprovalService,
    private readonly stockMovementService: StockMovementService,
    private readonly eventsService: EventsService,
    private readonly notificationService: NotificationService,
  ) {}

  private async generateCode(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await this.prisma.repair.count({
      where: { code: { startsWith: `RP-${dateStr}` } },
    });
    return `RP-${dateStr}-${String(count + 1).padStart(4, '0')}`;
  }

  async findAll(query: FilterRepairDto, userId: number, userRole: string) {
    const {
      page = 1,
      limit = 20,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status,
      startDate,
      endDate,
    } = query;

    const where: Prisma.RepairWhereInput = {
      isDeleted: false,
      ...(status && { status }),
      ...(search && {
        OR: [
          { code: { contains: search, mode: 'insensitive' } },
          { issueDescription: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...((startDate || endDate) && {
        createdAt: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate) }),
        },
      }),
      ...(([UserRole.STAFF, UserRole.LEADER] as string[]).includes(
        userRole,
      ) && {
        createdById: userId,
      }),
    };

    const allowedSortFields = ['createdAt', 'code', 'status'];
    const orderField = allowedSortFields.includes(sortBy)
      ? sortBy
      : 'createdAt';

    const [data, total] = await Promise.all([
      this.prisma.repair.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [orderField]: sortOrder },
        include: {
          createdBy: { select: { id: true, fullName: true } },
          asset: { select: { id: true, code: true, name: true } },
        },
      }),
      this.prisma.repair.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const repair = await this.prisma.repair.findUnique({
      where: { id, isDeleted: false },
      include: {
        createdBy: { select: { id: true, fullName: true } },
        asset: {
          select: {
            id: true,
            code: true,
            name: true,
            status: true,
            condition: true,
          },
        },
      },
    });

    if (!repair) {
      throw new NotFoundException('Laporan perbaikan tidak ditemukan');
    }
    return repair;
  }

  async create(dto: CreateRepairDto, userId: number, userRole: UserRole) {
    // Verify asset exists
    const asset = await this.prisma.asset.findUnique({
      where: { id: dto.assetId },
    });
    if (!asset) {
      throw new BadRequestException('Aset tidak ditemukan');
    }

    const code = await this.generateCode();
    const approvalChain = this.approvalService.buildApprovalChain(
      userRole,
      'REPAIR',
    );

    const repair = await this.prisma.repair.create({
      data: {
        code,
        assetId: dto.assetId,
        issueDescription: dto.description,
        condition: dto.condition,
        note: dto.note,
        createdById: userId,
        approvalChain: approvalChain as unknown as Prisma.InputJsonValue,
      },
      include: {
        createdBy: { select: { id: true, fullName: true } },
        asset: { select: { id: true, code: true, name: true } },
      },
    });

    // Notify first-tier approvers (fire and forget)
    this.approvalService.getFirstTierApproverIds(approvalChain).then((ids) => {
      ids.forEach((approverId) => {
        this.notificationService
          .notifyApprovalRequired({
            recipientUserId: approverId,
            transactionType: 'Laporan Perbaikan',
            transactionCode: code,
            requesterName: repair.createdBy.fullName,
            link: `/transactions/repairs/${repair.id}`,
          })
          .catch(() => {});
      });
    });

    return repair;
  }

  async update(id: string, dto: UpdateRepairDto) {
    const existing = await this.findOne(id);
    if (existing.status !== TransactionStatus.PENDING) {
      throw new BadRequestException(
        'Hanya laporan dengan status PENDING yang dapat diubah',
      );
    }
    return this.prisma.repair.update({
      where: { id },
      data: {
        ...(dto.description && { issueDescription: dto.description }),
        ...(dto.condition && { condition: dto.condition }),
        ...(dto.note !== undefined && { note: dto.note }),
        version: { increment: 1 },
      },
      include: {
        createdBy: { select: { id: true, fullName: true } },
        asset: { select: { id: true, code: true, name: true } },
      },
    });
  }

  async approve(
    id: string,
    version: number,
    approverId: number,
    approverRole: UserRole,
    approverName: string,
    note?: string,
  ) {
    const existing = await this.findOne(id);
    if (
      existing.status === TransactionStatus.REJECTED ||
      existing.status === TransactionStatus.CANCELLED ||
      existing.status === TransactionStatus.COMPLETED
    ) {
      throw new BadRequestException(
        'Laporan tidak dalam status yang dapat di-approve',
      );
    }

    const chain = this.approvalService.parseChain(existing.approvalChain);
    const updatedChain = this.approvalService.processApproval(
      chain,
      approverRole,
      approverId,
      approverName,
      existing.createdById,
      note,
    );

    const isComplete = this.approvalService.isChainComplete(updatedChain);
    const nextStatus = isComplete
      ? TransactionStatus.APPROVED
      : TransactionStatus.LOGISTIC_APPROVED;

    const { count } = await this.prisma.repair.updateMany({
      where: { id, version },
      data: {
        status: nextStatus,
        approvalChain: updatedChain as unknown as Prisma.InputJsonValue,
        version: { increment: 1 },
      },
    });

    if (count === 0) {
      throw new ConflictException(
        'Data telah diubah oleh pengguna lain. Silakan muat ulang data.',
      );
    }

    const result = await this.prisma.repair.findUnique({ where: { id } });

    this.eventsService.emitTransactionUpdate({
      id,
      code: existing.code,
      type: 'repair',
      status: nextStatus,
      version: existing.version + 1,
    });

    this.notificationService
      .notifyTransactionStatusChange({
        recipientUserId: existing.createdById,
        transactionType: 'Perbaikan',
        transactionCode: existing.code,
        action: 'APPROVED',
        link: `/repairs/${id}`,
      })
      .catch(() => {});

    return result;
  }

  async reject(
    id: string,
    reason: string,
    version: number,
    approverId: number,
    approverRole: UserRole,
    approverName: string,
  ) {
    const existing = await this.findOne(id);
    if (
      existing.status === TransactionStatus.REJECTED ||
      existing.status === TransactionStatus.CANCELLED
    ) {
      throw new BadRequestException('Laporan sudah ditolak atau dibatalkan');
    }

    const chain = this.approvalService.parseChain(existing.approvalChain);
    const updatedChain = this.approvalService.processRejection(
      chain,
      approverRole,
      approverId,
      approverName,
      existing.createdById,
      reason,
    );

    const { count } = await this.prisma.repair.updateMany({
      where: { id, version },
      data: {
        status: TransactionStatus.REJECTED,
        rejectionReason: reason,
        approvalChain: updatedChain as unknown as Prisma.InputJsonValue,
        version: { increment: 1 },
      },
    });

    if (count === 0) {
      throw new ConflictException(
        'Data telah diubah oleh pengguna lain. Silakan muat ulang data.',
      );
    }

    const result = await this.prisma.repair.findUnique({ where: { id } });

    this.eventsService.emitTransactionUpdate({
      id,
      code: existing.code,
      type: 'repair',
      status: TransactionStatus.REJECTED,
      version: existing.version + 1,
    });

    this.notificationService
      .notifyTransactionStatusChange({
        recipientUserId: existing.createdById,
        transactionType: 'Perbaikan',
        transactionCode: existing.code,
        action: 'REJECTED',
        link: `/repairs/${id}`,
        reason,
      })
      .catch(() => {});

    return result;
  }

  async execute(id: string, version: number, executedById: number) {
    const existing = await this.findOne(id);
    if (existing.status !== TransactionStatus.APPROVED) {
      throw new BadRequestException(
        'Hanya laporan yang sudah di-approve yang dapat dieksekusi',
      );
    }

    if (existing.version !== version) {
      throw new ConflictException(
        'Data telah diubah oleh pengguna lain. Silakan muat ulang data.',
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.asset.update({
        where: { id: existing.assetId },
        data: { status: 'UNDER_REPAIR' },
      });

      await this.stockMovementService.create(
        {
          assetId: existing.assetId,
          type: 'REPAIR',
          reference: existing.code,
          note: `Aset masuk perbaikan: ${existing.issueDescription}`,
          createdById: executedById,
        },
        tx,
      );

      return tx.repair.update({
        where: { id },
        data: {
          status: TransactionStatus.IN_PROGRESS,
          startedAt: new Date(),
          version: { increment: 1 },
        },
      });
    });

    this.eventsService.emitTransactionUpdate({
      id,
      code: existing.code,
      type: 'repair',
      status: TransactionStatus.IN_PROGRESS,
      version: existing.version + 1,
    });

    this.notificationService
      .notifyTransactionStatusChange({
        recipientUserId: existing.createdById,
        transactionType: 'Perbaikan',
        transactionCode: existing.code,
        action: 'EXECUTED',
        link: `/repairs/${id}`,
      })
      .catch(() => {});

    return result;
  }

  async complete(
    id: string,
    data: { repairAction?: string; repairVendor?: string; repairCost?: number },
    version: number,
    completedById: number,
  ) {
    const existing = await this.findOne(id);
    if (existing.status !== TransactionStatus.IN_PROGRESS) {
      throw new BadRequestException(
        'Hanya laporan yang sedang diperbaiki yang dapat diselesaikan',
      );
    }

    if (existing.version !== version) {
      throw new ConflictException(
        'Data telah diubah oleh pengguna lain. Silakan muat ulang data.',
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.asset.update({
        where: { id: existing.assetId },
        data: { status: 'IN_STORAGE', condition: 'GOOD' },
      });

      await this.stockMovementService.create(
        {
          assetId: existing.assetId,
          type: 'REPAIR',
          reference: existing.code,
          note: `Aset selesai diperbaiki${data.repairAction ? `: ${data.repairAction}` : ''}`,
          createdById: completedById,
        },
        tx,
      );

      return tx.repair.update({
        where: { id },
        data: {
          status: TransactionStatus.COMPLETED,
          completedAt: new Date(),
          ...(data.repairAction && { repairAction: data.repairAction }),
          ...(data.repairVendor && { repairVendor: data.repairVendor }),
          ...(data.repairCost !== undefined && {
            repairCost: data.repairCost,
          }),
          version: { increment: 1 },
        },
      });
    });

    this.eventsService.emitTransactionUpdate({
      id,
      code: existing.code,
      type: 'repair',
      status: TransactionStatus.COMPLETED,
      version: existing.version + 1,
    });

    this.notificationService
      .notifyTransactionStatusChange({
        recipientUserId: existing.createdById,
        transactionType: 'Perbaikan',
        transactionCode: existing.code,
        action: 'COMPLETED',
        link: `/repairs/${id}`,
      })
      .catch(() => {});

    return result;
  }

  /**
   * Send asset to external service center for repair.
   * Transition: IN_PROGRESS → IN_PROGRESS (asset → OUT_FOR_REPAIR)
   */
  async sendOutForRepair(
    id: string,
    data: { repairVendor: string; note?: string },
    version: number,
    _executedById: number,
  ) {
    const existing = await this.findOne(id);
    if (existing.status !== TransactionStatus.IN_PROGRESS) {
      throw new BadRequestException(
        'Hanya laporan yang sedang diperbaiki yang dapat dikirim ke service center',
      );
    }

    if (existing.version !== version) {
      throw new ConflictException(
        'Data telah diubah oleh pengguna lain. Silakan muat ulang data.',
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.asset.update({
        where: { id: existing.assetId },
        data: { status: 'OUT_FOR_REPAIR' },
      });

      return tx.repair.update({
        where: { id },
        data: {
          repairVendor: data.repairVendor,
          ...(data.note && { note: data.note }),
          version: { increment: 1 },
        },
      });
    });

    this.eventsService.emitTransactionUpdate({
      id,
      code: existing.code,
      type: 'repair',
      status: TransactionStatus.IN_PROGRESS,
      version: existing.version + 1,
    });

    this.notificationService
      .notifyTransactionStatusChange({
        recipientUserId: existing.createdById,
        transactionType: 'Perbaikan',
        transactionCode: existing.code,
        action: 'EXECUTED',
        link: `/repairs/${id}`,
      })
      .catch(() => {});

    return result;
  }

  /**
   * Decommission an asset that cannot be repaired.
   * Transition: IN_PROGRESS → COMPLETED (asset → DECOMMISSIONED)
   */
  async decommission(
    id: string,
    data: { repairAction?: string; note?: string },
    version: number,
    executedById: number,
  ) {
    const existing = await this.findOne(id);
    if (existing.status !== TransactionStatus.IN_PROGRESS) {
      throw new BadRequestException(
        'Hanya laporan yang sedang diperbaiki yang dapat di-decommission',
      );
    }

    if (existing.version !== version) {
      throw new ConflictException(
        'Data telah diubah oleh pengguna lain. Silakan muat ulang data.',
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.asset.update({
        where: { id: existing.assetId },
        data: { status: 'DECOMMISSIONED', condition: 'BROKEN' },
      });

      await this.stockMovementService.create(
        {
          assetId: existing.assetId,
          type: 'ADJUSTMENT',
          reference: existing.code,
          note: `Aset di-decommission: ${data.repairAction ?? 'Tidak dapat diperbaiki'}`,
          createdById: executedById,
        },
        tx,
      );

      return tx.repair.update({
        where: { id },
        data: {
          status: TransactionStatus.COMPLETED,
          completedAt: new Date(),
          ...(data.repairAction && { repairAction: data.repairAction }),
          ...(data.note && { note: data.note }),
          version: { increment: 1 },
        },
      });
    });

    this.eventsService.emitTransactionUpdate({
      id,
      code: existing.code,
      type: 'repair',
      status: TransactionStatus.COMPLETED,
      version: existing.version + 1,
    });

    this.notificationService
      .notifyTransactionStatusChange({
        recipientUserId: existing.createdById,
        transactionType: 'Perbaikan',
        transactionCode: existing.code,
        action: 'COMPLETED',
        link: `/repairs/${id}`,
      })
      .catch(() => {});

    return result;
  }

  async cancel(id: string, userId: number, version: number) {
    const existing = await this.findOne(id);
    if (existing.status !== TransactionStatus.PENDING) {
      throw new BadRequestException(
        'Hanya laporan dengan status PENDING yang dapat dibatalkan',
      );
    }
    if (existing.createdById !== userId) {
      throw new BadRequestException(
        'Hanya pembuat laporan yang dapat membatalkan',
      );
    }

    const { count } = await this.prisma.repair.updateMany({
      where: { id, version },
      data: { status: TransactionStatus.CANCELLED, version: { increment: 1 } },
    });

    if (count === 0) {
      throw new ConflictException(
        'Data telah diubah oleh pengguna lain. Silakan muat ulang data.',
      );
    }

    this.eventsService.emitTransactionUpdate({
      id,
      code: existing.code,
      type: 'repair',
      status: TransactionStatus.CANCELLED,
      version: existing.version + 1,
    });

    this.notificationService
      .notifyTransactionStatusChange({
        recipientUserId: existing.createdById,
        transactionType: 'Perbaikan',
        transactionCode: existing.code,
        action: 'CANCELLED',
        link: `/repairs/${id}`,
      })
      .catch(() => {});

    return this.prisma.repair.findUnique({ where: { id } });
  }

  /**
   * Report an asset as LOST (PRD §6.1).
   * Bypass approval — asset status → LOST immediately.
   * Instant notification escalation to SA & AL.
   */
  async reportLost(
    dto: { assetId: string; description: string; note?: string },
    userId: number,
  ) {
    const asset = await this.prisma.asset.findUnique({
      where: { id: dto.assetId },
      include: { currentUser: { select: { id: true } } },
    });
    if (!asset) {
      throw new BadRequestException('Aset tidak ditemukan');
    }

    // Pelapor harus PIC terakhir aset
    if (asset.currentUserId && asset.currentUserId !== userId) {
      // Allow SA & AL to report on behalf
      const reporter = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      if (
        reporter?.role !== UserRole.SUPERADMIN &&
        reporter?.role !== UserRole.ADMIN_LOGISTIK
      ) {
        throw new BadRequestException(
          'Hanya PIC terakhir aset, Superadmin, atau Admin Logistik yang dapat melaporkan aset hilang',
        );
      }
    }

    const code = await this.generateCode();

    const result = await this.prisma.$transaction(async (tx) => {
      // Asset status → LOST immediately (bypass approval)
      await tx.asset.update({
        where: { id: dto.assetId },
        data: { status: AssetStatus.LOST },
      });

      await this.stockMovementService.create(
        {
          assetId: dto.assetId,
          type: 'ADJUSTMENT',
          reference: code,
          note: `Aset dilaporkan hilang: ${dto.description}`,
          createdById: userId,
        },
        tx,
      );

      return tx.repair.create({
        data: {
          code,
          assetId: dto.assetId,
          issueDescription: dto.description,
          condition: asset.condition,
          category: RepairCategory.LOST,
          status: TransactionStatus.IN_PROGRESS, // Bypass approval
          note: dto.note,
          createdById: userId,
        },
        include: {
          createdBy: { select: { id: true, fullName: true } },
          asset: { select: { id: true, code: true, name: true } },
        },
      });
    });

    this.eventsService.emitTransactionUpdate({
      id: result.id,
      code,
      type: 'repair',
      status: TransactionStatus.IN_PROGRESS,
      version: 1,
    });

    // Instant escalation to SA & AL
    const admins = await this.prisma.user.findMany({
      where: {
        role: { in: [UserRole.SUPERADMIN, UserRole.ADMIN_LOGISTIK] },
        isDeleted: false,
      },
      select: { id: true },
    });
    for (const admin of admins) {
      this.notificationService
        .notifyTransactionStatusChange({
          recipientUserId: admin.id,
          transactionType: 'Laporan Aset Hilang',
          transactionCode: code,
          action: 'EXECUTED',
          link: `/transactions/repairs/${result.id}`,
        })
        .catch(() => {});
    }

    return result;
  }

  /**
   * Resolve a LOST asset report.
   * - found: restore asset status to previous status
   * - not found: decommission asset
   */
  async resolveLost(
    id: string,
    data: { resolution: 'FOUND' | 'NOT_FOUND'; note?: string },
    version: number,
    resolvedById: number,
  ) {
    const existing = await this.findOne(id);
    if (existing.category !== RepairCategory.LOST) {
      throw new BadRequestException(
        'Operasi ini hanya berlaku untuk laporan aset hilang',
      );
    }
    if (existing.status !== TransactionStatus.IN_PROGRESS) {
      throw new BadRequestException(
        'Hanya laporan yang sedang dalam investigasi yang dapat diselesaikan',
      );
    }
    if (existing.version !== version) {
      throw new ConflictException(
        'Data telah diubah oleh pengguna lain. Silakan muat ulang data.',
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      if (data.resolution === 'FOUND') {
        // Restore to IN_STORAGE
        await tx.asset.update({
          where: { id: existing.assetId },
          data: { status: AssetStatus.IN_STORAGE },
        });

        await this.stockMovementService.create(
          {
            assetId: existing.assetId,
            type: 'ADJUSTMENT',
            reference: existing.code,
            note: `Aset hilang ditemukan kembali${data.note ? `: ${data.note}` : ''}`,
            createdById: resolvedById,
          },
          tx,
        );
      } else {
        // Decommission: status → DECOMMISSIONED
        await tx.asset.update({
          where: { id: existing.assetId },
          data: { status: AssetStatus.DECOMMISSIONED },
        });

        await this.stockMovementService.create(
          {
            assetId: existing.assetId,
            type: 'ADJUSTMENT',
            reference: existing.code,
            note: `Aset hilang tidak ditemukan — dicatat sebagai kerugian${data.note ? `: ${data.note}` : ''}`,
            createdById: resolvedById,
          },
          tx,
        );
      }

      return tx.repair.update({
        where: { id },
        data: {
          status: TransactionStatus.COMPLETED,
          completedAt: new Date(),
          repairAction:
            data.resolution === 'FOUND'
              ? 'Aset ditemukan'
              : 'Aset tidak ditemukan — decommissioned',
          note: data.note,
          version: { increment: 1 },
        },
      });
    });

    this.eventsService.emitTransactionUpdate({
      id,
      code: existing.code,
      type: 'repair',
      status: TransactionStatus.COMPLETED,
      version: existing.version + 1,
    });

    this.notificationService
      .notifyTransactionStatusChange({
        recipientUserId: existing.createdById,
        transactionType: 'Laporan Aset Hilang',
        transactionCode: existing.code,
        action: 'COMPLETED',
        link: `/transactions/repairs/${id}`,
      })
      .catch(() => {});

    return result;
  }
}
