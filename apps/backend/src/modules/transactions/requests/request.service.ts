import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { NotificationService } from '../../../core/notifications/notification.service';
import { EventsService } from '../../../core/events/events.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { FilterRequestDto } from './dto/filter-request.dto';
import { RegisterAssetsDto } from './dto/register-assets.dto';
import { ApprovalService } from '../approval/approval.service';
import { StockMovementService } from '../stock-movements/stock-movement.service';
import {
  Prisma,
  TransactionStatus,
  UserRole,
  AssetCondition,
  AssetStatus,
} from '../../../generated/prisma/client';

@Injectable()
export class RequestService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly approvalService: ApprovalService,
    private readonly notificationService: NotificationService,
    private readonly eventsService: EventsService,
    private readonly stockMovementService: StockMovementService,
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
    const approvalChain = this.approvalService.buildApprovalChain(
      userRole,
      'REQUEST',
    );

    const request = await this.prisma.request.create({
      data: {
        code,
        title: dto.title,
        description: dto.description,
        priority: dto.priority ?? 'NORMAL',
        projectId: dto.projectId,
        createdById: userId,
        approvalChain: approvalChain as unknown as Prisma.InputJsonValue,
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

    // Notify first-tier approvers (fire and forget)
    this.approvalService.getFirstTierApproverIds(approvalChain).then((ids) => {
      ids.forEach((approverId) => {
        this.notificationService
          .notifyApprovalRequired({
            recipientUserId: approverId,
            transactionType: 'Permintaan',
            transactionCode: code,
            requesterName: request.createdBy.fullName,
            link: `/transactions/requests/${request.id}`,
          })
          .catch(() => {});
      });
    });

    return request;
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

  async approve(
    id: string,
    version: number,
    approverId: number,
    approverRole: UserRole,
    approverName: string,
    note?: string,
    itemAdjustments?: { itemId: number; approvedQuantity: number }[],
  ) {
    const existing = await this.findOne(id);
    if (
      existing.status === TransactionStatus.REJECTED ||
      existing.status === TransactionStatus.CANCELLED ||
      existing.status === TransactionStatus.COMPLETED
    ) {
      throw new BadRequestException(
        'Request tidak dalam status yang dapat di-approve',
      );
    }

    const chain = this.approvalService.parseChain(existing.approvalChain);
    const updatedChain = this.approvalService.processApproval(
      chain,
      approverRole,
      approverId,
      approverName,
      existing.createdById,
      note,
    );

    const isComplete = this.approvalService.isChainComplete(updatedChain);
    const nextStatus = isComplete
      ? TransactionStatus.APPROVED
      : existing.status === TransactionStatus.PENDING
        ? TransactionStatus.LOGISTIC_APPROVED
        : TransactionStatus.AWAITING_CEO_APPROVAL;

    const result = await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.request.updateMany({
        where: { id, version },
        data: {
          status: nextStatus,
          approvalChain: updatedChain as unknown as Prisma.InputJsonValue,
          version: { increment: 1 },
        },
      });

      if (count === 0) {
        throw new ConflictException(
          'Data telah diubah oleh pengguna lain. Silakan muat ulang data.',
        );
      }

      // Apply partial approval adjustments if provided
      if (itemAdjustments?.length) {
        for (const adj of itemAdjustments) {
          const item = existing.items.find((i) => i.id === adj.itemId);
          if (!item) {
            throw new BadRequestException(
              `Item dengan ID ${adj.itemId} tidak ditemukan`,
            );
          }
          if (adj.approvedQuantity > item.quantity) {
            throw new BadRequestException(
              `Jumlah disetujui (${adj.approvedQuantity}) tidak boleh melebihi jumlah diminta (${item.quantity}) untuk item "${item.description}"`,
            );
          }
          await tx.requestItem.update({
            where: { id: adj.itemId },
            data: { approvedQuantity: adj.approvedQuantity },
          });
        }
      }

      return tx.request.findUnique({
        where: { id },
        include: { items: true },
      });
    });

    this.eventsService.emitTransactionUpdate({
      id,
      code: existing.code,
      type: 'request',
      status: nextStatus,
      version: existing.version + 1,
    });

    this.notificationService
      .notifyTransactionStatusChange({
        recipientUserId: existing.createdById,
        transactionType: 'Permintaan',
        transactionCode: existing.code,
        action: 'APPROVED',
        link: `/transactions/requests/${id}`,
      })
      .catch(() => {});

    return result;
  }

  async reject(
    id: string,
    reason: string,
    version: number,
    approverId: number,
    approverRole: UserRole,
    approverName: string,
  ) {
    const existing = await this.findOne(id);
    if (
      existing.status === TransactionStatus.REJECTED ||
      existing.status === TransactionStatus.CANCELLED
    ) {
      throw new BadRequestException('Request sudah ditolak atau dibatalkan');
    }

    const chain = this.approvalService.parseChain(existing.approvalChain);
    const updatedChain = this.approvalService.processRejection(
      chain,
      approverRole,
      approverId,
      approverName,
      existing.createdById,
      reason,
    );

    const { count } = await this.prisma.request.updateMany({
      where: { id, version },
      data: {
        status: TransactionStatus.REJECTED,
        rejectionReason: reason,
        approvalChain: updatedChain as unknown as Prisma.InputJsonValue,
        version: { increment: 1 },
      },
    });

    if (count === 0) {
      throw new ConflictException(
        'Data telah diubah oleh pengguna lain. Silakan muat ulang data.',
      );
    }

    const result = await this.prisma.request.findUnique({ where: { id } });

    this.eventsService.emitTransactionUpdate({
      id,
      code: existing.code,
      type: 'request',
      status: TransactionStatus.REJECTED,
      version: existing.version + 1,
    });

    this.notificationService
      .notifyTransactionStatusChange({
        recipientUserId: existing.createdById,
        transactionType: 'Permintaan',
        transactionCode: existing.code,
        action: 'REJECTED',
        link: `/transactions/requests/${id}`,
        reason,
      })
      .catch(() => {});

    return result;
  }

  /**
   * Valid request status transitions (post-approval lifecycle).
   * APPROVED → PURCHASING → IN_DELIVERY → ARRIVED → COMPLETED
   */
  private readonly REQUEST_TRANSITIONS: Record<string, string> = {
    [TransactionStatus.APPROVED]: TransactionStatus.PURCHASING,
    [TransactionStatus.PURCHASING]: TransactionStatus.IN_DELIVERY,
    [TransactionStatus.IN_DELIVERY]: TransactionStatus.ARRIVED,
    [TransactionStatus.ARRIVED]: TransactionStatus.COMPLETED,
  };

  private readonly TRANSITION_LABELS: Record<string, string> = {
    [TransactionStatus.PURCHASING]: 'PURCHASING',
    [TransactionStatus.IN_DELIVERY]: 'IN_DELIVERY',
    [TransactionStatus.ARRIVED]: 'ARRIVED',
    [TransactionStatus.COMPLETED]: 'COMPLETED',
  };

  async execute(id: string, version: number) {
    const existing = await this.findOne(id);
    const nextStatus = this.REQUEST_TRANSITIONS[existing.status];
    if (!nextStatus) {
      throw new BadRequestException(
        `Request dengan status ${existing.status} tidak dapat ditransisikan ke tahap berikutnya`,
      );
    }

    const { count } = await this.prisma.request.updateMany({
      where: { id, version },
      data: {
        status: nextStatus as TransactionStatus,
        version: { increment: 1 },
      },
    });

    if (count === 0) {
      throw new ConflictException(
        'Data telah diubah oleh pengguna lain. Silakan muat ulang data.',
      );
    }

    const result = await this.prisma.request.findUnique({ where: { id } });

    this.eventsService.emitTransactionUpdate({
      id,
      code: existing.code,
      type: 'request',
      status: nextStatus as TransactionStatus,
      version: existing.version + 1,
    });

    this.notificationService
      .notifyTransactionStatusChange({
        recipientUserId: existing.createdById,
        transactionType: 'Permintaan',
        transactionCode: existing.code,
        action: (this.TRANSITION_LABELS[nextStatus] ?? nextStatus) as
          | 'PURCHASING'
          | 'IN_DELIVERY'
          | 'ARRIVED'
          | 'COMPLETED',
        link: `/transactions/requests/${id}`,
      })
      .catch(() => {});

    return result;
  }

  async cancel(id: string, userId: number, version: number) {
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

    const { count } = await this.prisma.request.updateMany({
      where: { id, version },
      data: { status: TransactionStatus.CANCELLED, version: { increment: 1 } },
    });

    if (count === 0) {
      throw new ConflictException(
        'Data telah diubah oleh pengguna lain. Silakan muat ulang data.',
      );
    }

    this.eventsService.emitTransactionUpdate({
      id,
      code: existing.code,
      type: 'request',
      status: TransactionStatus.CANCELLED,
      version: existing.version + 1,
    });

    return this.prisma.request.findUnique({ where: { id } });
  }

  private async generateAssetCode(
    tx: Prisma.TransactionClient,
  ): Promise<string> {
    const now = new Date();
    const prefix = `AST-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const lastAsset = await tx.asset.findFirst({
      where: { code: { startsWith: prefix } },
      orderBy: { code: 'desc' },
      select: { code: true },
    });
    const seq = lastAsset
      ? parseInt(lastAsset.code.split('-').pop() ?? '0', 10) + 1
      : 1;
    return `${prefix}-${String(seq).padStart(5, '0')}`;
  }

  /**
   * Register physical assets into inventory after request arrives.
   * Only allowed when status = ARRIVED.
   * After ALL request items are registered, transitions to COMPLETED.
   */
  async registerAssets(
    id: string,
    dto: RegisterAssetsDto,
    registeredById: number,
  ) {
    const existing = await this.findOne(id);

    if (existing.status !== TransactionStatus.ARRIVED) {
      throw new UnprocessableEntityException(
        'Registrasi aset hanya dapat dilakukan saat status request adalah ARRIVED',
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.request.updateMany({
        where: { id, version: dto.version },
        data: { version: { increment: 1 } },
      });

      if (count === 0) {
        throw new ConflictException(
          'Data telah diubah oleh pengguna lain. Silakan muat ulang data.',
        );
      }

      const registeredAssetIds: string[] = [];

      for (const itemDto of dto.items) {
        const requestItem = existing.items.find(
          (i) => i.id === itemDto.requestItemId,
        );
        if (!requestItem) {
          throw new NotFoundException(
            `Request item dengan ID ${itemDto.requestItemId} tidak ditemukan`,
          );
        }

        const qty = requestItem.approvedQuantity ?? requestItem.quantity;

        let assetName = itemDto.name ?? requestItem.description;
        let assetBrand = itemDto.brand ?? 'N/A';
        let assetCategoryId = itemDto.categoryId;
        let assetTypeId: number | undefined;

        if (requestItem.modelId) {
          const model = await tx.assetModel.findUnique({
            where: { id: requestItem.modelId },
            include: { type: { include: { category: true } } },
          });
          if (model) {
            if (!itemDto.name) assetName = model.name;
            if (!itemDto.brand) assetBrand = model.brand;
            assetTypeId = model.typeId ?? undefined;
            if (!assetCategoryId && model.type?.categoryId) {
              assetCategoryId = model.type.categoryId;
            }
          }
        }

        if (!assetCategoryId) {
          throw new BadRequestException(
            `Category ID wajib diisi untuk item "${requestItem.description}" yang tidak memiliki model`,
          );
        }

        for (let i = 0; i < qty; i++) {
          const code = await this.generateAssetCode(tx);
          const sn = itemDto.serialNumbers?.[i];

          const asset = await tx.asset.create({
            data: {
              code,
              name: assetName,
              brand: assetBrand,
              categoryId: assetCategoryId,
              typeId: assetTypeId ?? null,
              modelId: requestItem.modelId ?? null,
              serialNumber: sn ?? null,
              purchasePrice: itemDto.purchasePrice ?? null,
              condition: itemDto.condition ?? AssetCondition.NEW,
              status: AssetStatus.IN_STORAGE,
              recordedById: registeredById,
            },
          });
          registeredAssetIds.push(asset.id);

          await this.stockMovementService.create(
            {
              assetId: asset.id,
              type: 'NEW_STOCK',
              reference: existing.code,
              note: `Penerimaan dari ${existing.code}: ${assetName}`,
              createdById: registeredById,
            },
            tx,
          );
        }

        await tx.assetRegistration.create({
          data: {
            requestId: id,
            quantity: qty,
            note: itemDto.note ?? null,
            registeredById,
          },
        });
      }

      const totalRegistrations = await tx.assetRegistration.count({
        where: { requestId: id },
      });

      let finalStatus: TransactionStatus = TransactionStatus.ARRIVED;
      if (totalRegistrations >= existing.items.length) {
        await tx.request.updateMany({
          where: { id },
          data: {
            status: TransactionStatus.COMPLETED,
            version: { increment: 1 },
          },
        });
        finalStatus = TransactionStatus.COMPLETED;
      }

      return { registeredAssetIds, finalStatus };
    });

    this.eventsService.emitTransactionUpdate({
      id,
      code: existing.code,
      type: 'request',
      status: result.finalStatus,
      version: existing.version + 1,
    });

    if (result.finalStatus === TransactionStatus.COMPLETED) {
      this.notificationService
        .notifyTransactionStatusChange({
          recipientUserId: existing.createdById,
          transactionType: 'Permintaan',
          transactionCode: existing.code,
          action: 'COMPLETED',
          link: `/transactions/requests/${id}`,
        })
        .catch(() => {});
    }

    return {
      registeredAssets: result.registeredAssetIds.length,
      status: result.finalStatus,
    };
  }
}
