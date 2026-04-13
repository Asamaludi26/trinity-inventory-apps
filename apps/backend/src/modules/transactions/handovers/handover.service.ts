import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { NotificationService } from '../../../core/notifications/notification.service';
import { EventsService } from '../../../core/events/events.service';
import { CreateHandoverDto } from './dto/create-handover.dto';
import { UpdateHandoverDto } from './dto/update-handover.dto';
import { FilterHandoverDto } from './dto/filter-handover.dto';
import { ApprovalService } from '../approval/approval.service';
import { StockMovementService } from '../stock-movements/stock-movement.service';
import {
  Prisma,
  TransactionStatus,
  UserRole,
} from '../../../generated/prisma/client';

@Injectable()
export class HandoverService {
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
    const count = await this.prisma.handover.count({
      where: { code: { startsWith: `HO-${dateStr}` } },
    });
    return `HO-${dateStr}-${String(count + 1).padStart(4, '0')}`;
  }

  async findAll(query: FilterHandoverDto, userId: number, userRole: string) {
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

    const where: Prisma.HandoverWhereInput = {
      isDeleted: false,
      ...(status && { status }),
      ...(search && {
        code: { contains: search, mode: 'insensitive' },
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
        OR: [{ fromUserId: userId }, { toUserId: userId }],
      }),
    };

    const allowedSortFields = ['createdAt', 'code', 'status'];
    const orderField = allowedSortFields.includes(sortBy)
      ? sortBy
      : 'createdAt';

    const [data, total] = await Promise.all([
      this.prisma.handover.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [orderField]: sortOrder },
        include: {
          fromUser: { select: { id: true, fullName: true } },
          toUser: { select: { id: true, fullName: true } },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.handover.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const handover = await this.prisma.handover.findUnique({
      where: { id, isDeleted: false },
      include: {
        fromUser: { select: { id: true, fullName: true } },
        toUser: { select: { id: true, fullName: true } },
        witnessUser: { select: { id: true, fullName: true } },
        items: {
          include: { asset: { select: { id: true, code: true, name: true } } },
        },
      },
    });

    if (!handover) {
      throw new NotFoundException('Serah terima tidak ditemukan');
    }
    return handover;
  }

  async create(dto: CreateHandoverDto, userId: number, userRole: UserRole) {
    const code = await this.generateCode();
    const approvalChain = this.approvalService.buildApprovalChain(
      userRole,
      'HANDOVER',
    );

    return this.prisma.handover.create({
      data: {
        code,
        fromUserId: userId,
        toUserId: dto.toUserId,
        witnessUserId: dto.witnessUserId,
        note: dto.note,
        approvalChain: approvalChain as unknown as Prisma.InputJsonValue,
        items: {
          create: dto.items.map((item) => ({
            assetId: item.assetId,
            note: item.note,
          })),
        },
      },
      include: {
        items: true,
        fromUser: { select: { id: true, fullName: true } },
        toUser: { select: { id: true, fullName: true } },
      },
    });
  }

  async update(id: string, dto: UpdateHandoverDto) {
    const existing = await this.findOne(id);
    if (existing.status !== TransactionStatus.PENDING) {
      throw new BadRequestException(
        'Hanya serah terima dengan status PENDING yang dapat diubah',
      );
    }
    return this.prisma.handover.update({
      where: { id },
      data: { ...dto, version: { increment: 1 } },
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
        'Serah terima tidak dalam status yang dapat di-approve',
      );
    }

    const chain = this.approvalService.parseChain(existing.approvalChain);
    const updatedChain = this.approvalService.processApproval(
      chain,
      approverRole,
      approverId,
      approverName,
      existing.fromUserId,
      note,
    );

    const isComplete = this.approvalService.isChainComplete(updatedChain);
    const nextStatus = isComplete
      ? TransactionStatus.APPROVED
      : TransactionStatus.LOGISTIC_APPROVED;

    const { count } = await this.prisma.handover.updateMany({
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

    const result = await this.prisma.handover.findUnique({ where: { id } });

    this.eventsService.emitTransactionUpdate({
      id,
      code: existing.code,
      type: 'handover',
      status: nextStatus,
      version: existing.version + 1,
    });

    this.notificationService
      .notifyTransactionStatusChange({
        recipientUserId: existing.fromUserId,
        transactionType: 'Serah Terima',
        transactionCode: existing.code,
        action: 'APPROVED',
        link: `/transactions/handovers/${id}`,
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
      throw new BadRequestException(
        'Serah terima sudah ditolak atau dibatalkan',
      );
    }

    const chain = this.approvalService.parseChain(existing.approvalChain);
    const updatedChain = this.approvalService.processRejection(
      chain,
      approverRole,
      approverId,
      approverName,
      existing.fromUserId,
      reason,
    );

    const { count } = await this.prisma.handover.updateMany({
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

    const result = await this.prisma.handover.findUnique({ where: { id } });

    this.eventsService.emitTransactionUpdate({
      id,
      code: existing.code,
      type: 'handover',
      status: TransactionStatus.REJECTED,
      version: existing.version + 1,
    });

    this.notificationService
      .notifyTransactionStatusChange({
        recipientUserId: existing.fromUserId,
        transactionType: 'Serah Terima',
        transactionCode: existing.code,
        action: 'REJECTED',
        link: `/transactions/handovers/${id}`,
        reason,
      })
      .catch(() => {});

    return result;
  }

  async execute(id: string, version: number, executedById: number) {
    const existing = await this.findOne(id);
    if (existing.status !== TransactionStatus.APPROVED) {
      throw new BadRequestException(
        'Hanya serah terima yang sudah di-approve yang dapat dieksekusi',
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.handover.updateMany({
        where: { id, version },
        data: {
          status: TransactionStatus.COMPLETED,
          version: { increment: 1 },
        },
      });

      if (count === 0) {
        throw new ConflictException(
          'Data telah diubah oleh pengguna lain. Silakan muat ulang data.',
        );
      }

      // Update asset PIC (currentUserId), status, and create TRANSFER stock movements
      for (const item of existing.items) {
        await tx.asset.update({
          where: { id: item.assetId },
          data: { status: 'IN_USE', currentUserId: existing.toUser.id },
        });

        await this.stockMovementService.create(
          {
            assetId: item.assetId,
            type: 'TRANSFER',
            reference: existing.code,
            note: `Serah terima ke ${existing.toUser.fullName}`,
            createdById: executedById,
          },
          tx,
        );
      }

      return tx.handover.findUnique({ where: { id } });
    });

    this.eventsService.emitTransactionUpdate({
      id,
      code: existing.code,
      type: 'handover',
      status: TransactionStatus.COMPLETED,
      version: existing.version + 1,
    });

    this.notificationService
      .notifyTransactionStatusChange({
        recipientUserId: existing.fromUserId,
        transactionType: 'Serah Terima',
        transactionCode: existing.code,
        action: 'COMPLETED',
        link: `/transactions/handovers/${id}`,
      })
      .catch(() => {});

    return result;
  }

  async cancel(id: string, userId: number, version: number) {
    const existing = await this.findOne(id);
    if (existing.status !== TransactionStatus.PENDING) {
      throw new BadRequestException(
        'Hanya serah terima dengan status PENDING yang dapat dibatalkan',
      );
    }
    if (existing.fromUserId !== userId) {
      throw new BadRequestException(
        'Hanya pembuat serah terima yang dapat membatalkan',
      );
    }

    const { count } = await this.prisma.handover.updateMany({
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
      type: 'handover',
      status: TransactionStatus.CANCELLED,
      version: existing.version + 1,
    });

    return this.prisma.handover.findUnique({ where: { id } });
  }
}
