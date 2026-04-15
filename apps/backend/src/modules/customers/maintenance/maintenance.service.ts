import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { StockMovementService } from '../../transactions/stock-movements/stock-movement.service';
import { FifoConsumptionService } from '../../assets/fifo-consumption.service';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';
import { FilterMaintenanceDto } from './dto/filter-maintenance.dto';
import { assertOccSuccess } from '../../../common/helpers/occ.helper';
import {
  Prisma,
  TransactionStatus,
  MovementType,
  AssetStatus,
  AssetCondition,
} from '../../../generated/prisma/client';

/** Map dismantle/replacement condition → asset status */
function mapConditionToStatus(condition: AssetCondition): AssetStatus {
  switch (condition) {
    case AssetCondition.NEW:
    case AssetCondition.GOOD:
    case AssetCondition.FAIR:
      return AssetStatus.IN_STORAGE;
    case AssetCondition.POOR:
      return AssetStatus.UNDER_REPAIR;
    case AssetCondition.BROKEN:
      return AssetStatus.DAMAGED;
    default:
      return AssetStatus.IN_STORAGE;
  }
}

@Injectable()
export class MaintenanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stockMovementService: StockMovementService,
    private readonly fifoConsumptionService: FifoConsumptionService,
  ) {}

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
        materials: {
          include: {
            model: { select: { id: true, name: true, brand: true } },
          },
        },
        replacements: {
          include: {
            oldAsset: {
              select: { id: true, code: true, name: true, status: true },
            },
            newAsset: {
              select: { id: true, code: true, name: true, status: true },
            },
          },
        },
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
        priority: dto.priority ?? 'MEDIUM',
        workTypes: dto.workTypes ?? [],
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
              ...(m.modelId && { modelId: m.modelId }),
            })),
          },
        }),
        ...(dto.replacements?.length && {
          replacements: {
            create: dto.replacements.map((r) => ({
              oldAssetDesc: r.oldAssetDesc,
              newAssetDesc: r.newAssetDesc,
              note: r.note,
              ...(r.oldAssetId && { oldAssetId: r.oldAssetId }),
              ...(r.newAssetId && { newAssetId: r.newAssetId }),
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

    const version = (dto as { version?: number }).version ?? existing.version;
    const result = await this.prisma.maintenance.updateMany({
      where: { id, version },
      data: {
        ...(dto.scheduledAt && { scheduledAt: new Date(dto.scheduledAt) }),
        ...(dto.issueReport !== undefined && {
          issueReport: dto.issueReport,
        }),
        ...(dto.resolution !== undefined && { resolution: dto.resolution }),
        ...(dto.priority !== undefined && { priority: dto.priority }),
        ...(dto.workTypes !== undefined && { workTypes: dto.workTypes }),
        version: { increment: 1 },
      },
    });
    assertOccSuccess(result.count);

    return this.findOne(id);
  }

  async complete(id: number, userId: number, resolution?: string) {
    const existing = await this.findOne(id);
    if (existing.status === TransactionStatus.COMPLETED) {
      throw new BadRequestException('Maintenance sudah selesai');
    }

    // Resolution wajib saat complete
    const finalResolution = resolution || existing.resolution;
    if (!finalResolution) {
      throw new BadRequestException(
        'Resolusi wajib diisi saat menyelesaikan maintenance',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const result = await tx.maintenance.updateMany({
        where: { id, version: existing.version },
        data: {
          status: TransactionStatus.COMPLETED,
          completedAt: new Date(),
          resolution: finalResolution,
          version: { increment: 1 },
        },
      });
      assertOccSuccess(result.count);

      const maintenance = await tx.maintenance.findUnique({
        where: { id },
        include: {
          customer: { select: { id: true, name: true } },
          materials: true,
          replacements: true,
        },
      });

      // T3-12: FIFO consumption for materials
      for (const material of existing.materials) {
        if (material.modelId) {
          await this.fifoConsumptionService.consumeMaterial(
            material.modelId,
            material.quantity,
            existing.code,
            'MAINTENANCE',
            userId,
            tx,
          );
        }
      }

      // T3-11: Process replacements — condition → status mapping
      for (const replacement of existing.replacements) {
        if (replacement.oldAssetId && replacement.newAssetId) {
          // Validate old asset is IN_USE
          const oldAsset = await tx.asset.findUnique({
            where: { id: replacement.oldAssetId },
          });
          if (!oldAsset || oldAsset.status !== AssetStatus.IN_USE) {
            throw new BadRequestException(
              `Aset lama ${replacement.oldAssetDesc} tidak dalam status IN_USE`,
            );
          }

          // Validate new asset is IN_STORAGE
          const newAsset = await tx.asset.findUnique({
            where: { id: replacement.newAssetId },
          });
          if (!newAsset || newAsset.status !== AssetStatus.IN_STORAGE) {
            throw new BadRequestException(
              `Aset baru ${replacement.newAssetDesc} tidak dalam status IN_STORAGE`,
            );
          }

          // Determine condition for old asset
          const conditionAfter =
            replacement.conditionAfter ?? AssetCondition.FAIR;
          const oldAssetNewStatus = mapConditionToStatus(conditionAfter);

          // Update old asset — return based on condition
          await tx.asset.update({
            where: { id: replacement.oldAssetId },
            data: {
              status: oldAssetNewStatus,
              condition: conditionAfter,
              currentUserId: null,
            },
          });

          // Update new asset — deploy to customer
          await tx.asset.update({
            where: { id: replacement.newAssetId },
            data: {
              status: AssetStatus.IN_USE,
              currentUserId: null,
            },
          });

          // Update replacement record with condition
          await tx.maintenanceReplacement.update({
            where: { id: replacement.id },
            data: { conditionAfter },
          });

          // StockMovements for both assets
          await this.stockMovementService.create(
            {
              assetId: replacement.oldAssetId,
              type: MovementType.MAINTENANCE,
              quantity: 1,
              reference: existing.code,
              note: `Maintenance ${existing.code} - aset lama dikembalikan`,
              createdById: userId,
            },
            tx,
          );
          await this.stockMovementService.create(
            {
              assetId: replacement.newAssetId,
              type: MovementType.INSTALLATION,
              quantity: -1,
              reference: existing.code,
              note: `Maintenance ${existing.code} - aset baru dipasang`,
              createdById: userId,
            },
            tx,
          );
        }
      }

      return maintenance;
    });
  }
}
