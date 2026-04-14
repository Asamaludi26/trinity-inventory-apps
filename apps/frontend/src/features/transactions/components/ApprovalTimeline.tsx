import { Check, X, Clock, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ApprovalStep } from '../types';

const ROLE_LABELS: Record<string, string> = {
  SUPERADMIN: 'Superadmin',
  ADMIN_LOGISTIK: 'Admin Logistik',
  ADMIN_PURCHASE: 'Admin Purchase',
  LEADER: 'Leader Divisi',
  STAFF: 'Staff',
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

interface ApprovalTimelineProps {
  steps: ApprovalStep[];
  className?: string;
}

export function ApprovalTimeline({ steps, className }: ApprovalTimelineProps) {
  if (!steps || steps.length === 0) return null;

  const approvalSteps = steps.filter((s) => s.type !== 'CC');
  const ccSteps = steps.filter((s) => s.type === 'CC');

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Riwayat Approval</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-0">
          {approvalSteps.map((step, idx) => {
            const isLast = idx === approvalSteps.length - 1;
            const isCurrent =
              step.status === 'PENDING' &&
              (idx === 0 || approvalSteps[idx - 1].status === 'APPROVED');

            return (
              <div key={step.step} className="relative flex gap-4 pb-6 last:pb-0">
                {/* Timeline line */}
                {!isLast && (
                  <div
                    className={cn(
                      'absolute left-4 top-8 h-[calc(100%-8px)] w-0.5',
                      step.status === 'APPROVED'
                        ? 'bg-green-300 dark:bg-green-700'
                        : step.status === 'REJECTED'
                          ? 'bg-red-300 dark:bg-red-700'
                          : 'bg-muted',
                    )}
                  />
                )}

                {/* Step icon */}
                <div
                  className={cn(
                    'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2',
                    step.status === 'APPROVED' &&
                      'border-green-500 bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400',
                    step.status === 'REJECTED' &&
                      'border-red-500 bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400',
                    step.status === 'PENDING' &&
                      isCurrent &&
                      'border-blue-500 bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400 animate-pulse',
                    step.status === 'PENDING' &&
                      !isCurrent &&
                      'border-muted bg-muted text-muted-foreground',
                    step.status === 'SKIPPED' && 'border-muted bg-muted text-muted-foreground',
                  )}
                >
                  {step.status === 'APPROVED' && <Check className="h-4 w-4" />}
                  {step.status === 'REJECTED' && <X className="h-4 w-4" />}
                  {step.status === 'PENDING' && <Clock className="h-4 w-4" />}
                  {step.status === 'SKIPPED' && <span className="text-xs">—</span>}
                </div>

                {/* Step content */}
                <div className="flex-1 pt-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {ROLE_LABELS[step.role] ?? step.role}
                    </span>
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                        step.status === 'APPROVED' &&
                          'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                        step.status === 'REJECTED' &&
                          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                        step.status === 'PENDING' &&
                          'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
                        step.status === 'SKIPPED' &&
                          'bg-gray-100 text-gray-500 dark:bg-gray-900/30 dark:text-gray-400',
                      )}
                    >
                      {step.status === 'APPROVED' && 'Disetujui'}
                      {step.status === 'REJECTED' && 'Ditolak'}
                      {step.status === 'PENDING' && (isCurrent ? 'Menunggu' : 'Belum')}
                      {step.status === 'SKIPPED' && 'Dilewati'}
                    </span>
                  </div>

                  {step.approverName && (
                    <p className="mt-0.5 text-sm text-muted-foreground">{step.approverName}</p>
                  )}

                  {step.decidedAt && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDate(step.decidedAt)}
                    </p>
                  )}

                  {step.note && (
                    <p className="mt-1 rounded-md bg-muted/50 px-3 py-1.5 text-sm">{step.note}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* CC (mengetahui) section */}
        {ccSteps.length > 0 && (
          <div className="mt-4 border-t pt-4">
            <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Mengetahui</p>
            <div className="space-y-2">
              {ccSteps.map((step) => (
                <div
                  key={step.step}
                  className="flex items-center gap-3 rounded-md border border-dashed px-3 py-2"
                >
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{ROLE_LABELS[step.role] ?? step.role}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
