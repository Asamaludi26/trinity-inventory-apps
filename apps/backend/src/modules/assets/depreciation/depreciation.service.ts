import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { CreateDepreciationDto } from './dto/create-depreciation.dto';
import { UpdateDepreciationDto } from './dto/update-depreciation.dto';
import { FilterDepreciationDto } from './dto/filter-depreciation.dto';
import { Prisma } from '../../../generated/prisma/client';

@Injectable()
export class DepreciationService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: FilterDepreciationDto) {
    const {
      page = 1,
      limit = 20,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      method,
    } = query;

    const where: Prisma.DepreciationWhereInput = {
      ...(method && { method }),
      ...(search && {
        purchase: {
          OR: [
            { supplier: { contains: search, mode: 'insensitive' } },
            { model: { name: { contains: search, mode: 'insensitive' } } },
          ],
        },
      }),
    };

    const allowedSortFields = ['createdAt', 'startDate', 'method'];
    const orderField = allowedSortFields.includes(sortBy)
      ? sortBy
      : 'createdAt';

    const [data, total] = await Promise.all([
      this.prisma.depreciation.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [orderField]: sortOrder },
        include: {
          purchase: {
            select: {
              id: true,
              supplier: true,
              unitPrice: true,
              totalPrice: true,
              purchaseDate: true,
              model: { select: { id: true, name: true, brand: true } },
            },
          },
          createdBy: { select: { id: true, fullName: true } },
        },
      }),
      this.prisma.depreciation.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const depreciation = await this.prisma.depreciation.findUnique({
      where: { id },
      include: {
        purchase: {
          include: {
            model: {
              select: {
                id: true,
                name: true,
                brand: true,
                type: {
                  select: {
                    id: true,
                    name: true,
                    category: { select: { id: true, name: true } },
                  },
                },
              },
            },
          },
        },
        createdBy: { select: { id: true, fullName: true } },
      },
    });

    if (!depreciation) {
      throw new NotFoundException('Data depresiasi tidak ditemukan');
    }
    return depreciation;
  }

  async create(dto: CreateDepreciationDto, userId: number) {
    return this.prisma.depreciation.create({
      data: {
        purchaseId: dto.purchaseId,
        method: dto.method,
        usefulLifeYears: dto.usefulLifeYears,
        salvageValue: dto.salvageValue,
        startDate: new Date(dto.startDate),
        createdById: userId,
      },
      include: {
        purchase: {
          select: {
            id: true,
            supplier: true,
            model: { select: { id: true, name: true } },
          },
        },
      },
    });
  }

  async update(id: string, dto: UpdateDepreciationDto) {
    await this.findOne(id);
    return this.prisma.depreciation.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.startDate && { startDate: new Date(dto.startDate) }),
      },
      include: {
        purchase: {
          select: {
            id: true,
            supplier: true,
            model: { select: { id: true, name: true } },
          },
        },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.depreciation.delete({ where: { id } });
    return null;
  }
}
