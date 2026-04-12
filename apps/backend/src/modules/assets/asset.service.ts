import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { FilterAssetDto } from './dto/filter-asset.dto';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { AssetStatus, Prisma } from '../../generated/prisma/client';

@Injectable()
export class AssetService {
  constructor(private readonly prisma: PrismaService) {}

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
    return this.prisma.asset.create({
      data: {
        ...dto,
        recordedById,
      },
      include: {
        category: { select: { id: true, name: true } },
        type: { select: { id: true, name: true } },
        model: { select: { id: true, name: true, brand: true } },
      },
    });
  }

  async update(id: string, dto: UpdateAssetDto) {
    await this.findOne(id);
    return this.prisma.asset.update({
      where: { id },
      data: dto,
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
  ) {
    switch (view) {
      case 'main':
        return this.getMainStock();
      case 'division':
        return this.getDivisionStock(user.divisionId);
      case 'personal':
        return this.getPersonalStock(user.id);
      default:
        return this.getMainStock();
    }
  }

  private async getMainStock() {
    const stock = await this.prisma.asset.groupBy({
      by: ['modelId', 'status'],
      where: {
        isDeleted: false,
        status: AssetStatus.IN_STORAGE,
      },
      _count: { id: true },
    });

    const modelIds = [...new Set(stock.map((s) => s.modelId).filter(Boolean))];
    const models = await this.prisma.assetModel.findMany({
      where: { id: { in: modelIds as number[] } },
      select: { id: true, name: true, brand: true },
    });
    const modelMap = new Map(models.map((m) => [m.id, m]));

    return stock.map((s) => ({
      modelId: s.modelId,
      model: s.modelId ? modelMap.get(s.modelId) : null,
      status: s.status,
      count: s._count.id,
    }));
  }

  private async getDivisionStock(divisionId: number | null) {
    if (!divisionId) return [];

    const memberIds = await this.prisma.user
      .findMany({
        where: { divisionId, isActive: true, isDeleted: false },
        select: { id: true },
      })
      .then((users) => users.map((u) => u.id));

    return this.prisma.asset.findMany({
      where: {
        isDeleted: false,
        currentUserId: { in: memberIds },
      },
      include: {
        category: { select: { id: true, name: true } },
        model: { select: { id: true, name: true, brand: true } },
        currentUser: { select: { id: true, fullName: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  private async getPersonalStock(userId: number) {
    return this.prisma.asset.findMany({
      where: {
        isDeleted: false,
        currentUserId: userId,
      },
      include: {
        category: { select: { id: true, name: true } },
        model: { select: { id: true, name: true, brand: true } },
      },
      orderBy: { name: 'asc' },
    });
  }
}
