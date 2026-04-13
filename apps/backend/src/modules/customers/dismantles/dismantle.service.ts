import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { StockMovementService } from '../../transactions/stock-movements/stock-movement.service';
import { CreateDismantleDto } from './dto/create-dismantle.dto';
import { UpdateDismantleDto } from './dto/update-dismantle.dto';
import { FilterDismantleDto } from './dto/filter-dismantle.dto';
import {
  Prisma,
  TransactionStatus,
  MovementType,
  AssetStatus,
  AssetCondition,
} from '../../../generated/prisma/client';

@Injectable()
export class DismantleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stockMovementService: StockMovementService,
  ) {}

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
        items: {
          include: {
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
        },
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
        ...(dto.items?.length && {
          items: {
            create: dto.items.map((item) => ({
              assetId: item.assetId,
              note: item.note,
            })),
          },
        }),
      },
      include: {
        customer: { select: { id: true, name: true } },
        items: {
          include: {
            asset: { select: { id: true, code: true, name: true } },
          },
        },
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
    const { items: _items, scheduledAt, ...rest } = dto;
    return this.prisma.dismantle.update({
      where: { id },
      data: {
        ...rest,
        ...(scheduledAt && { scheduledAt: new Date(scheduledAt) }),
      },
      include: { customer: { select: { id: true, name: true } } },
    });
  }

  async complete(
    id: number,
    userId: number,
    itemConditions?: Array<{ assetId: string; conditionAfter: AssetCondition }>,
  ) {
    const existing = await this.findOne(id);
    if (existing.status === TransactionStatus.COMPLETED) {
      throw new BadRequestException('Dismantle sudah selesai');
    }

    return this.prisma.$transaction(async (tx) => {
      const dismantle = await tx.dismantle.update({
        where: { id },
        data: {
          status: TransactionStatus.COMPLETED,
          completedAt: new Date(),
        },
        include: {
          customer: { select: { id: true, name: true } },
          items: {
            include: {
              asset: { select: { id: true, code: true, name: true } },
            },
          },
        },
      });

      // Return each asset to storage
      for (const item of existing.items) {
        const conditionInfo = itemConditions?.find(
          (c) => c.assetId === item.assetId,
        );
        const conditionAfter =
          conditionInfo?.conditionAfter ?? AssetCondition.GOOD;

        // Update dismantle item condition
        await tx.dismantleItem.update({
          where: { id: item.id },
          data: { conditionAfter },
        });

        // Return asset to IN_STORAGE
        await tx.asset.update({
          where: { id: item.assetId },
          data: {
            status: AssetStatus.IN_STORAGE,
            condition: conditionAfter,
            currentUserId: null,
          },
        });

        // Create stock movement IN
        await this.stockMovementService.create(
          {
            assetId: item.assetId,
            type: MovementType.IN,
            quantity: 1,
            reference: existing.code,
            note: `Dismantle ${existing.code} - aset dikembalikan ke gudang`,
            createdById: userId,
          },
          tx,
        );
      }

      return dismantle;
    });
  }
}
