import { useCallback } from 'react';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * Hook untuk mengecek permission user.
 * Menggunakan permissions dari auth store (diset saat login).
 *
 * Usage:
 * ```tsx
 * const { can, canAny, canAll } = usePermissions();
 * if (can('LOAN_REQUESTS_APPROVE')) { ... }
 * ```
 */
export function usePermissions() {
  const user = useAuthStore((state) => state.user);
  const permissions = user?.permissions;
  const isSuperAdmin = user?.role === 'SUPERADMIN';

  const can = useCallback(
    (permission: string): boolean => {
      if (isSuperAdmin) return true;
      return permissions?.[permission] === true;
    },
    [permissions, isSuperAdmin],
  );

  const canAny = useCallback(
    (...perms: string[]): boolean => {
      if (isSuperAdmin) return true;
      return perms.some((p) => permissions?.[p] === true);
    },
    [permissions, isSuperAdmin],
  );

  const canAll = useCallback(
    (...perms: string[]): boolean => {
      if (isSuperAdmin) return true;
      return perms.every((p) => permissions?.[p] === true);
    },
    [permissions, isSuperAdmin],
  );

  return { can, canAny, canAll };
}
