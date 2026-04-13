import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { EventsService } from '../../../core/events/events.service';
import { CreateRepairDto } from './dto/create-repair.dto';
import { UpdateRepairDto } from './dto/update-repair.dto';
import { FilterRepairDto } from './dto/filter-repair.dto';
import { ApprovalService } from '../approval/approval.service';
import {
  Prisma,
  TransactionStatus,
  UserRole,
} from '../../../generated/prisma/client';

@Injectable()
export class RepairService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly approvalService: ApprovalService,
    private readonly eventsService: EventsService,
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
    const approvalChain = this.approvalService.determineApprovalChain(
      userRole,
      'REPAIR',
    );

    return this.prisma.repair.create({
      data: {
        code,
        assetId: dto.assetId,
        issueDescription: dto.description,
        condition: dto.condition,
        note: dto.note,
        createdById: userId,
        approvalChain,
      },
      include: {
        createdBy: { select: { id: true, fullName: true } },
        asset: { select: { id: true, code: true, name: true } },
      },
    });
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

  async approve(id: string, version: number) {
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
        'Laporan tidak dalam status yang dapat di-approve',
      );
    }
    const nextStatus =
      existing.status === TransactionStatus.PENDING
        ? TransactionStatus.LOGISTIC_APPROVED
        : TransactionStatus.APPROVED;

    const { count } = await this.prisma.repair.updateMany({
      where: { id, version },
      data: { status: nextStatus, version: { increment: 1 } },
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

    return result;
  }

  async reject(id: string, reason: string, version: number) {
    const existing = await this.findOne(id);
    if (
      existing.status === TransactionStatus.REJECTED ||
      existing.status === TransactionStatus.CANCELLED
    ) {
      throw new BadRequestException('Laporan sudah ditolak atau dibatalkan');
    }

    const { count } = await this.prisma.repair.updateMany({
      where: { id, version },
      data: {
        status: TransactionStatus.REJECTED,
        rejectionReason: reason,
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

    return result;
  }

  async execute(id: string, version: number) {
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

    return result;
  }

  async complete(
    id: string,
    data: { repairAction?: string; repairVendor?: string; repairCost?: number },
    version: number,
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

    return this.prisma.repair.findUnique({ where: { id } });
  }
}
