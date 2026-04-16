import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnprocessableEntityException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { EventsService } from '../../core/events/events.service';
import { NotificationService } from '../../core/notifications/notification.service';
import { FilterAssetDto } from './dto/filter-asset.dto';
import { CreateAssetDto } from './dto/create-asset.dto';
import { CreateBatchAssetDto } from './dto/create-batch-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import {
  AssetStatus,
  AssetClassification,
  TrackingMethod,
  Prisma,
} from '../../generated/prisma/client';
import { AssetStatusMachine } from './asset-status.machine';
import { FifoConsumptionService } from './fifo-consumption.service';

@Injectable()
export class AssetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
    private readonly fifoConsumption: FifoConsumptionService,
    private readonly notificationService: NotificationService,
  ) {}

  async findAll(query: FilterAssetDto) {
    const {
      page = 1,
      limit = 20,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status,
      condition,
      categoryId,
      typeId,
      modelId,
    } = query;

    const where: Prisma.AssetWhereInput = {
      isDeleted: false,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
          { serialNumber: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(status && { status }),
      ...(condition && { condition }),
      ...(categoryId && { categoryId }),
      ...(typeId && { typeId }),
      ...(modelId && { modelId }),
    };

    const allowedSortFields = [
      'createdAt',
      'name',
      'code',
      'status',
      'condition',
    ];
    const orderField = allowedSortFields.includes(sortBy)
      ? sortBy
      : 'createdAt';

    const [data, total] = await Promise.all([
      this.prisma.asset.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: { select: { id: true, name: true } },
          type: { select: { id: true, name: true } },
          model: { select: { id: true, name: true, brand: true } },
          currentUser: { select: { id: true, fullName: true } },
        },
        orderBy: { [orderField]: sortOrder },
      }),
      this.prisma.asset.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const asset = await this.prisma.asset.findUnique({
      where: { id, isDeleted: false },
      include: {
        category: true,
        type: true,
        model: true,
        currentUser: { select: { id: true, fullName: true, email: true } },
        recordedBy: { select: { id: true, fullName: true } },
      },
    });

    if (!asset) {
      throw new NotFoundException('Aset tidak ditemukan');
    }

    return asset;
  }

  /**
   * Validate classification rules:
   * - ASSET + INDIVIDUAL: quantity=1, serialNumber required
   * - MATERIAL + COUNT/MEASUREMENT: quantity>0 allowed, serialNumber optional
   */
  private validateClassification(dto: CreateAssetDto): void {
    const classification = dto.classification;
    const trackingMethod = dto.trackingMethod;

    if (
      classification === AssetClassification.ASSET ||
      trackingMethod === TrackingMethod.INDIVIDUAL
    ) {
      // INDIVIDUAL assets: quantity must be 1, serial number required
      if (dto.quantity && dto.quantity !== 1) {
        throw new BadRequestException(
          'Aset INDIVIDUAL harus memiliki quantity = 1',
        );
      }
      if (
        classification === AssetClassification.ASSET &&
        trackingMethod === TrackingMethod.INDIVIDUAL &&
        !dto.serialNumber
      ) {
        throw new BadRequestException(
          'Aset INDIVIDUAL wajib memiliki serial number',
        );
      }
      // Force quantity=1 for individual assets
      dto.quantity = 1;
    }

    if (classification === AssetClassification.MATERIAL) {
      // MATERIAL: must have COUNT or MEASUREMENT tracking
      if (trackingMethod === TrackingMethod.INDIVIDUAL) {
        throw new BadRequestException(
          'Material tidak dapat menggunakan tracking method INDIVIDUAL',
        );
      }
      if (
        trackingMethod === TrackingMethod.COUNT &&
        (!dto.quantity || dto.quantity < 1)
      ) {
        throw new BadRequestException(
          'Material COUNT harus memiliki quantity minimal 1',
        );
      }
      if (
        trackingMethod === TrackingMethod.MEASUREMENT &&
        (!dto.currentBalance || dto.currentBalance <= 0)
      ) {
        throw new BadRequestException(
          'Material MEASUREMENT harus memiliki currentBalance > 0',
        );
      }
    }
  }

  async create(dto: CreateAssetDto, recordedById: number) {
    // Enforce classification rules
    this.validateClassification(dto);

    const code = dto.code || (await this.generateAssetCode());
    const { note: _note, ...assetData } = dto;

    // Validate serial number uniqueness per model if provided
    if (dto.serialNumber && dto.modelId) {
      const existingAsset = await this.prisma.asset.findFirst({
        where: {
          modelId: dto.modelId,
          serialNumber: dto.serialNumber,
          isDeleted: false,
        },
      });

      if (existingAsset) {
        throw new ConflictException(
          `Serial number "${dto.serialNumber}" sudah digunakan untuk model ini`,
        );
      }
    }

    const asset = await this.prisma.$transaction(async (tx) => {
      // Create asset
      const newAsset = await tx.asset.create({
        data: {
          ...assetData,
          code,
          recordedById,
        },
        include: {
          category: { select: { id: true, name: true } },
          type: { select: { id: true, name: true } },
          model: { select: { id: true, name: true, brand: true } },
        },
      });

      // Create stock movement (NEW_STOCK)
      await tx.stockMovement.create({
        data: {
          assetId: newAsset.id,
          type: 'NEW_STOCK',
          quantity: newAsset.quantity || 1,
          reference: code,
          note: `Registrasi aset baru: ${newAsset.name}`,
          createdById: recordedById,
        },
      });

      // Create activity log
      await tx.activityLog.create({
        data: {
          userId: recordedById,
          action: 'CREATE',
          entityType: 'Asset',
          entityId: newAsset.id,
          dataAfter: newAsset as any,
        },
      });

      // Emit SSE event (future implementation)
      // this.eventsService.emit('asset:created', {
      //   id: newAsset.id,
      //   code: newAsset.code,
      //   name: newAsset.name,
      //   status: newAsset.status,
      // });

      return newAsset;
    });

    // Check threshold and notify (outside transaction for safety)
    if (asset.modelId) {
      await this.checkAndNotifyThreshold(asset.modelId, recordedById);
    }

    return asset;
  }

  /**
   * Generate unique asset code in format: AS-YYYY-MMDD-XXXX
   * Example: AS-2026-0414-0001
   * Uses collision detection with retry loop
   */
  private async generateAssetCode(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const date = String(now.getDate()).padStart(2, '0');
    const today = `${year}-${month}${date}`;
    const prefix = `AS-${today}-`;

    for (let attempt = 0; attempt < 5; attempt++) {
      const lastAsset = await this.prisma.asset.findFirst({
        where: { code: { startsWith: prefix } },
        orderBy: { code: 'desc' },
        select: { code: true },
      });

      const nextNum = lastAsset
        ? parseInt(lastAsset.code.slice(-4), 10) + 1
        : 1;
      const code = `${prefix}${String(nextNum).padStart(4, '0')}`;

      // Check if code already exists (collision detection)
      const exists = await this.prisma.asset.findUnique({
        where: { code },
      });

      if (!exists) {
        return code;
      }
    }

    throw new ConflictException(
      'Gagal generate ID aset unik setelah 5 percobaan. Silakan coba lagi.',
    );
  }

  async update(id: string, dto: UpdateAssetDto, version: number) {
    const asset = await this.findOne(id);

    // Validate status transition if status is being changed
    if (dto.status && dto.status !== asset.status) {
      AssetStatusMachine.validateTransition(asset.status, dto.status);
    }

    const { count } = await this.prisma.asset.updateMany({
      where: { id, version },
      data: { ...dto, version: { increment: 1 }, updatedAt: new Date() },
    });

    if (count === 0) {
      throw new ConflictException(
        'Data telah diubah oleh pengguna lain. Silakan muat ulang data.',
      );
    }

    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.asset.update({
      where: { id },
      data: { isDeleted: true },
    });
    return null;
  }

  async getStock(
    view: 'main' | 'division' | 'personal',
    user: { id: number; divisionId: number | null },
    page = 1,
    limit = 20,
    search?: string,
  ) {
    switch (view) {
      case 'main':
        return this.getMainStock(page, limit, search);
      case 'division':
        return this.getDivisionStock(user.divisionId, page, limit, search);
      case 'personal':
        return this.getPersonalStock(user.id, page, limit, search);
      default:
        return this.getMainStock(page, limit, search);
    }
  }

  private async buildStockSummary(
    where: Prisma.AssetWhereInput,
    page: number,
    limit: number,
    search?: string,
  ) {
    const stockData = await this.prisma.asset.groupBy({
      by: ['modelId', 'status'],
      where,
      _count: { id: true },
    });

    const summaryMap = new Map<
      number,
      { inStorage: number; inUse: number; underRepair: number; total: number }
    >();

    for (const row of stockData) {
      if (!row.modelId) continue;
      const entry = summaryMap.get(row.modelId) ?? {
        inStorage: 0,
        inUse: 0,
        underRepair: 0,
        total: 0,
      };
      entry.total += row._count.id;
      if (row.status === AssetStatus.IN_STORAGE)
        entry.inStorage += row._count.id;
      else if (row.status === AssetStatus.IN_USE) entry.inUse += row._count.id;
      else if (row.status === AssetStatus.UNDER_REPAIR)
        entry.underRepair += row._count.id;
      summaryMap.set(row.modelId, entry);
    }

    const modelIds = [...summaryMap.keys()];

    const [models, thresholds] = await Promise.all([
      this.prisma.assetModel.findMany({
        where: { id: { in: modelIds } },
        include: {
          type: { include: { category: { select: { name: true } } } },
        },
      }),
      this.prisma.stockThreshold.findMany({
        where: { modelId: { in: modelIds } },
      }),
    ]);

    const modelMap = new Map(models.map((m) => [m.id, m]));
    const thresholdMap = new Map(
      thresholds.map((t) => [t.modelId, t.minQuantity]),
    );

    let summaries = modelIds.map((modelId) => {
      const model = modelMap.get(modelId);
      const counts = summaryMap.get(modelId)!;
      return {
        modelId,
        modelName: model?.name ?? '-',
        brand: model?.brand ?? '-',
        categoryName: model?.type?.category?.name ?? '-',
        typeName: model?.type?.name ?? '-',
        totalQuantity: counts.total,
        inStorage: counts.inStorage,
        inUse: counts.inUse,
        underRepair: counts.underRepair,
        threshold: thresholdMap.get(modelId) ?? 0,
      };
    });

    if (search) {
      const s = search.toLowerCase();
      summaries = summaries.filter(
        (item) =>
          item.modelName.toLowerCase().includes(s) ||
          item.brand.toLowerCase().includes(s) ||
          item.categoryName.toLowerCase().includes(s) ||
          item.typeName.toLowerCase().includes(s),
      );
    }

    const total = summaries.length;
    const data = summaries.slice((page - 1) * limit, page * limit);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  private async getMainStock(page: number, limit: number, search?: string) {
    return this.buildStockSummary({ isDeleted: false }, page, limit, search);
  }

  private async getDivisionStock(
    divisionId: number | null,
    page: number,
    limit: number,
    search?: string,
  ) {
    if (!divisionId) {
      return { data: [], meta: { total: 0, page, limit, totalPages: 0 } };
    }

    const memberIds = await this.prisma.user
      .findMany({
        where: { divisionId, isActive: true, isDeleted: false },
        select: { id: true },
      })
      .then((users) => users.map((u) => u.id));

    return this.buildStockSummary(
      { isDeleted: false, currentUserId: { in: memberIds } },
      page,
      limit,
      search,
    );
  }

  private async getPersonalStock(
    userId: number,
    page: number,
    limit: number,
    search?: string,
  ) {
    return this.buildStockSummary(
      { isDeleted: false, currentUserId: userId },
      page,
      limit,
      search,
    );
  }

  async updateStockThreshold(
    modelId: number,
    minQuantity: number,
    userId: number,
  ) {
    const model = await this.prisma.assetModel.findUnique({
      where: { id: modelId },
    });
    if (!model) {
      throw new NotFoundException(
        `Model aset dengan id ${modelId} tidak ditemukan`,
      );
    }

    await this.prisma.stockThreshold.upsert({
      where: { modelId },
      update: { minQuantity },
      create: { modelId, minQuantity, createdById: userId },
    });

    return null;
  }

  /**
   * Create multiple assets in a single atomic transaction
   * Generates batch doc number (REG-YYYY-MM-XXXX) if not provided
   * Creates StockMovement and ActivityLog for each asset
   * Triggers stock threshold notifications after transaction
   */
  async createBatch(dto: CreateBatchAssetDto, recordedById: number) {
    if (!dto.items || dto.items.length === 0) {
      throw new UnprocessableEntityException(
        'Minimal harus ada 1 item dalam batch registrasi',
      );
    }

    // Validate classification rules for each item
    for (const item of dto.items) {
      this.validateClassification(item as CreateAssetDto);
    }

    // Validate serial numbers for uniqueness per model before transaction
    for (const item of dto.items) {
      if (item.serialNumber && item.modelId) {
        const existingAsset = await this.prisma.asset.findFirst({
          where: {
            modelId: item.modelId,
            serialNumber: item.serialNumber,
            isDeleted: false,
          },
        });

        if (existingAsset) {
          throw new ConflictException(
            `Serial number "${item.serialNumber}" sudah digunakan untuk model ini`,
          );
        }
      }
    }

    const docNumber = dto.docNumber || (await this.generateBatchDocNumber());

    const result = await this.prisma.$transaction(async (tx) => {
      const createdAssets = [];
      const modelIds = new Set<number>();

      for (const item of dto.items) {
        const code = item.code || (await this.generateAssetCode());
        const { note: _note, ...assetData } = item;

        // Create asset
        const asset = await tx.asset.create({
          data: {
            ...assetData,
            code,
            recordedById,
          },
          include: {
            category: { select: { id: true, name: true } },
            type: { select: { id: true, name: true } },
            model: { select: { id: true, name: true, brand: true } },
          },
        });

        // Create stock movement (NEW_STOCK)
        await tx.stockMovement.create({
          data: {
            assetId: asset.id,
            type: 'NEW_STOCK',
            quantity: asset.quantity || 1,
            reference: `${docNumber}/${code}`,
            note:
              item.note ||
              `Registrasi batch aset: ${asset.name} (${docNumber})`,
            createdById: recordedById,
          },
        });

        // Create activity log
        await tx.activityLog.create({
          data: {
            userId: recordedById,
            action: 'CREATE',
            entityType: 'Asset',
            entityId: asset.id,
            dataAfter: asset as any,
          },
        });

        createdAssets.push(asset);
        if (asset.modelId) {
          modelIds.add(asset.modelId);
        }
      }

      return {
        docNumber,
        createdCount: createdAssets.length,
        assets: createdAssets,
        modelIds: Array.from(modelIds),
      };
    });

    // Check thresholds and notify (outside transaction for safety)
    for (const modelId of result.modelIds) {
      await this.checkAndNotifyThreshold(modelId, recordedById);
    }

    // Return without modelIds (internal field)
    const { modelIds: _modelIds, ...response } = result;
    return response;
  }

  /**
   * Generate unique batch document number in format: REG-YYYY-MM-XXXX
   * Example: REG-2026-04-0001
   */
  private async generateBatchDocNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `REG-${year}-${month}-`;

    // Find the last batch doc number for this month
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0,
      23,
      59,
      59,
    );

    const lastAsset = await this.prisma.asset.findFirst({
      where: {
        code: { startsWith: prefix },
        createdAt: { gte: monthStart, lte: monthEnd },
      },
      orderBy: { code: 'desc' },
      select: { code: true },
    });

    const nextNum = lastAsset ? parseInt(lastAsset.code.slice(-4), 10) + 1 : 1;

    return `${prefix}${String(nextNum).padStart(4, '0')}`;
  }

  /**
   * Check stock threshold for model and notify if below minimum
   * Called after StockMovement creation
   */
  private async checkAndNotifyThreshold(
    modelId: number,
    userId: number,
  ): Promise<void> {
    try {
      // Get threshold config for model
      const threshold = await this.prisma.stockThreshold.findUnique({
        where: { modelId },
        select: { minQuantity: true },
      });

      if (!threshold) {
        return; // No threshold set
      }

      // Get current stock for model
      const assetCount = await this.prisma.asset.count({
        where: {
          modelId,
          isDeleted: false,
          status: AssetStatus.IN_STORAGE,
        },
      });

      // Notify if below threshold
      if (assetCount < threshold.minQuantity) {
        const model = await this.prisma.assetModel.findUnique({
          where: { id: modelId },
          select: { name: true },
        });

        // Notify the user who triggered the operation
        await this.notificationService.create({
          userId,
          type: 'WARNING' as any, // NotificationType.WARNING
          title: 'Stok Dibawah Minimum',
          message: `Stok model "${model?.name || '-'}" mencapai ${assetCount} unit, dibawah batas minimum ${threshold.minQuantity} unit.`,
          link: `/assets/stock?modelId=${modelId}`,
        });
      }
    } catch (error) {
      // Log error but don't fail the main operation
      console.error(
        `Failed to check and notify threshold for model ${modelId}:`,
        error,
      );
    }
  }
}
