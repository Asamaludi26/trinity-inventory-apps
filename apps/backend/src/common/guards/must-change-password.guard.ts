import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators';

const ALLOWED_PATHS = [
  '/auth/change-password',
  '/auth/logout',
  '/auth/refresh',
];

@Injectable()
export class MustChangePasswordGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<{
      user?: { mustChangePassword?: boolean };
      route?: { path?: string };
      url: string;
    }>();
    const user = request.user;
    if (!user) return true;

    // Allow specific endpoints even when mustChangePassword is true
    const path = request.route?.path ?? request.url;
    if (ALLOWED_PATHS.some((p) => path.includes(p))) return true;

    if (user.mustChangePassword) {
      throw new ForbiddenException(
        'Anda harus mengganti password terlebih dahulu sebelum mengakses fitur lainnya.',
      );
    }

    return true;
  }
}
