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

export function useUpdateRepairStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: Record<string, unknown> }) =>
      repairApi.updateStatus(uuid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REPAIRS_KEY });
    },
  });
}
