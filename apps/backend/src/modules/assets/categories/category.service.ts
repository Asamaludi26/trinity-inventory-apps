import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { FilterCategoryDto } from './dto/filter-category.dto';
import { Prisma } from '../../../generated/prisma/client';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly divisionInclude = {
    divisions: {
      select: {
        division: { select: { id: true, name: true, code: true } },
      },
    },
  };

  async findAll(query: FilterCategoryDto) {
    const {
      page = 1,
      limit = 20,
      search,
      sortBy = 'name',
      sortOrder = 'asc',
    } = query;

    const where: Prisma.AssetCategoryWhereInput = {
      isDeleted: false,
      ...(search && {
        name: { contains: search, mode: 'insensitive' },
      }),
    };

    const allowedSortFields = ['createdAt', 'name'];
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'name';

    const [data, total] = await Promise.all([
      this.prisma.assetCategory.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [orderField]: sortOrder },
        include: {
          ...this.divisionInclude,
          _count: {
            select: {
              types: { where: { isDeleted: false } },
              assets: { where: { isDeleted: false } },
            },
          },
        },
      }),
      this.prisma.assetCategory.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: number) {
    const category = await this.prisma.assetCategory.findUnique({
      where: { id, isDeleted: false },
      include: {
        ...this.divisionInclude,
        types: {
          where: { isDeleted: false },
          include: { _count: { select: { models: true } } },
        },
        _count: { select: { assets: { where: { isDeleted: false } } } },
      },
    });

    if (!category) {
      throw new NotFoundException('Kategori tidak ditemukan');
    }
    return category;
  }

  async create(dto: CreateCategoryDto) {
    const { divisionIds, ...data } = dto;

    return this.prisma.assetCategory.create({
      data: {
        ...data,
        ...(divisionIds?.length && {
          divisions: {
            create: divisionIds.map((divisionId) => ({ divisionId })),
          },
        }),
      },
      include: this.divisionInclude,
    });
  }

  async update(id: number, dto: UpdateCategoryDto) {
    await this.findOne(id);
    const { divisionIds, ...data } = dto;

    return this.prisma.$transaction(async (tx) => {
      if (divisionIds !== undefined) {
        await tx.categoryDivision.deleteMany({ where: { categoryId: id } });
        if (divisionIds.length > 0) {
          await tx.categoryDivision.createMany({
            data: divisionIds.map((divisionId) => ({
              categoryId: id,
              divisionId,
            })),
          });
        }
      }

      return tx.assetCategory.update({
        where: { id },
        data,
        include: this.divisionInclude,
      });
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    // Cascade protection: check for active (non-deleted) type children
    const typeCount = await this.prisma.assetType.count({
      where: { categoryId: id, isDeleted: false },
    });

    if (typeCount > 0) {
      throw new UnprocessableEntityException(
        `Tidak dapat menghapus kategori — masih memiliki ${typeCount} tipe aset. ` +
          `Hapus semua tipe aset terlebih dahulu.`,
      );
    }

    // Safe to soft-delete
    await this.prisma.assetCategory.update({
      where: { id },
      data: { isDeleted: true },
    });
    return null;
  }
}
