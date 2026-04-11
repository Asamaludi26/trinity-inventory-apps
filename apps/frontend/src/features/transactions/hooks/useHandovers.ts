import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { handoverApi } from '../api/transactions.api';
import type { TransactionFilterParams } from '../types';

const HANDOVERS_KEY = ['transactions', 'handovers'];

export function useHandovers(params?: TransactionFilterParams) {
  return useQuery({
    queryKey: [...HANDOVERS_KEY, params],
    queryFn: () => handoverApi.getAll(params).then((res) => res.data.data),
  });
}

export function useHandover(uuid: string | undefined) {
  return useQuery({
    queryKey: [...HANDOVERS_KEY, uuid],
    queryFn: () => handoverApi.getById(uuid!).then((res) => res.data.data),
    enabled: !!uuid,
  });
}

export function useCreateHandover() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      handoverApi.create(data).then((res) => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HANDOVERS_KEY });
    },
  });
}

export function useApproveHandover() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, note }: { uuid: string; note?: string }) =>
      handoverApi.approve(uuid, { note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HANDOVERS_KEY });
    },
  });
}

export function useRejectHandover() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, reason }: { uuid: string; reason: string }) =>
      handoverApi.reject(uuid, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HANDOVERS_KEY });
    },
  });
}
