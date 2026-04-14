import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { CreateAssetModelDto } from './dto/create-asset-model.dto';
import { UpdateAssetModelDto } from './dto/update-asset-model.dto';
import { FilterAssetModelDto } from './dto/filter-asset-model.dto';
import { Prisma } from '../../../generated/prisma/client';

@Injectable()
export class AssetModelService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: FilterAssetModelDto) {
    const {
      page = 1,
      limit = 20,
      search,
      sortBy = 'name',
      sortOrder = 'asc',
      typeId,
    } = query;

    const where: Prisma.AssetModelWhereInput = {
      isDeleted: false,
      ...(typeId && { typeId }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { brand: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const allowedSortFields = ['createdAt', 'name', 'brand'];
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'name';

    const [data, total] = await Promise.all([
      this.prisma.assetModel.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [orderField]: sortOrder },
        include: {
          type: {
            select: {
              id: true,
              name: true,
              category: { select: { id: true, name: true } },
            },
          },
          _count: {
            select: { assets: { where: { isDeleted: false } } },
          },
        },
      }),
      this.prisma.assetModel.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: number) {
    const model = await this.prisma.assetModel.findUnique({
      where: { id, isDeleted: false },
      include: {
        type: {
          select: {
            id: true,
            name: true,
            category: { select: { id: true, name: true } },
          },
        },
        purchaseMasterData: true,
        stockThreshold: true,
        _count: { select: { assets: { where: { isDeleted: false } } } },
      },
    });

    if (!model) {
      throw new NotFoundException('Model aset tidak ditemukan');
    }
    return model;
  }

  async create(dto: CreateAssetModelDto) {
    return this.prisma.assetModel.create({
      data: dto,
      include: {
        type: { select: { id: true, name: true } },
      },
    });
  }

  async update(id: number, dto: UpdateAssetModelDto) {
    await this.findOne(id);
    return this.prisma.assetModel.update({
      where: { id },
      data: dto,
      include: {
        type: { select: { id: true, name: true } },
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    // Cascade protection: check for active (non-deleted) asset instances
    const assetCount = await this.prisma.asset.count({
      where: { modelId: id, isDeleted: false },
    });

    if (assetCount > 0) {
      throw new UnprocessableEntityException(
        `Tidak dapat menghapus model aset — masih memiliki ${assetCount} aset terdaftar. ` +
          `Hapus semua aset terlebih dahulu.`,
      );
    }

    // Safe to soft-delete
    await this.prisma.assetModel.update({
      where: { id },
      data: { isDeleted: true },
    });
    return null;
  }
}
