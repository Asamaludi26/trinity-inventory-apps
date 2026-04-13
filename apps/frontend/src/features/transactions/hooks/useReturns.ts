import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { returnApi } from '../api/transactions.api';
import type { TransactionFilterParams } from '../types';

const RETURNS_KEY = ['transactions', 'returns'];

export function useReturns(params?: TransactionFilterParams) {
  return useQuery({
    queryKey: [...RETURNS_KEY, params],
    queryFn: () => returnApi.getAll(params).then((res) => res.data.data),
  });
}

export function useReturn(uuid: string | undefined) {
  return useQuery({
    queryKey: [...RETURNS_KEY, uuid],
    queryFn: () => returnApi.getById(uuid!).then((res) => res.data.data),
    enabled: !!uuid,
  });
}

export function useCreateReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      returnApi.create(data).then((res) => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RETURNS_KEY });
    },
  });
}

export function useApproveReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, version }: { uuid: string; version: number }) =>
      returnApi.approve(uuid, version),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RETURNS_KEY });
    },
  });
}

export function useRejectReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, version, reason }: { uuid: string; version: number; reason: string }) =>
      returnApi.reject(uuid, version, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RETURNS_KEY });
    },
  });
}

export function useExecuteReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, version }: { uuid: string; version: number }) =>
      returnApi.execute(uuid, version),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RETURNS_KEY });
    },
  });
}

export function useCancelReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, version }: { uuid: string; version: number }) =>
      returnApi.cancel(uuid, version),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RETURNS_KEY });
    },
  });
}
