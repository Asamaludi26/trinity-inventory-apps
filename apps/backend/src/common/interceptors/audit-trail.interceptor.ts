import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../../core/database/prisma.service';
import { SKIP_AUDIT_KEY } from '../decorators/skip-audit.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class AuditTrailInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditTrailInterceptor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const method: string = request.method;

    // Only log CUD operations
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    // Skip if decorated with @SkipAudit() or @Public()
    const skipAudit = this.reflector.getAllAndOverride<boolean>(
      SKIP_AUDIT_KEY,
      [context.getHandler(), context.getClass()],
    );
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skipAudit || isPublic) {
      return next.handle();
    }

    const user = request.user;
    if (!user?.id) {
      return next.handle();
    }

    const { entityType, entityId } = this.parseRoute(
      request.url,
      request.params,
    );
    const action = this.resolveAction(request.url, method);

    return next.handle().pipe(
      tap({
        next: (responseData) => {
          this.logActivity({
            userId: user.id,
            action,
            entityType,
            entityId: entityId || this.extractIdFromResponse(responseData),
            dataAfter:
              method !== 'DELETE' ? this.sanitizeBody(request.body) : undefined,
            ipAddress: request.ip,
            userAgent: request.headers?.['user-agent']?.substring(0, 500),
          }).catch((err: Error) => {
            this.logger.error(`Failed to log activity: ${err.message}`);
          });
        },
      }),
    );
  }

  private parseRoute(
    url: string,
    params: Record<string, string>,
  ): { entityType: string; entityId: string } {
    const path = url.split('?')[0].replace(/^\/api\/v1\//, '');
    const segments = path.split('/').filter(Boolean);

    const entityType = (segments[0] ?? 'UNKNOWN').toUpperCase();
    const entityId = params?.id ?? params?.uuid ?? segments[1] ?? '';

    return { entityType, entityId };
  }

  private resolveAction(url: string, method: string): string {
    if (url.includes('/approve')) return 'APPROVE';
    if (url.includes('/reject')) return 'REJECT';
    if (url.includes('/cancel')) return 'CANCEL';
    if (url.includes('/execute')) return 'EXECUTE';
    if (url.includes('/verify')) return 'VERIFY';
    if (url.includes('/complete')) return 'COMPLETE';
    if (url.includes('/assign')) return 'ASSIGN';
    if (url.includes('/read-all')) return 'READ_ALL';
    if (url.includes('/read')) return 'READ';

    const actionMap: Record<string, string> = {
      POST: 'CREATE',
      PUT: 'UPDATE',
      PATCH: 'UPDATE',
      DELETE: 'DELETE',
    };
    return actionMap[method] ?? 'UNKNOWN';
  }

  private extractIdFromResponse(data: unknown): string {
    if (data && typeof data === 'object') {
      const obj = data as Record<string, unknown>;
      // Handle wrapped response { success, data: { id, uuid } }
      if (obj.data && typeof obj.data === 'object') {
        const inner = obj.data as Record<string, unknown>;
        return String(inner.uuid ?? inner.id ?? '');
      }
      return String(obj.uuid ?? obj.id ?? '');
    }
    return '';
  }

  private sanitizeBody(body: unknown): object | undefined {
    if (!body || typeof body !== 'object') return undefined;
    const sanitized = { ...(body as Record<string, unknown>) };
    // Strip sensitive fields
    delete sanitized.password;
    delete sanitized.currentPassword;
    delete sanitized.newPassword;
    delete sanitized.refreshToken;
    delete sanitized.accessToken;
    return sanitized;
  }

  private async logActivity(params: {
    userId: number;
    action: string;
    entityType: string;
    entityId: string;
    dataBefore?: object;
    dataAfter?: object;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.prisma.activityLog.create({
      data: {
        userId: params.userId,
        action: params.action.substring(0, 50),
        entityType: params.entityType.substring(0, 50),
        entityId: params.entityId.substring(0, 50),
        dataBefore: params.dataBefore ?? undefined,
        dataAfter: params.dataAfter ?? undefined,
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
      },
    });
  }
}
