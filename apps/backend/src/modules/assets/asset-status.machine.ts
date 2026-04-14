import { UnprocessableEntityException } from '@nestjs/common';
import { AssetStatus } from '../../generated/prisma/client';

/**
 * Asset Status State Machine
 * Defines valid state transitions for asset lifecycle
 * Ref: ASSET_LIFECYCLE.md §2.2
 */
export class AssetStatusMachine {
  /**
   * Valid transitions from current status to target status
   */
  private static readonly VALID_TRANSITIONS: Record<
    AssetStatus,
    AssetStatus[]
  > = {
    [AssetStatus.IN_STORAGE]: [
      AssetStatus.IN_USE,
      AssetStatus.IN_CUSTODY,
      AssetStatus.UNDER_REPAIR,
      AssetStatus.DAMAGED,
      AssetStatus.CONSUMED,
      AssetStatus.DECOMMISSIONED,
    ],
    [AssetStatus.IN_USE]: [
      AssetStatus.IN_STORAGE,
      AssetStatus.IN_CUSTODY,
      AssetStatus.UNDER_REPAIR,
      AssetStatus.DAMAGED,
      AssetStatus.DECOMMISSIONED,
    ],
    [AssetStatus.IN_CUSTODY]: [
      AssetStatus.IN_USE,
      AssetStatus.IN_STORAGE,
      AssetStatus.UNDER_REPAIR,
      AssetStatus.DAMAGED,
      AssetStatus.DECOMMISSIONED,
    ],
    [AssetStatus.UNDER_REPAIR]: [
      AssetStatus.IN_STORAGE,
      AssetStatus.IN_USE,
      AssetStatus.DAMAGED,
      AssetStatus.DECOMMISSIONED,
    ],
    [AssetStatus.DAMAGED]: [
      AssetStatus.IN_STORAGE,
      AssetStatus.UNDER_REPAIR,
      AssetStatus.DECOMMISSIONED,
    ],
    [AssetStatus.CONSUMED]: [], // Terminal state
    [AssetStatus.DECOMMISSIONED]: [], // Terminal state
    [AssetStatus.OUT_FOR_REPAIR]: [
      AssetStatus.IN_STORAGE,
      AssetStatus.UNDER_REPAIR,
      AssetStatus.DAMAGED,
    ],
    [AssetStatus.LOST]: [], // Terminal state
  };

  /**
   * Validate if transition from 'from' to 'to' status is allowed
   * @throws UnprocessableEntityException if transition is invalid
   */
  static validateTransition(from: AssetStatus, to: AssetStatus): void {
    if (from === to) {
      return; // No change is valid
    }

    const allowedTransitions = this.VALID_TRANSITIONS[from];

    if (!allowedTransitions || !allowedTransitions.includes(to)) {
      throw new UnprocessableEntityException(
        `Status transisi tidak valid: ${from} → ${to}. ` +
          `Status yang diizinkan dari ${from}: ${allowedTransitions?.join(', ') || 'tidak ada (terminal state)'}`,
      );
    }
  }

  /**
   * Check if status is terminal (no outgoing transitions)
   */
  static isTerminal(status: AssetStatus): boolean {
    const transitions = this.VALID_TRANSITIONS[status];
    return !transitions || transitions.length === 0;
  }

  /**
   * Get all valid transitions from a status
   */
  static getValidTransitions(status: AssetStatus): AssetStatus[] {
    return this.VALID_TRANSITIONS[status] || [];
  }
}
