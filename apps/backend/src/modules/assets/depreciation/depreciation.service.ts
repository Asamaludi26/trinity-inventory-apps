import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { CreateDepreciationDto } from './dto/create-depreciation.dto';
import { UpdateDepreciationDto } from './dto/update-depreciation.dto';
import { FilterDepreciationDto } from './dto/filter-depreciation.dto';
import { Prisma, DepreciationMethod } from '../../../generated/prisma/client';

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
    const existing = await this.prisma.depreciation.findUnique({
      where: { purchaseId: dto.purchaseId },
    });
    if (existing) {
      throw new UnprocessableEntityException(
        'Data pembelian ini sudah memiliki data depresiasi. Satu pembelian hanya boleh memiliki satu data depresiasi.',
      );
    }

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

  /**
   * Calculate depreciation value for a given month using Straight-Line method
   * Formula: monthlyDep = (originalCost - salvageValue) / (usefulLifeYears * 12)
   */
  calculateStraightLineDepreciation(
    originalCost: number,
    salvageValue: number,
    usefulLifeYears: number,
    monthsElapsed: number,
  ) {
    const depreciableAmount = originalCost - salvageValue;
    const totalMonths = usefulLifeYears * 12;
    const monthlyDepreciation = depreciableAmount / totalMonths;

    return {
      monthlyDepreciation: Number(monthlyDepreciation.toFixed(2)),
      accumulatedDepreciation: Number(
        (monthlyDepreciation * monthsElapsed).toFixed(2),
      ),
      bookValue: Number(
        (originalCost - monthlyDepreciation * monthsElapsed).toFixed(2),
      ),
      annualDepreciation: Number((monthlyDepreciation * 12).toFixed(2)),
    };
  }

  /**
   * Calculate depreciation value for a given month using Declining Balance method
   * Formula: rate = 1 - (salvageValue / originalCost) ^ (1 / usefulLifeYears)
   * Then apply rate to remaining book value each year
   */
  calculateDecliningBalanceDepreciation(
    originalCost: number,
    salvageValue: number,
    usefulLifeYears: number,
    monthsElapsed: number,
  ) {
    // Calculate annual depreciation rate
    const rate =
      1 -
      Math.pow(salvageValue / Math.max(originalCost, 1), 1 / usefulLifeYears);

    let bookValue = originalCost;
    let accumulatedDepreciation = 0;

    // Simulate year-by-year depreciation
    const fullYearsElapsed = Math.floor(monthsElapsed / 12);
    for (let year = 0; year < fullYearsElapsed; year++) {
      const yearDepreciation = bookValue * rate;
      accumulatedDepreciation += yearDepreciation;
      bookValue -= yearDepreciation;
    }

    // Calculate partial month depreciation for remaining months
    const remainingMonths = monthsElapsed % 12;
    const monthlyRateForPartialYear = (bookValue * rate) / 12;
    const partialDepreciation = monthlyRateForPartialYear * remainingMonths;

    return {
      monthlyDepreciation: Number(monthlyRateForPartialYear.toFixed(2)),
      accumulatedDepreciation: Number(
        (accumulatedDepreciation + partialDepreciation).toFixed(2),
      ),
      bookValue: Number(
        Math.max(bookValue - partialDepreciation, salvageValue).toFixed(2),
      ),
      depreciationRate: Number((rate * 100).toFixed(2)), // Rate as percentage
    };
  }

  /**
   * Get current depreciation values based on time elapsed from startDate
   */
  async getDepreciationStatus(depreciationId: string) {
    const depreciation = await this.findOne(depreciationId);
    const purchase = depreciation.purchase;

    const originalCost = Number(purchase.totalPrice);
    const salvageValue = Number(depreciation.salvageValue);
    const usefulLifeYears = depreciation.usefulLifeYears;
    const startDate = depreciation.startDate;

    // Calculate months elapsed
    const now = new Date();
    const monthsElapsed = Math.max(
      0,
      (now.getFullYear() - startDate.getFullYear()) * 12 +
        (now.getMonth() - startDate.getMonth()),
    );

    let depreciationData;
    if (depreciation.method === DepreciationMethod.STRAIGHT_LINE) {
      depreciationData = this.calculateStraightLineDepreciation(
        originalCost,
        salvageValue,
        usefulLifeYears,
        monthsElapsed,
      );
    } else if (depreciation.method === DepreciationMethod.DECLINING_BALANCE) {
      depreciationData = this.calculateDecliningBalanceDepreciation(
        originalCost,
        salvageValue,
        usefulLifeYears,
        monthsElapsed,
      );
    }

    return {
      depreciationId: depreciation.id,
      method: depreciation.method,
      originalCost,
      salvageValue,
      usefulLifeYears,
      startDate,
      monthsElapsed,
      ...depreciationData,
    };
  }

  /**
   * Generate depreciation schedule (monthly entries) from startDate to end of useful life
   */
  generateDepreciationSchedule(
    originalCost: number,
    salvageValue: number,
    usefulLifeYears: number,
    startDate: Date,
    method: DepreciationMethod,
  ) {
    const schedule = [];
    const totalMonths = usefulLifeYears * 12;

    for (let month = 0; month <= totalMonths; month++) {
      const scheduleDate = new Date(startDate);
      scheduleDate.setMonth(scheduleDate.getMonth() + month);

      let monthlyDep: number;
      let accumulatedDep: number;
      let bookValue: number;

      if (method === DepreciationMethod.STRAIGHT_LINE) {
        const depData = this.calculateStraightLineDepreciation(
          originalCost,
          salvageValue,
          usefulLifeYears,
          month,
        );
        monthlyDep = depData.monthlyDepreciation;
        accumulatedDep = depData.accumulatedDepreciation;
        bookValue = depData.bookValue;
      } else {
        const depData = this.calculateDecliningBalanceDepreciation(
          originalCost,
          salvageValue,
          usefulLifeYears,
          month,
        );
        monthlyDep = depData.monthlyDepreciation;
        accumulatedDep = depData.accumulatedDepreciation;
        bookValue = depData.bookValue;
      }

      schedule.push({
        month,
        date: scheduleDate,
        monthlyDepreciation: monthlyDep,
        accumulatedDepreciation: accumulatedDep,
        bookValue,
      });
    }

    return schedule;
  }
}
