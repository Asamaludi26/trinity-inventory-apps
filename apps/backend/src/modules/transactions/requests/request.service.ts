import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { NotificationService } from '../../../core/notifications/notification.service';
import { EventsService } from '../../../core/events/events.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { FilterRequestDto } from './dto/filter-request.dto';
import { ApprovalService } from '../approval/approval.service';
import {
  Prisma,
  TransactionStatus,
  UserRole,
} from '../../../generated/prisma/client';

@Injectable()
export class RequestService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly approvalService: ApprovalService,
    private readonly notificationService: NotificationService,
    private readonly eventsService: EventsService,
  ) {}

  private async generateCode(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await this.prisma.request.count({
      where: { code: { startsWith: `REQ-${dateStr}` } },
    });
    return `REQ-${dateStr}-${String(count + 1).padStart(4, '0')}`;
  }

  async findAll(query: FilterRequestDto, userId: number, userRole: string) {
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

    const where: Prisma.RequestWhereInput = {
      isDeleted: false,
      ...(status && { status }),
      ...(search && {
        OR: [
          { code: { contains: search, mode: 'insensitive' } },
          { title: { contains: search, mode: 'insensitive' } },
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

    const allowedSortFields = ['createdAt', 'code', 'status', 'title'];
    const orderField = allowedSortFields.includes(sortBy)
      ? sortBy
      : 'createdAt';

    const [data, total] = await Promise.all([
      this.prisma.request.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [orderField]: sortOrder },
        include: {
          createdBy: { select: { id: true, fullName: true } },
          items: true,
          _count: { select: { items: true } },
        },
      }),
      this.prisma.request.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const request = await this.prisma.request.findUnique({
      where: { id, isDeleted: false },
      include: {
        createdBy: { select: { id: true, fullName: true } },
        project: { select: { id: true, code: true, name: true } },
        items: true,
        assetRegistrations: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Request tidak ditemukan');
    }
    return request;
  }

  async create(dto: CreateRequestDto, userId: number, userRole: UserRole) {
    const code = await this.generateCode();
    const approvalChain = this.approvalService.buildApprovalChain(
      userRole,
      'REQUEST',
    );

    return this.prisma.request.create({
      data: {
        code,
        title: dto.title,
        description: dto.description,
        priority: dto.priority ?? 'NORMAL',
        projectId: dto.projectId,
        createdById: userId,
        approvalChain: approvalChain as unknown as Prisma.InputJsonValue,
        items: {
          create: dto.items.map((item) => ({
            modelId: item.modelId,
            description: item.description,
            quantity: item.quantity,
            note: item.note,
          })),
        },
      },
      include: {
        items: true,
        createdBy: { select: { id: true, fullName: true } },
      },
    });
  }

  async update(id: string, dto: UpdateRequestDto) {
    const existing = await this.findOne(id);
    if (existing.status !== TransactionStatus.PENDING) {
      throw new BadRequestException(
        'Hanya request dengan status PENDING yang dapat diubah',
      );
    }
    return this.prisma.request.update({
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
    itemAdjustments?: { itemId: number; approvedQuantity: number }[],
  ) {
    const existing = await this.findOne(id);
    if (
      existing.status === TransactionStatus.REJECTED ||
      existing.status === TransactionStatus.CANCELLED ||
      existing.status === TransactionStatus.COMPLETED
    ) {
      throw new BadRequestException(
        'Request tidak dalam status yang dapat di-approve',
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
      : existing.status === TransactionStatus.PENDING
        ? TransactionStatus.LOGISTIC_APPROVED
        : TransactionStatus.AWAITING_CEO_APPROVAL;

    const result = await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.request.updateMany({
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

      // Apply partial approval adjustments if provided
      if (itemAdjustments?.length) {
        for (const adj of itemAdjustments) {
          const item = existing.items.find((i) => i.id === adj.itemId);
          if (!item) {
            throw new BadRequestException(
              `Item dengan ID ${adj.itemId} tidak ditemukan`,
            );
          }
          if (adj.approvedQuantity > item.quantity) {
            throw new BadRequestException(
              `Jumlah disetujui (${adj.approvedQuantity}) tidak boleh melebihi jumlah diminta (${item.quantity}) untuk item "${item.description}"`,
            );
          }
          await tx.requestItem.update({
            where: { id: adj.itemId },
            data: { approvedQuantity: adj.approvedQuantity },
          });
        }
      }

      return tx.request.findUnique({
        where: { id },
        include: { items: true },
      });
    });

    this.eventsService.emitTransactionUpdate({
      id,
      code: existing.code,
      type: 'request',
      status: nextStatus,
      version: existing.version + 1,
    });

    this.notificationService
      .notifyTransactionStatusChange({
        recipientUserId: existing.createdById,
        transactionType: 'Permintaan',
        transactionCode: existing.code,
        action: 'APPROVED',
        link: `/transactions/requests/${id}`,
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
      throw new BadRequestException('Request sudah ditolak atau dibatalkan');
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

    const { count } = await this.prisma.request.updateMany({
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

    const result = await this.prisma.request.findUnique({ where: { id } });

    this.eventsService.emitTransactionUpdate({
      id,
      code: existing.code,
      type: 'request',
      status: TransactionStatus.REJECTED,
      version: existing.version + 1,
    });

    this.notificationService
      .notifyTransactionStatusChange({
        recipientUserId: existing.createdById,
        transactionType: 'Permintaan',
        transactionCode: existing.code,
        action: 'REJECTED',
        link: `/transactions/requests/${id}`,
        reason,
      })
      .catch(() => {});

    return result;
  }

  /**
   * Valid request status transitions (post-approval lifecycle).
   * APPROVED → PURCHASING → IN_DELIVERY → ARRIVED → COMPLETED
   */
  private readonly REQUEST_TRANSITIONS: Record<string, string> = {
    [TransactionStatus.APPROVED]: TransactionStatus.PURCHASING,
    [TransactionStatus.PURCHASING]: TransactionStatus.IN_DELIVERY,
    [TransactionStatus.IN_DELIVERY]: TransactionStatus.ARRIVED,
    [TransactionStatus.ARRIVED]: TransactionStatus.COMPLETED,
  };

  private readonly TRANSITION_LABELS: Record<string, string> = {
    [TransactionStatus.PURCHASING]: 'PURCHASING',
    [TransactionStatus.IN_DELIVERY]: 'IN_DELIVERY',
    [TransactionStatus.ARRIVED]: 'ARRIVED',
    [TransactionStatus.COMPLETED]: 'COMPLETED',
  };

  async execute(id: string, version: number) {
    const existing = await this.findOne(id);
    const nextStatus = this.REQUEST_TRANSITIONS[existing.status];
    if (!nextStatus) {
      throw new BadRequestException(
        `Request dengan status ${existing.status} tidak dapat ditransisikan ke tahap berikutnya`,
      );
    }

    const { count } = await this.prisma.request.updateMany({
      where: { id, version },
      data: {
        status: nextStatus as TransactionStatus,
        version: { increment: 1 },
      },
    });

    if (count === 0) {
      throw new ConflictException(
        'Data telah diubah oleh pengguna lain. Silakan muat ulang data.',
      );
    }

    const result = await this.prisma.request.findUnique({ where: { id } });

    this.eventsService.emitTransactionUpdate({
      id,
      code: existing.code,
      type: 'request',
      status: nextStatus as TransactionStatus,
      version: existing.version + 1,
    });

    this.notificationService
      .notifyTransactionStatusChange({
        recipientUserId: existing.createdById,
        transactionType: 'Permintaan',
        transactionCode: existing.code,
        action: (this.TRANSITION_LABELS[nextStatus] ?? nextStatus) as
          | 'PURCHASING'
          | 'IN_DELIVERY'
          | 'ARRIVED'
          | 'COMPLETED',
        link: `/transactions/requests/${id}`,
      })
      .catch(() => {});

    return result;
  }

  async cancel(id: string, userId: number, version: number) {
    const existing = await this.findOne(id);
    if (existing.status !== TransactionStatus.PENDING) {
      throw new BadRequestException(
        'Hanya request dengan status PENDING yang dapat dibatalkan',
      );
    }
    if (existing.createdById !== userId) {
      throw new BadRequestException(
        'Hanya pembuat request yang dapat membatalkan',
      );
    }

    const { count } = await this.prisma.request.updateMany({
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
      type: 'request',
      status: TransactionStatus.CANCELLED,
      version: existing.version + 1,
    });

    return this.prisma.request.findUnique({ where: { id } });
  }
}
