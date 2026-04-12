import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { FilterCategoryDto } from './dto/filter-category.dto';
import { Prisma } from '../../../generated/prisma/client';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

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
    return this.prisma.assetCategory.create({ data: dto });
  }

  async update(id: number, dto: UpdateCategoryDto) {
    await this.findOne(id);
    return this.prisma.assetCategory.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.assetCategory.update({
      where: { id },
      data: { isDeleted: true },
    });
    return null;
  }
}
