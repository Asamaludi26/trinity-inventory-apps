import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { loanApi } from '../api/transactions.api';
import type { LoanFilterParams } from '../types';

const LOANS_KEY = ['transactions', 'loans'];

export function useLoans(params?: LoanFilterParams) {
  return useQuery({
    queryKey: [...LOANS_KEY, params],
    queryFn: () => loanApi.getAll(params).then((res) => res.data.data),
  });
}

export function useLoan(uuid: string | undefined) {
  return useQuery({
    queryKey: [...LOANS_KEY, uuid],
    queryFn: () => loanApi.getById(uuid!).then((res) => res.data.data),
    enabled: !!uuid,
  });
}

export function useCreateLoan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      loanApi.create(data).then((res) => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LOANS_KEY });
    },
  });
}

export function useCancelLoan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => loanApi.cancel(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LOANS_KEY });
    },
  });
}

export function useApproveLoan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, note }: { uuid: string; note?: string }) =>
      loanApi.approve(uuid, { note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LOANS_KEY });
    },
  });
}

export function useRejectLoan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, reason }: { uuid: string; reason: string }) =>
      loanApi.reject(uuid, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LOANS_KEY });
    },
  });
}
