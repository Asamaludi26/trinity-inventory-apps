import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { dismantleApi } from '../api';
import type { DismantleFilterParams } from '../types';

const QUERY_KEY = ['dismantles'] as const;

export function useDismantles(params?: DismantleFilterParams) {
  return useQuery({
    queryKey: [...QUERY_KEY, params],
    queryFn: () => dismantleApi.getAll(params).then((r) => r.data.data),
  });
}

export function useDismantle(id: number) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => dismantleApi.getById(id).then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useCreateDismantle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      dismantleApi.create(data).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Dismantle berhasil dibuat');
    },
    onError: () => toast.error('Gagal membuat dismantle'),
  });
}

export function useUpdateDismantleStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      dismantleApi.updateStatus(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Status dismantle diperbarui');
    },
    onError: () => toast.error('Gagal memperbarui status dismantle'),
  });
}

export function useCompleteDismantle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      itemConditions,
    }: {
      id: number;
      itemConditions?: Array<{ assetId: string; conditionAfter: string }>;
    }) => dismantleApi.complete(id, itemConditions ? { itemConditions } : undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Dismantle berhasil diselesaikan');
    },
    onError: () => toast.error('Gagal menyelesaikan dismantle'),
  });
}
