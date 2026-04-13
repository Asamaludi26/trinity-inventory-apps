import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { EventsService } from '../../core/events/events.service';
import { FilterAssetDto } from './dto/filter-asset.dto';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { AssetStatus, Prisma } from '../../generated/prisma/client';

@Injectable()
export class AssetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
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

  async create(dto: CreateAssetDto, recordedById: number) {
    const code = dto.code || (await this.generateAssetCode());
    const { note: _note, ...assetData } = dto;

    return this.prisma.asset.create({
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
  }

  private async generateAssetCode(): Promise<string> {
    const now = new Date();
    const prefix = `AST-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

    const lastAsset = await this.prisma.asset.findFirst({
      where: { code: { startsWith: prefix } },
      orderBy: { code: 'desc' },
      select: { code: true },
    });

    const seq = lastAsset
      ? parseInt(lastAsset.code.split('-').pop() ?? '0', 10) + 1
      : 1;

    return `${prefix}-${String(seq).padStart(5, '0')}`;
  }

  async update(id: string, dto: UpdateAssetDto, version: number) {
    await this.findOne(id);

    const { count } = await this.prisma.asset.updateMany({
      where: { id, version },
      data: { ...dto, version: { increment: 1 } },
    });

    if (count === 0) {
      throw new ConflictException(
        'Data telah diubah oleh pengguna lain. Silakan muat ulang data.',
      );
    }

    return this.prisma.asset.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        type: { select: { id: true, name: true } },
        model: { select: { id: true, name: true, brand: true } },
      },
    });
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
}
