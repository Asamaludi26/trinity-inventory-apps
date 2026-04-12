import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { CreateReturnDto } from './dto/create-return.dto';
import { UpdateReturnDto } from './dto/update-return.dto';
import { FilterReturnDto } from './dto/filter-return.dto';
import {
  Prisma,
  TransactionStatus,
  UserRole,
} from '../../../generated/prisma/client';

@Injectable()
export class ReturnService {
  constructor(private readonly prisma: PrismaService) {}

  private async generateCode(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await this.prisma.assetReturn.count({
      where: { code: { startsWith: `RTN-${dateStr}` } },
    });
    return `RTN-${dateStr}-${String(count + 1).padStart(4, '0')}`;
  }

  async findAll(query: FilterReturnDto, userId: number, userRole: string) {
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

    const where: Prisma.AssetReturnWhereInput = {
      isDeleted: false,
      ...(status && { status }),
      ...(search && {
        OR: [
          { code: { contains: search, mode: 'insensitive' } },
          { note: { contains: search, mode: 'insensitive' } },
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
      this.prisma.assetReturn.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [orderField]: sortOrder },
        include: {
          createdBy: { select: { id: true, fullName: true } },
          loanRequest: { select: { id: true, code: true, purpose: true } },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.assetReturn.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const assetReturn = await this.prisma.assetReturn.findUnique({
      where: { id, isDeleted: false },
      include: {
        createdBy: { select: { id: true, fullName: true } },
        loanRequest: { select: { id: true, code: true, purpose: true } },
        items: {
          include: { asset: { select: { id: true, code: true, name: true } } },
        },
      },
    });

    if (!assetReturn) {
      throw new NotFoundException('Pengembalian tidak ditemukan');
    }
    return assetReturn;
  }

  async create(dto: CreateReturnDto, userId: number) {
    const code = await this.generateCode();

    return this.prisma.assetReturn.create({
      data: {
        code,
        loanRequestId: dto.loanRequestId,
        note: dto.note,
        createdById: userId,
        items: {
          create: dto.items.map((item) => ({
            assetId: item.assetId,
            conditionBefore: item.conditionBefore,
            conditionAfter: item.conditionAfter,
            note: item.note,
          })),
        },
      },
      include: {
        items: true,
        createdBy: { select: { id: true, fullName: true } },
        loanRequest: { select: { id: true, code: true } },
      },
    });
  }

  async update(id: string, dto: UpdateReturnDto) {
    const existing = await this.findOne(id);
    if (existing.status !== TransactionStatus.PENDING) {
      throw new BadRequestException(
        'Hanya pengembalian dengan status PENDING yang dapat diubah',
      );
    }
    return this.prisma.assetReturn.update({
      where: { id },
      data: dto,
      include: { items: true },
    });
  }

  async approve(id: string) {
    const existing = await this.findOne(id);
    if (existing.status !== TransactionStatus.PENDING) {
      throw new BadRequestException(
        'Pengembalian tidak dalam status yang dapat di-approve',
      );
    }
    return this.prisma.assetReturn.update({
      where: { id },
      data: { status: TransactionStatus.APPROVED },
    });
  }

  async reject(id: string, _reason: string) {
    const existing = await this.findOne(id);
    if (
      existing.status === TransactionStatus.REJECTED ||
      existing.status === TransactionStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'Pengembalian sudah ditolak atau dibatalkan',
      );
    }
    return this.prisma.assetReturn.update({
      where: { id },
      data: { status: TransactionStatus.REJECTED },
    });
  }

  async execute(id: string) {
    const existing = await this.findOne(id);
    if (existing.status !== TransactionStatus.APPROVED) {
      throw new BadRequestException(
        'Hanya pengembalian yang sudah di-approve yang dapat dieksekusi',
      );
    }
    return this.prisma.assetReturn.update({
      where: { id },
      data: { status: TransactionStatus.COMPLETED },
    });
  }

  async cancel(id: string, userId: number) {
    const existing = await this.findOne(id);
    if (existing.status !== TransactionStatus.PENDING) {
      throw new BadRequestException(
        'Hanya pengembalian dengan status PENDING yang dapat dibatalkan',
      );
    }
    if (existing.createdById !== userId) {
      throw new BadRequestException(
        'Hanya pembuat pengembalian yang dapat membatalkan',
      );
    }
    return this.prisma.assetReturn.update({
      where: { id },
      data: { status: TransactionStatus.CANCELLED },
    });
  }
}
