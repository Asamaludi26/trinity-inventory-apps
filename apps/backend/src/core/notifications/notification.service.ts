import { Injectable, Logger } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { PrismaService } from '../database/prisma.service';
import { NotificationType, UserRole } from '../../generated/prisma/client';
import { WhatsAppService } from './whatsapp.service';

interface NotificationEvent {
  userId: number;
  data: Record<string, unknown>;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly notificationStream$ = new Subject<NotificationEvent>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsapp: WhatsAppService,
  ) {}

  async create(params: {
    userId: number;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
  }) {
    const notification = await this.prisma.notification.create({
      data: params,
    });

    this.logger.log(
      `Notification sent to user ${params.userId}: ${params.title}`,
    );

    // Emit to SSE stream so connected clients receive it in real-time
    this.notificationStream$.next({
      userId: params.userId,
      data: {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        link: notification.link,
        isRead: notification.isRead,
        createdAt: notification.createdAt,
      },
    });

    // Optionally send WhatsApp message if service is configured
    if (this.whatsapp.isEnabled) {
      const user = await this.prisma.user.findUnique({
        where: { id: params.userId },
        select: { phone: true },
      });
      if (user?.phone) {
        const waMessage = `*${params.title}*\n${params.message}`;
        void this.whatsapp.sendMessage(user.phone, waMessage);
      }
    }

    return notification;
  }

  getNotificationStream(userId: number): Observable<MessageEvent> {
    return this.notificationStream$.pipe(
      filter((event) => event.userId === userId),
      map((event) => ({ data: event.data }) as MessageEvent),
    );
  }

  async markAsRead(notificationId: number, userId: number) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: number) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async getUserNotifications(userId: number, page = 1, limit = 20) {
    const where = { userId };

    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getUnreadCount(userId: number) {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  async notifyTransactionStatusChange(params: {
    recipientUserId: number;
    transactionType: string;
    transactionCode: string;
    action:
      | 'APPROVED'
      | 'REJECTED'
      | 'EXECUTED'
      | 'CANCELLED'
      | 'COMPLETED'
      | 'ASSETS_ASSIGNED'
      | 'PURCHASING'
      | 'IN_DELIVERY'
      | 'ARRIVED'
      | 'ON_HOLD'
      | 'RESUMED';
    link: string;
    reason?: string;
  }) {
    const {
      recipientUserId,
      transactionType,
      transactionCode,
      action,
      link,
      reason,
    } = params;

    const actionLabels: Record<
      string,
      { title: string; message: string; type: NotificationType }
    > = {
      APPROVED: {
        title: `${transactionType} Disetujui`,
        message: `${transactionType} ${transactionCode} telah disetujui.`,
        type: NotificationType.STATUS_CHANGE,
      },
      REJECTED: {
        title: `${transactionType} Ditolak`,
        message: `${transactionType} ${transactionCode} ditolak${reason ? `: ${reason}` : '.'}`,
        type: NotificationType.STATUS_CHANGE,
      },
      EXECUTED: {
        title: `${transactionType} Dieksekusi`,
        message: `${transactionType} ${transactionCode} sedang diproses.`,
        type: NotificationType.STATUS_CHANGE,
      },
      CANCELLED: {
        title: `${transactionType} Dibatalkan`,
        message: `${transactionType} ${transactionCode} telah dibatalkan.`,
        type: NotificationType.STATUS_CHANGE,
      },
      COMPLETED: {
        title: `${transactionType} Selesai`,
        message: `${transactionType} ${transactionCode} telah selesai.`,
        type: NotificationType.STATUS_CHANGE,
      },
      ASSETS_ASSIGNED: {
        title: `Aset Ditentukan`,
        message: `Aset untuk ${transactionType} ${transactionCode} telah ditentukan.`,
        type: NotificationType.STATUS_CHANGE,
      },
      PURCHASING: {
        title: `${transactionType} Dalam Proses Pembelian`,
        message: `${transactionType} ${transactionCode} sedang dalam proses pembelian.`,
        type: NotificationType.STATUS_CHANGE,
      },
      IN_DELIVERY: {
        title: `${transactionType} Dalam Pengiriman`,
        message: `${transactionType} ${transactionCode} sedang dalam pengiriman.`,
        type: NotificationType.STATUS_CHANGE,
      },
      ARRIVED: {
        title: `${transactionType} Telah Tiba`,
        message: `${transactionType} ${transactionCode} telah tiba dan siap diproses.`,
        type: NotificationType.STATUS_CHANGE,
      },
      ON_HOLD: {
        title: `${transactionType} Ditunda`,
        message: `${transactionType} ${transactionCode} sedang ditunda sementara.`,
        type: NotificationType.STATUS_CHANGE,
      },
      RESUMED: {
        title: `${transactionType} Dilanjutkan`,
        message: `${transactionType} ${transactionCode} telah dilanjutkan kembali.`,
        type: NotificationType.STATUS_CHANGE,
      },
    };

    const config = actionLabels[action];
    if (!config) return;

    return this.create({
      userId: recipientUserId,
      type: config.type,
      title: config.title,
      message: config.message,
      link,
    });
  }

  async notifyApprovalRequired(params: {
    recipientUserId: number;
    transactionType: string;
    transactionCode: string;
    requesterName: string;
    link: string;
  }) {
    return this.create({
      userId: params.recipientUserId,
      type: NotificationType.APPROVAL_REQUIRED,
      title: `Persetujuan Diperlukan`,
      message: `${params.transactionType} ${params.transactionCode} dari ${params.requesterName} menunggu persetujuan Anda.`,
      link: params.link,
    });
  }

  // ──────────────── Role & Division Routing ────────────────

  /**
   * Send notification to all active users with a specific role.
   * Useful for system-wide alerts (e.g., stock threshold breached → ADMIN_LOGISTIC).
   */
  async notifyByRole(params: {
    role: UserRole;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
  }): Promise<void> {
    const users = await this.prisma.user.findMany({
      where: { role: params.role, isActive: true, isDeleted: false },
      select: { id: true },
    });

    for (const user of users) {
      this.create({
        userId: user.id,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link,
      }).catch((err) =>
        this.logger.warn(`Failed to notify user ${user.id}: ${err.message}`),
      );
    }
  }

  /**
   * Send notification to all active users in a specific division.
   * Useful for division-scoped alerts (e.g., division asset updates).
   */
  async notifyByDivision(params: {
    divisionId: number;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
  }): Promise<void> {
    const users = await this.prisma.user.findMany({
      where: {
        divisionId: params.divisionId,
        isActive: true,
        isDeleted: false,
      },
      select: { id: true },
    });

    for (const user of users) {
      this.create({
        userId: user.id,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link,
      }).catch((err) =>
        this.logger.warn(`Failed to notify user ${user.id}: ${err.message}`),
      );
    }
  }

  /**
   * Send notification to users with a specific role in a specific division.
   * Useful for targeted alerts (e.g., division leader for approval).
   */
  async notifyRoleInDivision(params: {
    role: UserRole;
    divisionId: number;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
  }): Promise<void> {
    const users = await this.prisma.user.findMany({
      where: {
        role: params.role,
        divisionId: params.divisionId,
        isActive: true,
        isDeleted: false,
      },
      select: { id: true },
    });

    for (const user of users) {
      this.create({
        userId: user.id,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link,
      }).catch((err) =>
        this.logger.warn(`Failed to notify user ${user.id}: ${err.message}`),
      );
    }
  }

  /**
   * Send stock threshold alert to logistics admins.
   * Called from scheduler when stock falls below threshold.
   */
  async notifyStockAlert(params: {
    modelName: string;
    currentStock: number;
    threshold: number;
  }): Promise<void> {
    const status =
      params.currentStock === 0
        ? 'HABIS'
        : params.currentStock <= params.threshold / 2
          ? 'KRITIS'
          : 'RENDAH';

    await this.notifyByRole({
      role: UserRole.ADMIN_LOGISTIK,
      type: NotificationType.WARNING,
      title: `Stok ${status}: ${params.modelName}`,
      message:
        `Stok ${params.modelName} saat ini ${params.currentStock} unit ` +
        `(threshold: ${params.threshold}). Segera lakukan pengadaan.`,
      link: '/assets/stock',
    });
  }

  /**
   * Send overdue loan reminder to the borrower + their division leader.
   */
  async notifyLoanOverdue(params: {
    borrowerUserId: number;
    borrowerDivisionId: number | null;
    loanCode: string;
    assetName: string;
    daysOverdue: number;
  }): Promise<void> {
    // Notify the borrower directly
    await this.create({
      userId: params.borrowerUserId,
      type: NotificationType.REMINDER,
      title: 'Pinjaman Jatuh Tempo',
      message:
        `Pinjaman ${params.loanCode} (${params.assetName}) sudah terlambat ` +
        `${params.daysOverdue} hari. Segera kembalikan.`,
      link: `/transactions/loans/${params.loanCode}`,
    }).catch(() => {});

    // Also notify division leader if available
    if (params.borrowerDivisionId) {
      await this.notifyRoleInDivision({
        role: UserRole.LEADER,
        divisionId: params.borrowerDivisionId,
        type: NotificationType.WARNING,
        title: 'Pinjaman Anggota Jatuh Tempo',
        message:
          `Pinjaman ${params.loanCode} (${params.assetName}) oleh anggota divisi ` +
          `sudah terlambat ${params.daysOverdue} hari.`,
        link: `/transactions/loans/${params.loanCode}`,
      });
    }
  }
}
