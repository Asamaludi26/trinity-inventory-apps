import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  ParseIntPipe,
  Sse,
  MessageEvent,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Observable, merge, interval } from 'rxjs';
import { map } from 'rxjs/operators';
import { NotificationService } from './notification.service';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { CurrentUser, Public, SkipAudit } from '../../common/decorators';

const HEARTBEAT_INTERVAL_MS = 30_000;

interface JwtPayload {
  sub: number;
}

@Controller('notifications')
export class NotificationController {
  private readonly logger = new Logger(NotificationController.name);

  constructor(
    private readonly notificationService: NotificationService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * SSE endpoint — uses query param `token` because EventSource API
   * does not support custom headers. Sends heartbeat every 30s.
   */
  @Sse('stream')
  @Public()
  @SkipAudit()
  streamNotifications(@Query('token') token: string): Observable<MessageEvent> {
    if (!token) {
      throw new UnauthorizedException('Token diperlukan');
    }

    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Token tidak valid');
    }

    this.logger.log(
      `SSE notification client connected for userId=${payload.sub}`,
    );

    const heartbeat$ = interval(HEARTBEAT_INTERVAL_MS).pipe(
      map(() => ({ data: '' }) as MessageEvent),
    );

    const notifications$ = this.notificationService.getNotificationStream(
      payload.sub,
    );

    return merge(notifications$, heartbeat$);
  }

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
