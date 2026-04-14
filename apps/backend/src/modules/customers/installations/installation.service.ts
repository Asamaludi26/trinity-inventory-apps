import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { StockMovementService } from '../../transactions/stock-movements/stock-movement.service';
import { CreateInstallationDto } from './dto/create-installation.dto';
import { UpdateInstallationDto } from './dto/update-installation.dto';
import { FilterInstallationDto } from './dto/filter-installation.dto';
import {
  Prisma,
  TransactionStatus,
  MovementType,
  AssetStatus,
} from '../../../generated/prisma/client';

@Injectable()
export class InstallationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stockMovementService: StockMovementService,
  ) {}

  private async generateCode(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await this.prisma.installation.count({
      where: { code: { startsWith: `INS-${dateStr}` } },
    });
    return `INS-${dateStr}-${String(count + 1).padStart(4, '0')}`;
  }

  async findAll(query: FilterInstallationDto) {
    const {
      page = 1,
      limit = 20,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status,
      customerId,
    } = query;

    const where: Prisma.InstallationWhereInput = {
      isDeleted: false,
      ...(status && { status }),
      ...(customerId && { customerId }),
      ...(search && {
        OR: [
          { code: { contains: search, mode: 'insensitive' } },
          { location: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const allowedSortFields = ['createdAt', 'code', 'status', 'scheduledAt'];
    const orderField = allowedSortFields.includes(sortBy)
      ? sortBy
      : 'createdAt';

    const [data, total] = await Promise.all([
      this.prisma.installation.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [orderField]: sortOrder },
        include: {
          customer: { select: { id: true, name: true, code: true } },
          _count: { select: { materials: true } },
        },
      }),
      this.prisma.installation.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: number) {
    const installation = await this.prisma.installation.findUnique({
      where: { id, isDeleted: false },
      include: {
        customer: { select: { id: true, name: true, code: true } },
        materials: true,
      },
    });

    if (!installation) {
      throw new NotFoundException('Instalasi tidak ditemukan');
    }
    return installation;
  }

  async create(dto: CreateInstallationDto, userId: number) {
    const code = await this.generateCode();

    return this.prisma.installation.create({
      data: {
        code,
        customerId: dto.customerId,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        location: dto.location,
        note: dto.note,
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
      },
      include: {
        customer: { select: { id: true, name: true } },
        materials: true,
      },
    });
  }

  async update(id: number, dto: UpdateInstallationDto) {
    const existing = await this.findOne(id);
    if (existing.status === TransactionStatus.COMPLETED) {
      throw new BadRequestException(
        'Instalasi yang sudah selesai tidak dapat diubah',
      );
    }
    return this.prisma.installation.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.scheduledAt && { scheduledAt: new Date(dto.scheduledAt) }),
      },
      include: { customer: { select: { id: true, name: true } } },
    });
  }

  async complete(id: number, userId: number) {
    const existing = await this.findOne(id);
    if (existing.status === TransactionStatus.COMPLETED) {
      throw new BadRequestException('Instalasi sudah selesai');
    }

    return this.prisma.$transaction(async (tx) => {
      // Update installation status
      const installation = await tx.installation.update({
        where: { id },
        data: {
          status: TransactionStatus.COMPLETED,
          completedAt: new Date(),
        },
        include: {
          customer: { select: { id: true, name: true } },
          materials: true,
        },
      });

      // Create stock movement OUT for each material linked to a model
      for (const material of existing.materials) {
        if (material.modelId) {
          // Find available assets of this model in storage
          const assets = await tx.asset.findMany({
            where: {
              modelId: material.modelId,
              status: AssetStatus.IN_STORAGE,
              isDeleted: false,
            },
            take: material.quantity,
          });

          for (const asset of assets) {
            await tx.asset.update({
              where: { id: asset.id },
              data: { status: AssetStatus.IN_USE },
            });

            await this.stockMovementService.create(
              {
                assetId: asset.id,
                type: MovementType.INSTALLATION,
                quantity: 1,
                reference: existing.code,
                note: `Instalasi ${existing.code} - ${material.description}`,
                createdById: userId,
              },
              tx,
            );
          }
        }
      }

      return installation;
    });
  }
}
