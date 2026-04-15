import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { UpdateProfileDto, UpdateNotificationPrefsDto } from './dto';
import { Prisma } from '../../../generated/prisma/client';

type NotificationPreferences = {
  inAppEnabled: boolean;
  emailEnabled: boolean;
  whatsappEnabled: boolean;
  channels: {
    stock: boolean;
    requests: boolean;
    loans: boolean;
    returns: boolean;
    handovers: boolean;
    repairs: boolean;
    projects: boolean;
  };
};

const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  inAppEnabled: true,
  emailEnabled: false,
  whatsappEnabled: false,
  channels: {
    stock: true,
    requests: true,
    loans: true,
    returns: true,
    handovers: true,
    repairs: true,
    projects: true,
  },
};

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureUserExists(userId: number) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, isDeleted: false },
      select: { id: true, email: true },
    });
    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }
    return user;
  }

  private normalizeNotificationPrefs(
    rawPrefs: Prisma.JsonValue | null,
  ): NotificationPreferences {
    if (!rawPrefs || typeof rawPrefs !== 'object' || Array.isArray(rawPrefs)) {
      return DEFAULT_NOTIFICATION_PREFS;
    }

    const prefsObj = rawPrefs as Record<string, unknown>;
    const channelsObj =
      prefsObj.channels &&
      typeof prefsObj.channels === 'object' &&
      !Array.isArray(prefsObj.channels)
        ? (prefsObj.channels as Record<string, unknown>)
        : {};

    const readBool = (value: unknown, fallback: boolean) =>
      typeof value === 'boolean' ? value : fallback;

    return {
      inAppEnabled: readBool(
        prefsObj.inAppEnabled,
        DEFAULT_NOTIFICATION_PREFS.inAppEnabled,
      ),
      emailEnabled: readBool(
        prefsObj.emailEnabled,
        DEFAULT_NOTIFICATION_PREFS.emailEnabled,
      ),
      whatsappEnabled: readBool(
        prefsObj.whatsappEnabled,
        DEFAULT_NOTIFICATION_PREFS.whatsappEnabled,
      ),
      channels: {
        stock: readBool(
          channelsObj.stock,
          DEFAULT_NOTIFICATION_PREFS.channels.stock,
        ),
        requests: readBool(
          channelsObj.requests,
          DEFAULT_NOTIFICATION_PREFS.channels.requests,
        ),
        loans: readBool(
          channelsObj.loans,
          DEFAULT_NOTIFICATION_PREFS.channels.loans,
        ),
        returns: readBool(
          channelsObj.returns,
          DEFAULT_NOTIFICATION_PREFS.channels.returns,
        ),
        handovers: readBool(
          channelsObj.handovers,
          DEFAULT_NOTIFICATION_PREFS.channels.handovers,
        ),
        repairs: readBool(
          channelsObj.repairs,
          DEFAULT_NOTIFICATION_PREFS.channels.repairs,
        ),
        projects: readBool(
          channelsObj.projects,
          DEFAULT_NOTIFICATION_PREFS.channels.projects,
        ),
      },
    };
  }

  async getProfile(userId: number) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, isDeleted: false },
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
        division: { select: { id: true, name: true } },
      },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    return user;
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const user = await this.ensureUserExists(userId);

    if (dto.email && dto.email !== user.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existing) {
        throw new ConflictException('Email sudah digunakan');
      }
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
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
        division: { select: { id: true, name: true } },
      },
    });
  }

  async uploadAvatar(userId: number, filename: string) {
    await this.ensureUserExists(userId);
    const avatarUrl = `/uploads/avatar/${filename}`;
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      select: { id: true, uuid: true, avatarUrl: true },
    });
    return user;
  }

  async getNotificationPrefs(userId: number) {
    await this.ensureUserExists(userId);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { notificationPrefs: true },
    });

    return this.normalizeNotificationPrefs(user?.notificationPrefs ?? null);
  }

  async updateNotificationPrefs(
    userId: number,
    dto: UpdateNotificationPrefsDto,
  ) {
    const current = await this.getNotificationPrefs(userId);

    const merged: NotificationPreferences = {
      ...current,
      ...dto,
      channels: {
        ...current.channels,
        ...(dto.channels ?? {}),
      },
    };

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        notificationPrefs: merged as unknown as Prisma.InputJsonValue,
      },
    });

    return merged;
  }
}
