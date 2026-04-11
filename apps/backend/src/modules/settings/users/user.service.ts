import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../core/database/prisma.service';
import { CreateUserDto, UpdateUserDto, FilterUserDto } from './dto';
import { Prisma } from '../../../generated/prisma/client';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: FilterUserDto) {
    const {
      page = 1,
      limit = 20,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      role,
      divisionId,
      isActive,
    } = query;

    const where: Prisma.UserWhereInput = {
      isDeleted: false,
      ...(search && {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { employeeId: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(role && { role }),
      ...(divisionId && { divisionId }),
      ...(isActive !== undefined && { isActive }),
    };

    const allowedSortFields = [
      'createdAt',
      'fullName',
      'email',
      'employeeId',
      'role',
    ];
    const orderField = allowedSortFields.includes(sortBy)
      ? sortBy
      : 'createdAt';

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [orderField]: sortOrder },
        select: {
          id: true,
          uuid: true,
          employeeId: true,
          fullName: true,
          email: true,
          role: true,
          phone: true,
          avatarUrl: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          division: {
            select: { id: true, uuid: true, name: true, code: true },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(uuid: string) {
    const user = await this.prisma.user.findUnique({
      where: { uuid, isDeleted: false },
      select: {
        id: true,
        uuid: true,
        employeeId: true,
        fullName: true,
        email: true,
        role: true,
        phone: true,
        avatarUrl: true,
        isActive: true,
        permissions: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        division: {
          select: { id: true, uuid: true, name: true, code: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    return user;
  }

  async create(dto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        ...dto,
        password: hashedPassword,
      },
      select: {
        id: true,
        uuid: true,
        employeeId: true,
        fullName: true,
        email: true,
        role: true,
        phone: true,
        isActive: true,
        createdAt: true,
        division: {
          select: { id: true, uuid: true, name: true, code: true },
        },
      },
    });

    this.logger.log(`User created: ${user.email} (${user.role})`);
    return user;
  }

  async update(uuid: string, dto: UpdateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { uuid, isDeleted: false },
    });

    if (!existing) {
      throw new NotFoundException('User tidak ditemukan');
    }

    const updateData: Prisma.UserUpdateInput = { ...dto };

    if (dto.password) {
      updateData.password = await bcrypt.hash(dto.password, 12);
    }

    // Increment tokenVersion if password or role changed to invalidate existing tokens
    if (dto.password || (dto as Record<string, unknown>).role) {
      updateData.tokenVersion = { increment: 1 };
    }

    const user = await this.prisma.user.update({
      where: { uuid },
      data: updateData,
      select: {
        id: true,
        uuid: true,
        employeeId: true,
        fullName: true,
        email: true,
        role: true,
        phone: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        division: {
          select: { id: true, uuid: true, name: true, code: true },
        },
      },
    });

    this.logger.log(`User updated: ${user.email}`);
    return user;
  }

  async remove(uuid: string) {
    const existing = await this.prisma.user.findUnique({
      where: { uuid, isDeleted: false },
    });

    if (!existing) {
      throw new NotFoundException('User tidak ditemukan');
    }

    // Soft delete
    await this.prisma.user.update({
      where: { uuid },
      data: {
        isDeleted: true,
        isActive: false,
        tokenVersion: { increment: 1 },
      },
    });

    this.logger.log(`User soft-deleted: ${existing.email}`);
    return { message: 'User berhasil dihapus' };
  }
}
