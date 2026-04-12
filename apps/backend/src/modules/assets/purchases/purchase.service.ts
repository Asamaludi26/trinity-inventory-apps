import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';
import { FilterPurchaseDto } from './dto/filter-purchase.dto';
import { Prisma } from '../../../generated/prisma/client';

@Injectable()
export class PurchaseService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: FilterPurchaseDto) {
    const {
      page = 1,
      limit = 20,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      modelId,
      startDate,
      endDate,
    } = query;

    const where: Prisma.PurchaseMasterDataWhereInput = {
      isDeleted: false,
      ...(modelId && { modelId }),
      ...(search && {
        OR: [
          { supplier: { contains: search, mode: 'insensitive' } },
          { invoiceNumber: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...((startDate || endDate) && {
        purchaseDate: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate) }),
        },
      }),
    };

    const allowedSortFields = [
      'createdAt',
      'purchaseDate',
      'supplier',
      'totalPrice',
    ];
    const orderField = allowedSortFields.includes(sortBy)
      ? sortBy
      : 'createdAt';

    const [data, total] = await Promise.all([
      this.prisma.purchaseMasterData.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [orderField]: sortOrder },
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
          createdBy: { select: { id: true, fullName: true } },
          depreciation: {
            select: { id: true, method: true, usefulLifeYears: true },
          },
        },
      }),
      this.prisma.purchaseMasterData.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const purchase = await this.prisma.purchaseMasterData.findUnique({
      where: { id, isDeleted: false },
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
        createdBy: { select: { id: true, fullName: true } },
        depreciation: true,
      },
    });

    if (!purchase) {
      throw new NotFoundException('Data pembelian tidak ditemukan');
    }
    return purchase;
  }

  async create(dto: CreatePurchaseDto, userId: number) {
    return this.prisma.purchaseMasterData.create({
      data: {
        modelId: dto.modelId,
        supplier: dto.supplier,
        unitPrice: dto.unitPrice,
        quantity: dto.quantity,
        totalPrice: dto.totalPrice,
        purchaseDate: new Date(dto.purchaseDate),
        warrantyMonths: dto.warrantyMonths,
        invoiceNumber: dto.invoiceNumber,
        note: dto.note,
        createdById: userId,
      },
      include: {
        model: { select: { id: true, name: true, brand: true } },
      },
    });
  }

  async update(id: string, dto: UpdatePurchaseDto) {
    await this.findOne(id);
    return this.prisma.purchaseMasterData.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.purchaseDate && { purchaseDate: new Date(dto.purchaseDate) }),
      },
      include: {
        model: { select: { id: true, name: true, brand: true } },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.purchaseMasterData.update({
      where: { id },
      data: { isDeleted: true },
    });
    return null;
  }
}
