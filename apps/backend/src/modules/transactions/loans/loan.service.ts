import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { FilterLoanDto } from './dto/filter-loan.dto';
import { ApprovalService } from '../approval/approval.service';
import {
  Prisma,
  TransactionStatus,
  UserRole,
} from '../../../generated/prisma/client';

@Injectable()
export class LoanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly approvalService: ApprovalService,
  ) {}

  private async generateCode(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await this.prisma.loanRequest.count({
      where: { code: { startsWith: `LN-${dateStr}` } },
    });
    return `LN-${dateStr}-${String(count + 1).padStart(4, '0')}`;
  }

  async findAll(query: FilterLoanDto, userId: number, userRole: string) {
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

    const where: Prisma.LoanRequestWhereInput = {
      isDeleted: false,
      ...(status && { status }),
      ...(search && {
        OR: [
          { code: { contains: search, mode: 'insensitive' } },
          { purpose: { contains: search, mode: 'insensitive' } },
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

    const allowedSortFields = ['createdAt', 'code', 'status'];
    const orderField = allowedSortFields.includes(sortBy)
      ? sortBy
      : 'createdAt';

    const [data, total] = await Promise.all([
      this.prisma.loanRequest.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [orderField]: sortOrder },
        include: {
          createdBy: { select: { id: true, fullName: true } },
          items: true,
          _count: { select: { items: true, assetAssignments: true } },
        },
      }),
      this.prisma.loanRequest.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const loan = await this.prisma.loanRequest.findUnique({
      where: { id, isDeleted: false },
      include: {
        createdBy: { select: { id: true, fullName: true } },
        items: true,
        assetAssignments: {
          include: { asset: { select: { id: true, code: true, name: true } } },
        },
        returns: { select: { id: true, code: true, status: true } },
      },
    });

    if (!loan) {
      throw new NotFoundException('Peminjaman tidak ditemukan');
    }
    return loan;
  }

  async create(dto: CreateLoanDto, userId: number, userRole: UserRole) {
    const code = await this.generateCode();
    const approvalChain = this.approvalService.determineApprovalChain(
      userRole,
      'loans',
    );

    return this.prisma.loanRequest.create({
      data: {
        code,
        purpose: dto.purpose,
        expectedReturn: dto.expectedReturn
          ? new Date(dto.expectedReturn)
          : undefined,
        createdById: userId,
        approvalChain,
        items: {
          create: dto.items.map((item) => ({
            modelId: item.modelId,
            description: item.description,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        items: true,
        createdBy: { select: { id: true, fullName: true } },
      },
    });
  }

  async update(id: string, dto: UpdateLoanDto) {
    const existing = await this.findOne(id);
    if (existing.status !== TransactionStatus.PENDING) {
      throw new BadRequestException(
        'Hanya peminjaman dengan status PENDING yang dapat diubah',
      );
    }
    return this.prisma.loanRequest.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.expectedReturn && {
          expectedReturn: new Date(dto.expectedReturn),
        }),
        version: { increment: 1 },
      },
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
        'Peminjaman tidak dalam status yang dapat di-approve',
      );
    }
    const nextStatus =
      existing.status === TransactionStatus.PENDING
        ? TransactionStatus.LOGISTIC_APPROVED
        : TransactionStatus.APPROVED;

    return this.prisma.loanRequest.update({
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
      throw new BadRequestException('Peminjaman sudah ditolak atau dibatalkan');
    }
    return this.prisma.loanRequest.update({
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
        'Hanya peminjaman yang sudah di-approve yang dapat dieksekusi',
      );
    }
    return this.prisma.loanRequest.update({
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
        'Hanya peminjaman dengan status PENDING yang dapat dibatalkan',
      );
    }
    if (existing.createdById !== userId) {
      throw new BadRequestException(
        'Hanya pembuat peminjaman yang dapat membatalkan',
      );
    }
    return this.prisma.loanRequest.update({
      where: { id },
      data: { status: TransactionStatus.CANCELLED, version: { increment: 1 } },
    });
  }
}
