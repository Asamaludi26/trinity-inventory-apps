import type { TransactionStatus } from '../../generated/prisma/client';

export type TransactionEventType =
  | 'request'
  | 'loan'
  | 'return'
  | 'handover'
  | 'repair'
  | 'project';

export interface TransactionEvent {
  id: string;
  code: string;
  type: TransactionEventType;
  status: TransactionStatus;
  updatedAt: string;
  version: number;
}

export interface SseEvent {
  event: string;
  data: TransactionEvent;
}
