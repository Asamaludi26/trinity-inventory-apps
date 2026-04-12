import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { CreateDismantleDto } from './dto/create-dismantle.dto';
import { UpdateDismantleDto } from './dto/update-dismantle.dto';
import { FilterDismantleDto } from './dto/filter-dismantle.dto';
import { Prisma, TransactionStatus } from '../../../generated/prisma/client';

@Injectable()
export class DismantleService {
  constructor(private readonly prisma: PrismaService) {}

  private async generateCode(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await this.prisma.dismantle.count({
      where: { code: { startsWith: `DSM-${dateStr}` } },
    });
    return `DSM-${dateStr}-${String(count + 1).padStart(4, '0')}`;
  }

  async findAll(query: FilterDismantleDto) {
    const {
      page = 1,
      limit = 20,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status,
      customerId,
    } = query;

    const where: Prisma.DismantleWhereInput = {
      isDeleted: false,
      ...(status && { status }),
      ...(customerId && { customerId }),
      ...(search && {
        OR: [
          { code: { contains: search, mode: 'insensitive' } },
          { reason: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const allowedSortFields = ['createdAt', 'code', 'status', 'scheduledAt'];
    const orderField = allowedSortFields.includes(sortBy)
      ? sortBy
      : 'createdAt';

    const [data, total] = await Promise.all([
      this.prisma.dismantle.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [orderField]: sortOrder },
        include: {
          customer: { select: { id: true, name: true, code: true } },
        },
      }),
      this.prisma.dismantle.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: number) {
    const dismantle = await this.prisma.dismantle.findUnique({
      where: { id, isDeleted: false },
      include: {
        customer: { select: { id: true, name: true, code: true } },
      },
    });

    if (!dismantle) {
      throw new NotFoundException('Dismantle tidak ditemukan');
    }
    return dismantle;
  }

  async create(dto: CreateDismantleDto, userId: number) {
    const code = await this.generateCode();

    return this.prisma.dismantle.create({
      data: {
        code,
        customerId: dto.customerId,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        reason: dto.reason,
        note: dto.note,
        createdById: userId,
      },
      include: {
        customer: { select: { id: true, name: true } },
      },
    });
  }

  async update(id: number, dto: UpdateDismantleDto) {
    const existing = await this.findOne(id);
    if (existing.status === TransactionStatus.COMPLETED) {
      throw new BadRequestException(
        'Dismantle yang sudah selesai tidak dapat diubah',
      );
    }
    return this.prisma.dismantle.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.scheduledAt && { scheduledAt: new Date(dto.scheduledAt) }),
      },
      include: { customer: { select: { id: true, name: true } } },
    });
  }
}
