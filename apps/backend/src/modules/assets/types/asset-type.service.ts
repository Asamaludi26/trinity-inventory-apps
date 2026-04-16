import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { CreateAssetTypeDto } from './dto/create-asset-type.dto';
import { UpdateAssetTypeDto } from './dto/update-asset-type.dto';
import { FilterAssetTypeDto } from './dto/filter-asset-type.dto';
import { Prisma } from '../../../generated/prisma/client';

@Injectable()
export class AssetTypeService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: FilterAssetTypeDto) {
    const {
      page = 1,
      limit = 20,
      search,
      sortBy = 'name',
      sortOrder = 'asc',
      categoryId,
    } = query;

    const where: Prisma.AssetTypeWhereInput = {
      isDeleted: false,
      ...(search && { name: { contains: search, mode: 'insensitive' } }),
      ...(categoryId && { categoryId }),
    };

    const [data, total] = await Promise.all([
      this.prisma.assetType.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy === 'name' ? 'name' : 'createdAt']: sortOrder },
        include: {
          category: {
            select: { id: true, name: true, defaultClassification: true },
          },
          _count: {
            select: {
              models: { where: { isDeleted: false } },
              assets: { where: { isDeleted: false } },
            },
          },
        },
      }),
      this.prisma.assetType.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: number) {
    const type = await this.prisma.assetType.findUnique({
      where: { id, isDeleted: false },
      include: {
        category: {
          select: { id: true, name: true, defaultClassification: true },
        },
        models: { where: { isDeleted: false } },
      },
    });
    if (!type) throw new NotFoundException('Tipe aset tidak ditemukan');
    return type;
  }

  async create(dto: CreateAssetTypeDto) {
    return this.prisma.assetType.create({
      data: dto,
      include: {
        category: {
          select: { id: true, name: true, defaultClassification: true },
        },
      },
    });
  }

  async update(id: number, dto: UpdateAssetTypeDto) {
    await this.findOne(id);
    return this.prisma.assetType.update({
      where: { id },
      data: dto,
      include: {
        category: {
          select: { id: true, name: true, defaultClassification: true },
        },
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    // Cascade protection: check for active (non-deleted) model children
    const modelCount = await this.prisma.assetModel.count({
      where: { typeId: id, isDeleted: false },
    });

    if (modelCount > 0) {
      throw new UnprocessableEntityException(
        `Tidak dapat menghapus tipe aset — masih memiliki ${modelCount} model aset. ` +
          `Hapus semua model aset terlebih dahulu.`,
      );
    }

    // Safe to soft-delete
    await this.prisma.assetType.update({
      where: { id },
      data: { isDeleted: true },
    });
    return null;
  }
}
