import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { NotificationService } from '../../../core/notifications/notification.service';
import { EventsService } from '../../../core/events/events.service';
import { FifoConsumptionService } from '../../assets/fifo-consumption.service';
import {
  CreateProjectDto,
  ProjectTaskDto,
  UpdateTaskDto,
  ProjectMaterialDto,
  ProjectTeamMemberDto,
} from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { FilterProjectDto } from './dto/filter-project.dto';
import {
  Prisma,
  TransactionStatus,
  UserRole,
} from '../../../generated/prisma/client';

@Injectable()
export class ProjectService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly eventsService: EventsService,
    private readonly fifoConsumption: FifoConsumptionService,
  ) {}

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

    // Calculate task progress percentage
    const progress = this.calculateProgress(project.tasks);

    return { ...project, progress };
  }

  /**
   * Calculate task completion percentage for a project
   * @returns number 0-100 representing completion percentage
   */
  private calculateProgress(tasks: Array<{ status: string }>): number {
    if (!tasks || tasks.length === 0) return 0;
    const completed = tasks.filter((t) => t.status === 'COMPLETED').length;
    return Math.round((completed / tasks.length) * 100);
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

  async update(id: string, dto: UpdateProjectDto, version: number) {
    const existing = await this.findOne(id);
    if (
      existing.status === TransactionStatus.COMPLETED ||
      existing.status === TransactionStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'Proyek yang sudah selesai atau dibatalkan tidak dapat diubah',
      );
    }

    const { count } = await this.prisma.infraProject.updateMany({
      where: { id, version },
      data: {
        ...dto,
        ...(dto.startDate && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate && { endDate: new Date(dto.endDate) }),
        version: { increment: 1 },
      },
    });

    if (count === 0) {
      throw new ConflictException(
        'Data telah diubah oleh pengguna lain. Silakan muat ulang data.',
      );
    }

    return this.prisma.infraProject.findUnique({
      where: { id },
      include: { customer: { select: { id: true, name: true } } },
    });
  }

  async approve(id: string, version: number) {
    const existing = await this.findOne(id);
    if (existing.status !== TransactionStatus.PENDING) {
      throw new BadRequestException(
        'Proyek tidak dalam status yang dapat di-approve',
      );
    }

    const { count } = await this.prisma.infraProject.updateMany({
      where: { id, version },
      data: { status: TransactionStatus.APPROVED, version: { increment: 1 } },
    });

    if (count === 0) {
      throw new ConflictException(
        'Data telah diubah oleh pengguna lain. Silakan muat ulang data.',
      );
    }

    const result = await this.prisma.infraProject.findUnique({
      where: { id },
    });

    this.eventsService.emitTransactionUpdate({
      id,
      code: existing.code,
      type: 'project',
      status: TransactionStatus.APPROVED,
      version: existing.version + 1,
    });

    this.notificationService
      .notifyTransactionStatusChange({
        recipientUserId: existing.createdById,
        transactionType: 'Proyek',
        transactionCode: existing.code,
        action: 'APPROVED',
        link: `/transactions/projects/${id}`,
      })
      .catch(() => {});

    return result;
  }

  async reject(id: string, _reason: string, version: number) {
    const existing = await this.findOne(id);
    if (
      existing.status === TransactionStatus.REJECTED ||
      existing.status === TransactionStatus.CANCELLED
    ) {
      throw new BadRequestException('Proyek sudah ditolak atau dibatalkan');
    }

    const { count } = await this.prisma.infraProject.updateMany({
      where: { id, version },
      data: { status: TransactionStatus.REJECTED, version: { increment: 1 } },
    });

    if (count === 0) {
      throw new ConflictException(
        'Data telah diubah oleh pengguna lain. Silakan muat ulang data.',
      );
    }

    const result = await this.prisma.infraProject.findUnique({
      where: { id },
    });

    this.eventsService.emitTransactionUpdate({
      id,
      code: existing.code,
      type: 'project',
      status: TransactionStatus.REJECTED,
      version: existing.version + 1,
    });

    this.notificationService
      .notifyTransactionStatusChange({
        recipientUserId: existing.createdById,
        transactionType: 'Proyek',
        transactionCode: existing.code,
        action: 'REJECTED',
        link: `/transactions/projects/${id}`,
        reason: _reason,
      })
      .catch(() => {});

    return result;
  }

  async execute(id: string, version: number) {
    const existing = await this.findOne(id);
    if (existing.status !== TransactionStatus.APPROVED) {
      throw new BadRequestException(
        'Hanya proyek yang sudah di-approve yang dapat dieksekusi',
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.infraProject.updateMany({
        where: { id, version },
        data: {
          status: TransactionStatus.IN_PROGRESS,
          version: { increment: 1 },
        },
      });

      if (count === 0) {
        throw new ConflictException(
          'Data telah diubah oleh pengguna lain. Silakan muat ulang data.',
        );
      }

      // FIFO material consumption for project materials
      await this.consumeProjectMaterials(existing, tx);

      return tx.infraProject.findUnique({ where: { id } });
    });

    this.eventsService.emitTransactionUpdate({
      id,
      code: existing.code,
      type: 'project',
      status: TransactionStatus.IN_PROGRESS,
      version: existing.version + 1,
    });

    this.notificationService
      .notifyTransactionStatusChange({
        recipientUserId: existing.createdById,
        transactionType: 'Proyek',
        transactionCode: existing.code,
        action: 'EXECUTED',
        link: `/transactions/projects/${id}`,
      })
      .catch(() => {});

    return result;
  }

  /**
   * Consume materials via FIFO when project execution starts.
   * Each allocated material with a modelId triggers FIFO consumption from stock.
   */
  private async consumeProjectMaterials(
    project: {
      id: string;
      code: string;
      createdById: number;
      materials: Array<{ modelId: number | null; quantity: number }>;
    },
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    const materialsWithModel = project.materials.filter(
      (m): m is typeof m & { modelId: number } =>
        m.modelId !== null && m.quantity > 0,
    );

    for (const material of materialsWithModel) {
      await this.fifoConsumption.consumeMaterial(
        material.modelId,
        material.quantity,
        `PROJECT-${project.code}`,
        'CONSUMED',
        project.createdById,
        tx,
      );
    }
  }

  async cancel(id: string, userId: number, version: number) {
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

    const { count } = await this.prisma.infraProject.updateMany({
      where: { id, version },
      data: { status: TransactionStatus.CANCELLED, version: { increment: 1 } },
    });

    if (count === 0) {
      throw new ConflictException(
        'Data telah diubah oleh pengguna lain. Silakan muat ulang data.',
      );
    }

    const result = await this.prisma.infraProject.findUnique({
      where: { id },
    });

    this.eventsService.emitTransactionUpdate({
      id,
      code: existing.code,
      type: 'project',
      status: TransactionStatus.CANCELLED,
      version: existing.version + 1,
    });

    return result;
  }

  // ──────────────── Complete / Hold / Resume ────────────────

  async complete(id: string, version: number) {
    const existing = await this.findOne(id);
    if (existing.status !== TransactionStatus.IN_PROGRESS) {
      throw new BadRequestException(
        'Hanya proyek IN_PROGRESS yang dapat diselesaikan',
      );
    }

    const { count } = await this.prisma.infraProject.updateMany({
      where: { id, version },
      data: {
        status: TransactionStatus.COMPLETED,
        version: { increment: 1 },
      },
    });

    if (count === 0) {
      throw new ConflictException(
        'Data telah diubah oleh pengguna lain. Silakan muat ulang data.',
      );
    }

    const result = await this.prisma.infraProject.findUnique({
      where: { id },
    });

    this.eventsService.emitTransactionUpdate({
      id,
      code: existing.code,
      type: 'project',
      status: TransactionStatus.COMPLETED,
      version: existing.version + 1,
    });

    this.notificationService
      .notifyTransactionStatusChange({
        recipientUserId: existing.createdById,
        transactionType: 'Proyek',
        transactionCode: existing.code,
        action: 'COMPLETED',
        link: `/transactions/projects/${id}`,
      })
      .catch(() => {});

    return result;
  }

  async hold(id: string, version: number) {
    const existing = await this.findOne(id);
    if (existing.status !== TransactionStatus.IN_PROGRESS) {
      throw new BadRequestException(
        'Hanya proyek IN_PROGRESS yang dapat di-hold',
      );
    }

    const { count } = await this.prisma.infraProject.updateMany({
      where: { id, version },
      data: {
        status: TransactionStatus.ON_HOLD,
        version: { increment: 1 },
      },
    });

    if (count === 0) {
      throw new ConflictException(
        'Data telah diubah oleh pengguna lain. Silakan muat ulang data.',
      );
    }

    const result = await this.prisma.infraProject.findUnique({
      where: { id },
    });

    this.eventsService.emitTransactionUpdate({
      id,
      code: existing.code,
      type: 'project',
      status: TransactionStatus.ON_HOLD,
      version: existing.version + 1,
    });

    this.notificationService
      .notifyTransactionStatusChange({
        recipientUserId: existing.createdById,
        transactionType: 'Proyek',
        transactionCode: existing.code,
        action: 'ON_HOLD',
        link: `/transactions/projects/${id}`,
      })
      .catch(() => {});

    return result;
  }

  async resume(id: string, version: number) {
    const existing = await this.findOne(id);
    if (existing.status !== TransactionStatus.ON_HOLD) {
      throw new BadRequestException(
        'Hanya proyek ON_HOLD yang dapat di-resume',
      );
    }

    const { count } = await this.prisma.infraProject.updateMany({
      where: { id, version },
      data: {
        status: TransactionStatus.IN_PROGRESS,
        version: { increment: 1 },
      },
    });

    if (count === 0) {
      throw new ConflictException(
        'Data telah diubah oleh pengguna lain. Silakan muat ulang data.',
      );
    }

    const result = await this.prisma.infraProject.findUnique({
      where: { id },
    });

    this.eventsService.emitTransactionUpdate({
      id,
      code: existing.code,
      type: 'project',
      status: TransactionStatus.IN_PROGRESS,
      version: existing.version + 1,
    });

    this.notificationService
      .notifyTransactionStatusChange({
        recipientUserId: existing.createdById,
        transactionType: 'Proyek',
        transactionCode: existing.code,
        action: 'RESUMED',
        link: `/transactions/projects/${id}`,
      })
      .catch(() => {});

    return result;
  }

  // ──────────────── Task CRUD ────────────────

  async addTask(projectId: string, dto: ProjectTaskDto) {
    await this.findOne(projectId);
    return this.prisma.infraProjectTask.create({
      data: {
        projectId,
        title: dto.title,
        description: dto.description,
        assigneeId: dto.assigneeId,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
    });
  }

  async updateTask(projectId: string, taskId: number, data: UpdateTaskDto) {
    const task = await this.prisma.infraProjectTask.findFirst({
      where: { id: taskId, projectId },
    });
    if (!task) {
      throw new NotFoundException('Task tidak ditemukan');
    }
    return this.prisma.infraProjectTask.update({
      where: { id: taskId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.assigneeId !== undefined && { assigneeId: data.assigneeId }),
        ...(data.dueDate !== undefined && {
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
        }),
      },
    });
  }

  async removeTask(projectId: string, taskId: number) {
    const task = await this.prisma.infraProjectTask.findFirst({
      where: { id: taskId, projectId },
    });
    if (!task) {
      throw new NotFoundException('Task tidak ditemukan');
    }
    await this.prisma.infraProjectTask.delete({ where: { id: taskId } });
    return { success: true };
  }

  // ──────────────── Material CRUD ────────────────

  async addMaterial(projectId: string, dto: ProjectMaterialDto) {
    await this.findOne(projectId);
    return this.prisma.infraProjectMaterial.create({
      data: {
        projectId,
        modelId: dto.modelId,
        description: dto.description,
        quantity: dto.quantity,
        note: dto.note,
      },
    });
  }

  async removeMaterial(projectId: string, materialId: number) {
    const material = await this.prisma.infraProjectMaterial.findFirst({
      where: { id: materialId, projectId },
    });
    if (!material) {
      throw new NotFoundException('Material tidak ditemukan');
    }
    await this.prisma.infraProjectMaterial.delete({
      where: { id: materialId },
    });
    return { success: true };
  }

  // ──────────────── Team CRUD ────────────────

  async addTeamMember(projectId: string, dto: ProjectTeamMemberDto) {
    await this.findOne(projectId);
    return this.prisma.infraProjectTeamMember.create({
      data: { projectId, userId: dto.userId, role: dto.role },
    });
  }

  async removeTeamMember(projectId: string, memberId: number) {
    const member = await this.prisma.infraProjectTeamMember.findFirst({
      where: { id: memberId, projectId },
    });
    if (!member) {
      throw new NotFoundException('Anggota tim tidak ditemukan');
    }
    await this.prisma.infraProjectTeamMember.delete({
      where: { id: memberId },
    });
    return { success: true };
  }
}
