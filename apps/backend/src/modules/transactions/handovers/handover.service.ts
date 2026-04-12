import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { CreateHandoverDto } from './dto/create-handover.dto';
import { UpdateHandoverDto } from './dto/update-handover.dto';
import { FilterHandoverDto } from './dto/filter-handover.dto';
import { ApprovalService } from '../approval/approval.service';
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
    const approvalChain = this.approvalService.determineApprovalChain(
      userRole,
      'handovers',
    );

    return this.prisma.handover.create({
      data: {
        code,
        fromUserId: userId,
        toUserId: dto.toUserId,
        witnessUserId: dto.witnessUserId,
        note: dto.note,
        approvalChain,
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

  async approve(id: string) {
    const existing = await this.findOne(id);
    if (
      !(
        [
          TransactionStatus.PENDING,
          TransactionStatus.LOGISTIC_APPROVED,
        ] as string[]
      ).includes(existing.status)
    ) {
      throw new BadRequestException(
        'Serah terima tidak dalam status yang dapat di-approve',
      );
    }
    const nextStatus =
      existing.status === TransactionStatus.PENDING
        ? TransactionStatus.LOGISTIC_APPROVED
        : TransactionStatus.APPROVED;

    return this.prisma.handover.update({
      where: { id },
      data: { status: nextStatus, version: { increment: 1 } },
    });
  }

  async reject(id: string, reason: string) {
    const existing = await this.findOne(id);
    if (
      existing.status === TransactionStatus.REJECTED ||
      existing.status === TransactionStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'Serah terima sudah ditolak atau dibatalkan',
      );
    }
    return this.prisma.handover.update({
      where: { id },
      data: {
        status: TransactionStatus.REJECTED,
        rejectionReason: reason,
        version: { increment: 1 },
      },
    });
  }

  async execute(id: string) {
    const existing = await this.findOne(id);
    if (existing.status !== TransactionStatus.APPROVED) {
      throw new BadRequestException(
        'Hanya serah terima yang sudah di-approve yang dapat dieksekusi',
      );
    }
    return this.prisma.handover.update({
      where: { id },
      data: { status: TransactionStatus.COMPLETED, version: { increment: 1 } },
    });
  }

  async cancel(id: string, userId: number) {
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
    return this.prisma.handover.update({
      where: { id },
      data: { status: TransactionStatus.CANCELLED, version: { increment: 1 } },
    });
  }
}
