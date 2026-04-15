import { ConflictException } from '@nestjs/common';

/**
 * Shared OCC (Optimistic Concurrency Control) helper.
 * Validates that updateMany affected exactly 1 row (meaning the version matched).
 * If count === 0, the record was modified by another user → conflict.
 *
 * Usage:
 *   const result = await tx.model.updateMany({ where: { id, version }, data: { ... } });
 *   assertOccSuccess(result.count);
 */
export function assertOccSuccess(updatedCount: number): void {
  if (updatedCount === 0) {
    throw new ConflictException(
      'Data telah diubah oleh pengguna lain. Silakan muat ulang data.',
    );
  }
}
