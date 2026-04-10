import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { AssetStatus, TransactionStatus } from '@/types';

type StatusType = AssetStatus | TransactionStatus | (string & {});

const STATUS_STYLES: Record<string, string> = {
  // Asset statuses
  IN_STORAGE:
    'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  IN_USE:
    'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  IN_CUSTODY:
    'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800',
  UNDER_REPAIR:
    'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  OUT_FOR_REPAIR:
    'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
  DAMAGED:
    'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  LOST: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800',
  DECOMMISSIONED:
    'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-400 dark:border-slate-800',
  CONSUMED:
    'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-800',

  // Transaction statuses
  PENDING:
    'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800',
  LOGISTIC_APPROVED:
    'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-800',
  AWAITING_CEO_APPROVAL:
    'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
  APPROVED:
    'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
  REJECTED:
    'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  CANCELLED:
    'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800',
  PURCHASING:
    'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800',
  IN_DELIVERY:
    'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800',
  ARRIVED:
    'bg-lime-100 text-lime-700 border-lime-200 dark:bg-lime-900/30 dark:text-lime-400 dark:border-lime-800',
  AWAITING_HANDOVER:
    'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  IN_PROGRESS:
    'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  COMPLETED:
    'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
};

const STATUS_LABELS: Record<string, string> = {
  IN_STORAGE: 'Di Gudang',
  IN_USE: 'Digunakan',
  IN_CUSTODY: 'Dipinjam',
  UNDER_REPAIR: 'Perbaikan',
  OUT_FOR_REPAIR: 'Servis Luar',
  DAMAGED: 'Rusak',
  LOST: 'Hilang',
  DECOMMISSIONED: 'Didekomisikan',
  CONSUMED: 'Habis Pakai',
  PENDING: 'Menunggu',
  LOGISTIC_APPROVED: 'Disetujui Logistik',
  AWAITING_CEO_APPROVAL: 'Menunggu CEO',
  APPROVED: 'Disetujui',
  REJECTED: 'Ditolak',
  CANCELLED: 'Dibatalkan',
  PURCHASING: 'Pembelian',
  IN_DELIVERY: 'Dalam Pengiriman',
  ARRIVED: 'Tiba',
  AWAITING_HANDOVER: 'Menunggu Serah Terima',
  IN_PROGRESS: 'Berlangsung',
  COMPLETED: 'Selesai',
};

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const style = STATUS_STYLES[status] ?? 'bg-muted text-muted-foreground border-border';
  const displayLabel = label ?? STATUS_LABELS[status] ?? status;

  return (
    <Badge variant="outline" className={cn(style, className)}>
      {displayLabel}
    </Badge>
  );
}
