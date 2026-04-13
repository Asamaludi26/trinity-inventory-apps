import { Injectable, Logger } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import type {
  TransactionEvent,
  TransactionEventType,
  SseEvent,
} from './events.types';
import type { TransactionStatus } from '../../generated/prisma/client';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);
  private readonly events$ = new Subject<SseEvent>();

  /**
   * Emit a transaction status change event to all connected SSE clients.
   */
  emitTransactionUpdate(params: {
    id: string;
    code: string;
    type: TransactionEventType;
    status: TransactionStatus;
    version: number;
  }): void {
    const event: SseEvent = {
      event: 'transaction_updated',
      data: {
        id: params.id,
        code: params.code,
        type: params.type,
        status: params.status,
        version: params.version,
        updatedAt: new Date().toISOString(),
      },
    };

    this.events$.next(event);
    this.logger.debug(
      `SSE event emitted: ${params.type} ${params.code} → ${params.status}`,
    );
  }

  /**
   * Subscribe to SSE events stream.
   * Returns an Observable compatible with NestJS @Sse() decorator.
   */
  subscribe(): Observable<MessageEvent> {
    return this.events$.asObservable().pipe(
      map(
        (sseEvent) =>
          ({
            data: JSON.stringify(sseEvent.data),
            type: sseEvent.event,
          }) as MessageEvent,
      ),
    );
  }

  /**
   * Subscribe to SSE events filtered by transaction type.
   */
  subscribeByType(type: TransactionEventType): Observable<MessageEvent> {
    return this.events$.asObservable().pipe(
      filter((sseEvent) => (sseEvent.data as TransactionEvent).type === type),
      map(
        (sseEvent) =>
          ({
            data: JSON.stringify(sseEvent.data),
            type: sseEvent.event,
          }) as MessageEvent,
      ),
    );
  }
}
