import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../core/database/prisma.service';
import { NotificationService } from '../../core/notifications/notification.service';
import { EventsService } from '../../core/events/events.service';
import {
  TransactionStatus,
  NotificationType,
  UserRole,
} from '../../generated/prisma/client';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly eventsService: EventsService,
  ) {}

  /**
   * Task 2.3 — Overdue Checker
   * Daily at 00:05 AM: check all loans with status IN_PROGRESS
   * where expectedReturn < today → mark as overdue, notify borrower + Leader + Admin Logistik
   */
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async checkOverdueLoans() {
    this.logger.log('Running overdue loan check...');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdueLoans = await this.prisma.loanRequest.findMany({
      where: {
        status: TransactionStatus.IN_PROGRESS,
        expectedReturn: { lt: today },
        isDeleted: false,
      },
      include: {
        createdBy: {
          select: { id: true, fullName: true, divisionId: true },
        },
      },
    });

    this.logger.log(`Found ${overdueLoans.length} overdue loans`);

    for (const loan of overdueLoans) {
      // Notify borrower
      await this.notificationService.create({
        userId: loan.createdById,
        type: NotificationType.WARNING,
        title: 'Peminjaman Overdue',
        message: `Peminjaman ${loan.code} telah melewati batas waktu pengembalian. Segera kembalikan aset yang dipinjam.`,
        link: `/loans/${loan.id}`,
      });

      // Notify Leaders in the same division
      if (loan.createdBy.divisionId) {
        const leaders = await this.prisma.user.findMany({
          where: {
            role: UserRole.LEADER,
            divisionId: loan.createdBy.divisionId,
            isActive: true,
            isDeleted: false,
          },
          select: { id: true },
        });

        for (const leader of leaders) {
          await this.notificationService.create({
            userId: leader.id,
            type: NotificationType.WARNING,
            title: 'Peminjaman Overdue — Anggota Tim',
            message: `Peminjaman ${loan.code} oleh ${loan.createdBy.fullName} telah melewati batas waktu pengembalian.`,
            link: `/loans/${loan.id}`,
          });
        }
      }

      // Notify all Admin Logistik
      const adminLogistiks = await this.prisma.user.findMany({
        where: {
          role: UserRole.ADMIN_LOGISTIK,
          isActive: true,
          isDeleted: false,
        },
        select: { id: true },
      });

      for (const admin of adminLogistiks) {
        await this.notificationService.create({
          userId: admin.id,
          type: NotificationType.WARNING,
          title: 'Peminjaman Overdue',
          message: `Peminjaman ${loan.code} oleh ${loan.createdBy.fullName} telah melewati batas waktu pengembalian.`,
          link: `/loans/${loan.id}`,
        });
      }

      // Emit SSE event
      this.eventsService.emitTransactionUpdate({
        id: loan.id,
        code: loan.code,
        type: 'loan',
        status: loan.status,
        version: loan.version,
      });
    }

    this.logger.log(
      `Overdue check completed: ${overdueLoans.length} loans processed`,
    );
  }

  /**
   * Task 2.4 — Return Reminder
   * Daily at 08:00 AM: send reminders H-3 and H-1 before expectedReturnDate
   */
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async sendReturnReminders() {
    this.logger.log('Running return reminders...');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const h3 = new Date(today);
    h3.setDate(h3.getDate() + 3);

    const h1 = new Date(today);
    h1.setDate(h1.getDate() + 1);

    // H-3 reminders
    const h3Loans = await this.prisma.loanRequest.findMany({
      where: {
        status: TransactionStatus.IN_PROGRESS,
        expectedReturn: {
          gte: h3,
          lt: new Date(h3.getTime() + 24 * 60 * 60 * 1000),
        },
        isDeleted: false,
      },
      include: {
        createdBy: { select: { id: true, fullName: true } },
      },
    });

    for (const loan of h3Loans) {
      await this.notificationService.create({
        userId: loan.createdById,
        type: NotificationType.REMINDER,
        title: 'Pengingat Pengembalian (H-3)',
        message: `Peminjaman ${loan.code} akan jatuh tempo dalam 3 hari. Siapkan pengembalian aset.`,
        link: `/loans/${loan.id}`,
      });
    }

    // H-1 reminders
    const h1Loans = await this.prisma.loanRequest.findMany({
      where: {
        status: TransactionStatus.IN_PROGRESS,
        expectedReturn: {
          gte: h1,
          lt: new Date(h1.getTime() + 24 * 60 * 60 * 1000),
        },
        isDeleted: false,
      },
      include: {
        createdBy: { select: { id: true, fullName: true } },
      },
    });

    for (const loan of h1Loans) {
      await this.notificationService.create({
        userId: loan.createdById,
        type: NotificationType.REMINDER,
        title: 'Pengingat Pengembalian (H-1)',
        message: `Peminjaman ${loan.code} akan jatuh tempo besok. Segera kembalikan aset yang dipinjam.`,
        link: `/loans/${loan.id}`,
      });
    }

    this.logger.log(
      `Return reminders sent: ${h3Loans.length} H-3, ${h1Loans.length} H-1`,
    );
  }

  /**
   * Task 2.7 — Stock Threshold Alert
   * Every 6 hours: check stock levels against thresholds
   */
  @Cron(CronExpression.EVERY_6_HOURS)
  async checkStockThresholds() {
    this.logger.log('Running stock threshold check...');

    const thresholds = await this.prisma.stockThreshold.findMany({
      include: {
        model: {
          select: { id: true, name: true },
        },
      },
    });

    for (const threshold of thresholds) {
      const currentStock = await this.prisma.asset.count({
        where: {
          modelId: threshold.modelId,
          status: 'IN_STORAGE',
          isDeleted: false,
        },
      });

      if (currentStock <= threshold.minQuantity) {
        // Notify Admin Logistik
        const admins = await this.prisma.user.findMany({
          where: {
            role: { in: [UserRole.ADMIN_LOGISTIK, UserRole.SUPERADMIN] },
            isActive: true,
            isDeleted: false,
          },
          select: { id: true },
        });

        for (const admin of admins) {
          // Avoid duplicate notifications: check if already notified today
          const existingNotif = await this.prisma.notification.findFirst({
            where: {
              userId: admin.id,
              type: NotificationType.WARNING,
              title: { contains: `Stok ${threshold.model.name}` },
              createdAt: {
                gte: new Date(new Date().setHours(0, 0, 0, 0)),
              },
            },
          });

          if (!existingNotif) {
            await this.notificationService.create({
              userId: admin.id,
              type: NotificationType.WARNING,
              title: `Stok ${threshold.model.name} Rendah`,
              message: `Stok ${threshold.model.name} saat ini ${currentStock} unit, di bawah batas minimum ${threshold.minQuantity} unit.`,
              link: '/assets/stock',
            });
          }
        }
      }
    }

    this.logger.log('Stock threshold check completed');
  }
}
