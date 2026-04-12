import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { CurrentUser } from '../../common/decorators';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async findAll(
    @CurrentUser('id') userId: number,
    @Query() query: NotificationQueryDto,
  ) {
    return this.notificationService.getUserNotifications(
      userId,
      query.page,
      query.limit,
    );
  }

  @Get('unread-count')
  async getUnreadCount(@CurrentUser('id') userId: number) {
    const count = await this.notificationService.getUnreadCount(userId);
    return { count };
  }

  @Patch(':id/read')
  async markAsRead(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    await this.notificationService.markAsRead(id, userId);
    return { message: 'Notifikasi ditandai telah dibaca' };
  }

  @Patch('read-all')
  async markAllAsRead(@CurrentUser('id') userId: number) {
    await this.notificationService.markAllAsRead(userId);
    return { message: 'Semua notifikasi ditandai telah dibaca' };
  }
}
