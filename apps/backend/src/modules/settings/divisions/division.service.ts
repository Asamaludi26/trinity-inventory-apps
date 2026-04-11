import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { CreateDivisionDto, UpdateDivisionDto } from './dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { Prisma } from '../../../generated/prisma/client';

@Injectable()
export class DivisionService {
  private readonly logger = new Logger(DivisionService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const {
      page = 1,
      limit = 20,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const where: Prisma.DivisionWhereInput = {
      isDeleted: false,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const allowedSortFields = ['createdAt', 'name', 'code'];
    const orderField = allowedSortFields.includes(sortBy)
      ? sortBy
      : 'createdAt';

    const [data, total] = await Promise.all([
      this.prisma.division.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [orderField]: sortOrder },
        include: {
          _count: { select: { users: { where: { isDeleted: false } } } },
        },
      }),
      this.prisma.division.count({ where }),
    ]);

    return {
      data: data.map(({ _count, ...division }) => ({
        ...division,
        userCount: _count.users,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(uuid: string) {
    const division = await this.prisma.division.findUnique({
      where: { uuid, isDeleted: false },
      include: {
        users: {
          where: { isDeleted: false },
          select: {
            id: true,
            uuid: true,
            employeeId: true,
            fullName: true,
            email: true,
            role: true,
            isActive: true,
          },
          orderBy: { fullName: 'asc' },
        },
        _count: { select: { users: { where: { isDeleted: false } } } },
      },
    });

    if (!division) {
      throw new NotFoundException('Divisi tidak ditemukan');
    }

    const { _count, ...rest } = division;
    return { ...rest, userCount: _count.users };
  }

  async create(dto: CreateDivisionDto) {
    const division = await this.prisma.division.create({
      data: dto,
    });

    this.logger.log(`Division created: ${division.name} (${division.code})`);
    return division;
  }

  async update(uuid: string, dto: UpdateDivisionDto) {
    const existing = await this.prisma.division.findUnique({
      where: { uuid, isDeleted: false },
    });

    if (!existing) {
      throw new NotFoundException('Divisi tidak ditemukan');
    }

    const division = await this.prisma.division.update({
      where: { uuid },
      data: dto,
    });

    this.logger.log(`Division updated: ${division.name}`);
    return division;
  }

  async remove(uuid: string) {
    const existing = await this.prisma.division.findUnique({
      where: { uuid, isDeleted: false },
      include: {
        _count: { select: { users: { where: { isDeleted: false } } } },
      },
    });

    if (!existing) {
      throw new NotFoundException('Divisi tidak ditemukan');
    }

    if (existing._count.users > 0) {
      throw new NotFoundException(
        `Divisi tidak dapat dihapus karena masih memiliki ${existing._count.users} pengguna aktif`,
      );
    }

    // Soft delete
    await this.prisma.division.update({
      where: { uuid },
      data: { isDeleted: true, isActive: false },
    });

    this.logger.log(`Division soft-deleted: ${existing.name}`);
    return { message: 'Divisi berhasil dihapus' };
  }

  async findAllActive() {
    return this.prisma.division.findMany({
      where: { isActive: true, isDeleted: false },
      select: { id: true, uuid: true, name: true, code: true },
      orderBy: { name: 'asc' },
    });
  }
}
