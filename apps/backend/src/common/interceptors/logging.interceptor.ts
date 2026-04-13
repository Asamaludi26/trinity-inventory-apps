import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

/**
 * Global logging interceptor — logs method, URL, user, and response time.
 *
 * @see ERROR_HANDLING.md §2.4
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url } = request;
    const user = (request as unknown as Record<string, unknown>).user as
      | { sub?: number; email?: string }
      | undefined;
    const userId = user?.sub ?? 'anonymous';
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        this.logger.log(`${method} ${url} — user:${userId} — ${duration}ms`);
      }),
    );
  }
}
