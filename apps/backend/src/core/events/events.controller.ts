import {
  Controller,
  Sse,
  Query,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Observable, merge, interval } from 'rxjs';
import { map } from 'rxjs/operators';
import { EventsService } from './events.service';
import { Public } from '../../common/decorators';
import { SkipAudit } from '../../common/decorators';

const HEARTBEAT_INTERVAL_MS = 30_000;

@ApiTags('Events')
@Controller('events')
export class EventsController {
  private readonly logger = new Logger(EventsController.name);

  constructor(
    private readonly eventsService: EventsService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * SSE endpoint for real-time transaction updates.
   * Uses query param `token` for auth since EventSource API
   * does not support custom headers.
   * Sends heartbeat every 30s to keep connection alive.
   */
  @Sse('stream')
  @Public()
  @SkipAudit()
  @ApiOperation({ summary: 'SSE stream untuk update transaksi real-time' })
  stream(@Query('token') token: string): Observable<MessageEvent> {
    if (!token) {
      throw new UnauthorizedException('Token diperlukan');
    }

    try {
      this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('Token tidak valid');
    }

    this.logger.log('SSE client connected');

    const heartbeat$ = interval(HEARTBEAT_INTERVAL_MS).pipe(
      map(
        () =>
          ({
            data: '',
            type: 'heartbeat',
          }) as MessageEvent,
      ),
    );

    return merge(this.eventsService.subscribe(), heartbeat$);
  }
}
