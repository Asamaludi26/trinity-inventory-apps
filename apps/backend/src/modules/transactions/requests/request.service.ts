import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { FilterRequestDto } from './dto/filter-request.dto';
import { ApprovalService } from '../approval/approval.service';
import {
  Prisma,
  TransactionStatus,
  UserRole,
} from '../../../generated/prisma/client';

@Injectable()
export class RequestService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly approvalService: ApprovalService,
  ) {}

  private async generateCode(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await this.prisma.request.count({
      where: { code: { startsWith: `REQ-${dateStr}` } },
    });
    return `REQ-${dateStr}-${String(count + 1).padStart(4, '0')}`;
  }

  async findAll(query: FilterRequestDto, userId: number, userRole: string) {
    const {
      page = 1,
      limit = 20,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status,
      startDate,
      endDate,
    } = query;

    const where: Prisma.RequestWhereInput = {
      isDeleted: false,
      ...(status && { status }),
      ...(search && {
        OR: [
          { code: { contains: search, mode: 'insensitive' } },
          { title: { contains: search, mode: 'insensitive' } },
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

    const allowedSortFields = ['createdAt', 'code', 'status', 'title'];
    const orderField = allowedSortFields.includes(sortBy)
      ? sortBy
      : 'createdAt';

    const [data, total] = await Promise.all([
      this.prisma.request.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [orderField]: sortOrder },
        include: {
          createdBy: { select: { id: true, fullName: true } },
          items: true,
          _count: { select: { items: true } },
        },
      }),
      this.prisma.request.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const request = await this.prisma.request.findUnique({
      where: { id, isDeleted: false },
      include: {
        createdBy: { select: { id: true, fullName: true } },
        project: { select: { id: true, code: true, name: true } },
        items: true,
        assetRegistrations: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Request tidak ditemukan');
    }
    return request;
  }

  async create(dto: CreateRequestDto, userId: number, userRole: UserRole) {
    const code = await this.generateCode();
    const approvalChain = this.approvalService.determineApprovalChain(
      userRole,
      'requests',
    );

    return this.prisma.request.create({
      data: {
        code,
        title: dto.title,
        description: dto.description,
        priority: dto.priority ?? 'NORMAL',
        projectId: dto.projectId,
        createdById: userId,
        approvalChain,
        items: {
          create: dto.items.map((item) => ({
            modelId: item.modelId,
            description: item.description,
            quantity: item.quantity,
            note: item.note,
          })),
        },
      },
      include: {
        items: true,
        createdBy: { select: { id: true, fullName: true } },
      },
    });
  }

  async update(id: string, dto: UpdateRequestDto) {
    const existing = await this.findOne(id);
    if (existing.status !== TransactionStatus.PENDING) {
      throw new BadRequestException(
        'Hanya request dengan status PENDING yang dapat diubah',
      );
    }
    return this.prisma.request.update({
      where: { id },
      data: { ...dto, version: { increment: 1 } },
      include: { items: true },
    });
  }

  async approve(id: string) {
    const existing = await this.findOne(id);
    if (
      !(
        [
          TransactionStatus.PENDING,
          TransactionStatus.LOGISTIC_APPROVED,
        ] as string[]
      ).includes(existing.status)
    ) {
      throw new BadRequestException(
        'Request tidak dalam status yang dapat di-approve',
      );
    }

    const nextStatus =
      existing.status === TransactionStatus.PENDING
        ? TransactionStatus.LOGISTIC_APPROVED
        : TransactionStatus.APPROVED;

    return this.prisma.request.update({
      where: { id },
      data: { status: nextStatus, version: { increment: 1 } },
    });
  }

  async reject(id: string, reason: string) {
    const existing = await this.findOne(id);
    if (
      existing.status === TransactionStatus.REJECTED ||
      existing.status === TransactionStatus.CANCELLED
    ) {
      throw new BadRequestException('Request sudah ditolak atau dibatalkan');
    }
    return this.prisma.request.update({
      where: { id },
      data: {
        status: TransactionStatus.REJECTED,
        rejectionReason: reason,
        version: { increment: 1 },
      },
    });
  }

  async execute(id: string) {
    const existing = await this.findOne(id);
    if (existing.status !== TransactionStatus.APPROVED) {
      throw new BadRequestException(
        'Hanya request yang sudah di-approve yang dapat dieksekusi',
      );
    }
    return this.prisma.request.update({
      where: { id },
      data: { status: TransactionStatus.COMPLETED, version: { increment: 1 } },
    });
  }

  async cancel(id: string, userId: number) {
    const existing = await this.findOne(id);
    if (existing.status !== TransactionStatus.PENDING) {
      throw new BadRequestException(
        'Hanya request dengan status PENDING yang dapat dibatalkan',
      );
    }
    if (existing.createdById !== userId) {
      throw new BadRequestException(
        'Hanya pembuat request yang dapat membatalkan',
      );
    }
    return this.prisma.request.update({
      where: { id },
      data: { status: TransactionStatus.CANCELLED, version: { increment: 1 } },
    });
  }
}
