import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { repairApi } from '../api/transactions.api';
import type { TransactionFilterParams } from '../types';

const REPAIRS_KEY = ['transactions', 'repairs'];

export function useRepairs(params?: TransactionFilterParams) {
  return useQuery({
    queryKey: [...REPAIRS_KEY, params],
    queryFn: () => repairApi.getAll(params).then((res) => res.data.data),
  });
}

export function useRepair(uuid: string | undefined) {
  return useQuery({
    queryKey: [...REPAIRS_KEY, uuid],
    queryFn: () => repairApi.getById(uuid!).then((res) => res.data.data),
    enabled: !!uuid,
  });
}

export function useCreateRepair() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      repairApi.create(data).then((res) => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REPAIRS_KEY });
    },
  });
}

export function useApproveRepair() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, version }: { uuid: string; version: number }) =>
      repairApi.approve(uuid, version),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REPAIRS_KEY });
    },
  });
}

export function useRejectRepair() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, version, reason }: { uuid: string; version: number; reason: string }) =>
      repairApi.reject(uuid, version, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REPAIRS_KEY });
    },
  });
}

export function useExecuteRepair() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, version }: { uuid: string; version: number }) =>
      repairApi.execute(uuid, version),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REPAIRS_KEY });
    },
  });
}

export function useCompleteRepair() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      uuid,
      version,
      data,
    }: {
      uuid: string;
      version: number;
      data: { repairAction?: string; repairVendor?: string; repairCost?: number };
    }) => repairApi.complete(uuid, version, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REPAIRS_KEY });
    },
  });
}

export function useCancelRepair() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, version }: { uuid: string; version: number }) =>
      repairApi.cancel(uuid, version),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REPAIRS_KEY });
    },
  });
}
