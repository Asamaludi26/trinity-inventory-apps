import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { NotificationService } from '../../../core/notifications/notification.service';
import { EventsService } from '../../../core/events/events.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { FilterLoanDto } from './dto/filter-loan.dto';
import { ApprovalService } from '../approval/approval.service';
import { StockMovementService } from '../stock-movements/stock-movement.service';
import {
  Prisma,
  TransactionStatus,
  UserRole,
} from '../../../generated/prisma/client';

@Injectable()
export class LoanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly approvalService: ApprovalService,
    private readonly stockMovementService: StockMovementService,
    private readonly notificationService: NotificationService,
    private readonly eventsService: EventsService,
  ) {}

  private async generateCode(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await this.prisma.loanRequest.count({
      where: { code: { startsWith: `LN-${dateStr}` } },
    });
    return `LN-${dateStr}-${String(count + 1).padStart(4, '0')}`;
  }

  async findAll(query: FilterLoanDto, userId: number, userRole: string) {
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

    const where: Prisma.LoanRequestWhereInput = {
      isDeleted: false,
      ...(status && { status }),
      ...(search && {
        OR: [
          { code: { contains: search, mode: 'insensitive' } },
          { purpose: { contains: search, mode: 'insensitive' } },
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
      this.prisma.loanRequest.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [orderField]: sortOrder },
        include: {
          createdBy: { select: { id: true, fullName: true } },
          items: true,
          _count: { select: { items: true, assetAssignments: true } },
        },
      }),
      this.prisma.loanRequest.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const loan = await this.prisma.loanRequest.findUnique({
      where: { id, isDeleted: false },
      include: {
        createdBy: { select: { id: true, fullName: true } },
        items: true,
        assetAssignments: {
          include: { asset: { select: { id: true, code: true, name: true } } },
        },
        returns: { select: { id: true, code: true, status: true } },
      },
    });

    if (!loan) {
      throw new NotFoundException('Peminjaman tidak ditemukan');
    }
    return loan;
  }

  async create(dto: CreateLoanDto, userId: number, userRole: UserRole) {
    const code = await this.generateCode();
    const approvalChain = this.approvalService.buildApprovalChain(
      userRole,
      'LOAN',
    );

    return this.prisma.loanRequest.create({
      data: {
        code,
        purpose: dto.purpose,
        expectedReturn: dto.expectedReturn
          ? new Date(dto.expectedReturn)
          : undefined,
        createdById: userId,
        approvalChain: approvalChain as unknown as Prisma.InputJsonValue,
        items: {
          create: dto.items.map((item) => ({
            modelId: item.modelId,
            description: item.description,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        items: true,
        createdBy: { select: { id: true, fullName: true } },
      },
    });
  }

  async update(id: string, dto: UpdateLoanDto) {
    const existing = await this.findOne(id);
    if (existing.status !== TransactionStatus.PENDING) {
      throw new BadRequestException(
        'Hanya peminjaman dengan status PENDING yang dapat diubah',
      );
    }
    return this.prisma.loanRequest.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.expectedReturn && {
          expectedReturn: new Date(dto.expectedReturn),
        }),
        version: { increment: 1 },
      },
      include: { items: true },
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
        'Peminjaman tidak dalam status yang dapat di-approve',
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

    const { count } = await this.prisma.loanRequest.updateMany({
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

    const result = await this.prisma.loanRequest.findUnique({ where: { id } });

    this.eventsService.emitTransactionUpdate({
      id,
      code: existing.code,
      type: 'loan',
      status: nextStatus,
      version: existing.version + 1,
    });

    this.notificationService
      .notifyTransactionStatusChange({
        recipientUserId: existing.createdById,
        transactionType: 'Peminjaman',
        transactionCode: existing.code,
        action: 'APPROVED',
        link: `/transactions/loans/${id}`,
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
      throw new BadRequestException('Peminjaman sudah ditolak atau dibatalkan');
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

    const { count } = await this.prisma.loanRequest.updateMany({
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

    const result = await this.prisma.loanRequest.findUnique({ where: { id } });

    this.eventsService.emitTransactionUpdate({
      id,
      code: existing.code,
      type: 'loan',
      status: TransactionStatus.REJECTED,
      version: existing.version + 1,
    });

    this.notificationService
      .notifyTransactionStatusChange({
        recipientUserId: existing.createdById,
        transactionType: 'Peminjaman',
        transactionCode: existing.code,
        action: 'REJECTED',
        link: `/transactions/loans/${id}`,
        reason,
      })
      .catch(() => {});

    return result;
  }

  async execute(id: string, version: number, executedById: number) {
    const existing = await this.findOne(id);
    if (existing.status !== TransactionStatus.APPROVED) {
      throw new BadRequestException(
        'Hanya peminjaman yang sudah di-approve yang dapat dieksekusi',
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.loanRequest.updateMany({
        where: { id, version },
        data: {
          status: TransactionStatus.IN_PROGRESS,
          version: { increment: 1 },
        },
      });

      if (count === 0) {
        throw new ConflictException(
          'Data telah diubah oleh pengguna lain. Silakan muat ulang data.',
        );
      }

      // Update each assigned asset status to IN_CUSTODY and create OUT stock movements
      for (const assignment of existing.assetAssignments) {
        await tx.asset.update({
          where: { id: assignment.assetId },
          data: {
            status: 'IN_CUSTODY',
            currentUserId: existing.createdById,
          },
        });

        await this.stockMovementService.create(
          {
            assetId: assignment.assetId,
            type: 'OUT',
            reference: existing.code,
            note: `Peminjaman oleh ${existing.createdBy.fullName}`,
            createdById: executedById,
          },
          tx,
        );
      }

      return tx.loanRequest.findUnique({ where: { id } });
    });

    this.eventsService.emitTransactionUpdate({
      id,
      code: existing.code,
      type: 'loan',
      status: TransactionStatus.IN_PROGRESS,
      version: existing.version + 1,
    });

    this.notificationService
      .notifyTransactionStatusChange({
        recipientUserId: existing.createdById,
        transactionType: 'Peminjaman',
        transactionCode: existing.code,
        action: 'EXECUTED',
        link: `/transactions/loans/${id}`,
      })
      .catch(() => {});

    return result;
  }

  async assignAssets(
    id: string,
    assetIds: string[],
    version: number,
    _assignedById: number,
  ) {
    const existing = await this.findOne(id);
    if (
      existing.status !== TransactionStatus.APPROVED &&
      existing.status !== TransactionStatus.LOGISTIC_APPROVED
    ) {
      throw new BadRequestException(
        'Aset hanya dapat di-assign pada peminjaman yang sudah di-approve',
      );
    }

    // Validate all assets exist and are IN_STORAGE
    const assets = await this.prisma.asset.findMany({
      where: {
        id: { in: assetIds },
        isDeleted: false,
      },
      select: { id: true, code: true, name: true, status: true },
    });

    if (assets.length !== assetIds.length) {
      const foundIds = new Set(assets.map((a) => a.id));
      const missing = assetIds.filter((aid) => !foundIds.has(aid));
      throw new BadRequestException(
        `Aset tidak ditemukan: ${missing.join(', ')}`,
      );
    }

    const unavailable = assets.filter((a) => a.status !== 'IN_STORAGE');
    if (unavailable.length > 0) {
      throw new BadRequestException(
        `Aset tidak tersedia (bukan IN_STORAGE): ${unavailable.map((a) => a.code).join(', ')}`,
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // Remove existing assignments (replace strategy)
      await tx.loanAssetAssignment.deleteMany({
        where: { loanRequestId: id },
      });

      // Create new assignments
      await tx.loanAssetAssignment.createMany({
        data: assetIds.map((assetId) => ({
          loanRequestId: id,
          assetId,
        })),
      });

      // Update version
      const { count } = await tx.loanRequest.updateMany({
        where: { id, version },
        data: { version: { increment: 1 } },
      });

      if (count === 0) {
        throw new ConflictException(
          'Data telah diubah oleh pengguna lain. Silakan muat ulang data.',
        );
      }

      return tx.loanRequest.findUnique({
        where: { id },
        include: {
          items: true,
          assetAssignments: {
            include: {
              asset: { select: { id: true, code: true, name: true } },
            },
          },
          createdBy: { select: { id: true, fullName: true } },
        },
      });
    });

    this.eventsService.emitTransactionUpdate({
      id,
      code: existing.code,
      type: 'loan',
      status: existing.status,
      version: existing.version + 1,
    });

    this.notificationService
      .notifyTransactionStatusChange({
        recipientUserId: existing.createdById,
        transactionType: 'Peminjaman',
        transactionCode: existing.code,
        action: 'ASSETS_ASSIGNED',
        link: `/transactions/loans/${id}`,
      })
      .catch(() => {});

    return result;
  }

  async cancel(id: string, userId: number, version: number) {
    const existing = await this.findOne(id);
    if (existing.status !== TransactionStatus.PENDING) {
      throw new BadRequestException(
        'Hanya peminjaman dengan status PENDING yang dapat dibatalkan',
      );
    }
    if (existing.createdById !== userId) {
      throw new BadRequestException(
        'Hanya pembuat peminjaman yang dapat membatalkan',
      );
    }

    const { count } = await this.prisma.loanRequest.updateMany({
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
      type: 'loan',
      status: TransactionStatus.CANCELLED,
      version: existing.version + 1,
    });

    return this.prisma.loanRequest.findUnique({ where: { id } });
  }
}
