import { useState } from 'react';
import { Check, X, Ban, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RejectDialog } from './RejectDialog';
import { usePermissions } from '@/hooks/use-permissions';
import { useAuthStore } from '@/store/useAuthStore';
import type { ApprovalStep } from '../types';

interface ApprovalActionButtonsProps {
  status: string;
  approvalChain?: ApprovalStep[];
  creatorId?: number;
  onApprove: (note?: string) => void;
  onReject: (reason: string) => void;
  onCancel?: () => void;
  onExecute?: () => void;
  isApprovePending?: boolean;
  isRejectPending?: boolean;
  isCancelPending?: boolean;
  isExecutePending?: boolean;
  approvePermission?: string;
  cancelPermission?: string;
  executePermission?: string;
  rejectTitle?: string;
}

export function ApprovalActionButtons({
  status,
  approvalChain,
  creatorId,
  onApprove,
  onReject,
  onCancel,
  onExecute,
  isApprovePending = false,
  isRejectPending = false,
  isCancelPending = false,
  isExecutePending = false,
  approvePermission,
  cancelPermission,
  executePermission,
  rejectTitle,
}: ApprovalActionButtonsProps) {
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const { can } = usePermissions();
  const currentUser = useAuthStore((state) => state.user);

  if (!currentUser) return null;

  const isCreator = currentUser.id === creatorId;

  // Check if current user is the next approver
  const currentPendingStep = approvalChain?.find(
    (step) => step.type === 'APPROVAL' && step.status === 'PENDING',
  );
  const canApproveChain = currentPendingStep?.approverRole === currentUser.role && !isCreator;

  const isPending = status === 'PENDING' || status === 'LOGISTIC_APPROVED';
  const isApproved = status === 'APPROVED' || status === 'AWAITING_HANDOVER';
  const isTerminal = status === 'COMPLETED' || status === 'CANCELLED' || status === 'REJECTED';

  if (isTerminal) return null;

  const canPerformApproval = canApproveChain && (!approvePermission || can(approvePermission));
  const canPerformCancel = isCreator && isPending && (!cancelPermission || can(cancelPermission));
  const canPerformExecute = isApproved && (!executePermission || can(executePermission));

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {canPerformApproval && (
          <>
            <Button
              onClick={() => onApprove()}
              disabled={isApprovePending}
              className="bg-green-600 hover:bg-green-700"
            >
              {isApprovePending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Check className="mr-2 size-4" />
              )}
              Setujui
            </Button>
            <Button
              variant="destructive"
              onClick={() => setShowRejectDialog(true)}
              disabled={isRejectPending}
            >
              {isRejectPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <X className="mr-2 size-4" />
              )}
              Tolak
            </Button>
          </>
        )}

        {canPerformExecute && onExecute && (
          <Button onClick={onExecute} disabled={isExecutePending}>
            {isExecutePending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Check className="mr-2 size-4" />
            )}
            Eksekusi
          </Button>
        )}

        {canPerformCancel && onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={isCancelPending}>
            {isCancelPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Ban className="mr-2 size-4" />
            )}
            Batalkan
          </Button>
        )}
      </div>

      <RejectDialog
        open={showRejectDialog}
        onOpenChange={setShowRejectDialog}
        onConfirm={(reason) => {
          onReject(reason);
          setShowRejectDialog(false);
        }}
        isPending={isRejectPending}
        title={rejectTitle}
      />
    </>
  );
}
