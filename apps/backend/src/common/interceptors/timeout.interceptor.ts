import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  RequestTimeoutException,
} from '@nestjs/common';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

const DEFAULT_TIMEOUT = 30_000; // 30 seconds

/**
 * Global timeout interceptor — returns 408 if request exceeds threshold.
 *
 * @see ERROR_HANDLING.md §2.3
 */
@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next.handle().pipe(
      timeout(DEFAULT_TIMEOUT),
      catchError((err) => {
        if (err instanceof TimeoutError) {
          return throwError(
            () =>
              new RequestTimeoutException(
                'Request timeout — server took too long to respond',
              ),
          );
        }
        return throwError(() => err);
      }),
    );
  }
}
