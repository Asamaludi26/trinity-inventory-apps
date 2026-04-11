import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { purchaseApi } from '../api/assets.api';
import type { PurchaseFilterParams } from '../types';

const PURCHASES_KEY = ['assets', 'purchases'];

export function usePurchases(params?: PurchaseFilterParams) {
  return useQuery({
    queryKey: [...PURCHASES_KEY, params],
    queryFn: () => purchaseApi.getAll(params).then((res) => res.data.data),
  });
}

export function usePurchase(uuid: string | undefined) {
  return useQuery({
    queryKey: [...PURCHASES_KEY, uuid],
    queryFn: () => purchaseApi.getById(uuid!).then((res) => res.data.data),
    enabled: !!uuid,
  });
}

export function useCreatePurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      purchaseApi.create(data).then((res) => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PURCHASES_KEY });
    },
  });
}

export function useUpdatePurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: Record<string, unknown> }) =>
      purchaseApi.update(uuid, data).then((res) => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PURCHASES_KEY });
    },
  });
}

export function useDeletePurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => purchaseApi.remove(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PURCHASES_KEY });
    },
  });
}
