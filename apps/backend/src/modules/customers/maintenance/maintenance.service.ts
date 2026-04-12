import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';
import { FilterMaintenanceDto } from './dto/filter-maintenance.dto';
import { Prisma, TransactionStatus } from '../../../generated/prisma/client';

@Injectable()
export class MaintenanceService {
  constructor(private readonly prisma: PrismaService) {}

  private async generateCode(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await this.prisma.maintenance.count({
      where: { code: { startsWith: `MNT-${dateStr}` } },
    });
    return `MNT-${dateStr}-${String(count + 1).padStart(4, '0')}`;
  }

  async findAll(query: FilterMaintenanceDto) {
    const {
      page = 1,
      limit = 20,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status,
      customerId,
    } = query;

    const where: Prisma.MaintenanceWhereInput = {
      isDeleted: false,
      ...(status && { status }),
      ...(customerId && { customerId }),
      ...(search && {
        OR: [
          { code: { contains: search, mode: 'insensitive' } },
          { issueReport: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const allowedSortFields = ['createdAt', 'code', 'status', 'scheduledAt'];
    const orderField = allowedSortFields.includes(sortBy)
      ? sortBy
      : 'createdAt';

    const [data, total] = await Promise.all([
      this.prisma.maintenance.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [orderField]: sortOrder },
        include: {
          customer: { select: { id: true, name: true, code: true } },
          _count: { select: { materials: true, replacements: true } },
        },
      }),
      this.prisma.maintenance.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: number) {
    const maintenance = await this.prisma.maintenance.findUnique({
      where: { id, isDeleted: false },
      include: {
        customer: { select: { id: true, name: true, code: true } },
        materials: true,
        replacements: true,
      },
    });

    if (!maintenance) {
      throw new NotFoundException('Maintenance tidak ditemukan');
    }
    return maintenance;
  }

  async create(dto: CreateMaintenanceDto, userId: number) {
    const code = await this.generateCode();

    return this.prisma.maintenance.create({
      data: {
        code,
        customerId: dto.customerId,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        issueReport: dto.issueReport,
        resolution: dto.resolution,
        createdById: userId,
        ...(dto.materials?.length && {
          materials: {
            create: dto.materials.map((m) => ({
              description: m.description,
              quantity: m.quantity,
              note: m.note,
            })),
          },
        }),
        ...(dto.replacements?.length && {
          replacements: {
            create: dto.replacements.map((r) => ({
              oldAssetDesc: r.oldAssetDesc,
              newAssetDesc: r.newAssetDesc,
              note: r.note,
            })),
          },
        }),
      },
      include: {
        customer: { select: { id: true, name: true } },
        materials: true,
        replacements: true,
      },
    });
  }

  async update(id: number, dto: UpdateMaintenanceDto) {
    const existing = await this.findOne(id);
    if (existing.status === TransactionStatus.COMPLETED) {
      throw new BadRequestException(
        'Maintenance yang sudah selesai tidak dapat diubah',
      );
    }
    return this.prisma.maintenance.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.scheduledAt && { scheduledAt: new Date(dto.scheduledAt) }),
      },
      include: { customer: { select: { id: true, name: true } } },
    });
  }
}
