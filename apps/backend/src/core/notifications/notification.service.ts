import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { NotificationType } from '../../generated/prisma/client';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly prisma: PrismaService) {}

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

    return notification;
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
    action: 'APPROVED' | 'REJECTED' | 'EXECUTED' | 'CANCELLED' | 'COMPLETED';
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
}
