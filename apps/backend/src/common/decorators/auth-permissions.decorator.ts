import { applyDecorators, UseGuards } from '@nestjs/common';
import { Permission } from '../constants';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { RequirePermissions } from './require-permissions.decorator';

/**
 * Composite decorator: JWT Auth + Permission Check
 *
 * Usage: @AuthPermissions(PERMISSIONS.ASSETS_CREATE)
 * Combines: JwtAuthGuard + PermissionsGuard + RequirePermissions
 */
export const AuthPermissions = (...permissions: Permission[]) =>
  applyDecorators(
    UseGuards(JwtAuthGuard, PermissionsGuard),
    RequirePermissions(...permissions),
  );
