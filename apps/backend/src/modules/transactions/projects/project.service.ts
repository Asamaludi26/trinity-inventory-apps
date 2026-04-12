import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { FilterProjectDto } from './dto/filter-project.dto';
import {
  Prisma,
  TransactionStatus,
  UserRole,
} from '../../../generated/prisma/client';

@Injectable()
export class ProjectService {
  constructor(private readonly prisma: PrismaService) {}

  private async generateCode(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await this.prisma.infraProject.count({
      where: { code: { startsWith: `PRJ-${dateStr}` } },
    });
    return `PRJ-${dateStr}-${String(count + 1).padStart(4, '0')}`;
  }

  async findAll(query: FilterProjectDto, userId: number, userRole: string) {
    const {
      page = 1,
      limit = 20,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status,
      customerId,
      startDate,
      endDate,
    } = query;

    const where: Prisma.InfraProjectWhereInput = {
      isDeleted: false,
      ...(status && { status }),
      ...(customerId && { customerId }),
      ...(search && {
        OR: [
          { code: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...((startDate || endDate) && {
        createdAt: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate) }),
        },
      }),
      ...(([UserRole.STAFF, UserRole.LEADER] as string[]).includes(
        userRole,
      ) && {
        createdById: userId,
      }),
    };

    const allowedSortFields = [
      'createdAt',
      'code',
      'status',
      'name',
      'startDate',
    ];
    const orderField = allowedSortFields.includes(sortBy)
      ? sortBy
      : 'createdAt';

    const [data, total] = await Promise.all([
      this.prisma.infraProject.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [orderField]: sortOrder },
        include: {
          customer: { select: { id: true, name: true, code: true } },
          _count: { select: { tasks: true, materials: true, team: true } },
        },
      }),
      this.prisma.infraProject.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const project = await this.prisma.infraProject.findUnique({
      where: { id, isDeleted: false },
      include: {
        customer: { select: { id: true, name: true, code: true } },
        tasks: { orderBy: { createdAt: 'asc' } },
        materials: { orderBy: { createdAt: 'asc' } },
        team: { orderBy: { joinedAt: 'asc' } },
        requests: {
          where: { isDeleted: false },
          select: { id: true, code: true, title: true, status: true },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Proyek tidak ditemukan');
    }
    return project;
  }

  async create(dto: CreateProjectDto, userId: number) {
    const code = await this.generateCode();

    return this.prisma.infraProject.create({
      data: {
        code,
        name: dto.name,
        description: dto.description,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        location: dto.location,
        customerId: dto.customerId,
        createdById: userId,
        ...(dto.tasks?.length && {
          tasks: {
            create: dto.tasks.map((t) => ({
              title: t.title,
              description: t.description,
              assigneeId: t.assigneeId,
              dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
            })),
          },
        }),
        ...(dto.materials?.length && {
          materials: {
            create: dto.materials.map((m) => ({
              modelId: m.modelId,
              description: m.description,
              quantity: m.quantity,
              note: m.note,
            })),
          },
        }),
        ...(dto.team?.length && {
          team: {
            create: dto.team.map((tm) => ({
              userId: tm.userId,
              role: tm.role,
            })),
          },
        }),
      },
      include: {
        tasks: true,
        materials: true,
        team: true,
        customer: { select: { id: true, name: true } },
      },
    });
  }

  async update(id: string, dto: UpdateProjectDto) {
    const existing = await this.findOne(id);
    if (
      existing.status === TransactionStatus.COMPLETED ||
      existing.status === TransactionStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'Proyek yang sudah selesai atau dibatalkan tidak dapat diubah',
      );
    }
    return this.prisma.infraProject.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.startDate && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate && { endDate: new Date(dto.endDate) }),
        version: { increment: 1 },
      },
      include: { customer: { select: { id: true, name: true } } },
    });
  }

  async approve(id: string) {
    const existing = await this.findOne(id);
    if (existing.status !== TransactionStatus.PENDING) {
      throw new BadRequestException(
        'Proyek tidak dalam status yang dapat di-approve',
      );
    }
    return this.prisma.infraProject.update({
      where: { id },
      data: { status: TransactionStatus.APPROVED, version: { increment: 1 } },
    });
  }

  async reject(id: string, _reason: string) {
    const existing = await this.findOne(id);
    if (
      existing.status === TransactionStatus.REJECTED ||
      existing.status === TransactionStatus.CANCELLED
    ) {
      throw new BadRequestException('Proyek sudah ditolak atau dibatalkan');
    }
    return this.prisma.infraProject.update({
      where: { id },
      data: { status: TransactionStatus.REJECTED, version: { increment: 1 } },
    });
  }

  async execute(id: string) {
    const existing = await this.findOne(id);
    if (existing.status !== TransactionStatus.APPROVED) {
      throw new BadRequestException(
        'Hanya proyek yang sudah di-approve yang dapat dieksekusi',
      );
    }
    return this.prisma.infraProject.update({
      where: { id },
      data: {
        status: TransactionStatus.IN_PROGRESS,
        version: { increment: 1 },
      },
    });
  }

  async cancel(id: string, userId: number) {
    const existing = await this.findOne(id);
    if (existing.status !== TransactionStatus.PENDING) {
      throw new BadRequestException(
        'Hanya proyek dengan status PENDING yang dapat dibatalkan',
      );
    }
    if (existing.createdById !== userId) {
      throw new BadRequestException(
        'Hanya pembuat proyek yang dapat membatalkan',
      );
    }
    return this.prisma.infraProject.update({
      where: { id },
      data: { status: TransactionStatus.CANCELLED, version: { increment: 1 } },
    });
  }
}
