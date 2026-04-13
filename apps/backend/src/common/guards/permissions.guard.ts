import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../generated/prisma/client';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import { Permission, hasPermission } from '../constants';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No permissions required — allow
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException(
        'Anda tidak memiliki izin untuk mengakses resource ini',
      );
    }

    const userRole = user.role as UserRole;
    const userPermissions: string[] = Array.isArray(user.permissions)
      ? user.permissions
      : [];

    // Check ALL required permissions (AND logic)
    const granted = requiredPermissions.every((perm) =>
      hasPermission(userRole, userPermissions, perm),
    );

    if (!granted) {
      throw new ForbiddenException(
        'Anda tidak memiliki izin untuk mengakses resource ini',
      );
    }

    return true;
  }
}
