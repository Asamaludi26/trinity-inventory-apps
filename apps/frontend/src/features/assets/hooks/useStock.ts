import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { stockApi } from '../api/assets.api';
import type { StockFilterParams } from '../types';

const STOCK_KEY = ['assets', 'stock'];

export function useStock(params?: StockFilterParams) {
  return useQuery({
    queryKey: [...STOCK_KEY, params],
    queryFn: () => stockApi.getSummary(params).then((res) => res.data.data),
  });
}

export function useStockDetailTotal(modelId: number | null) {
  return useQuery({
    queryKey: [...STOCK_KEY, 'detail-total', modelId],
    queryFn: () => stockApi.getDetailTotal(modelId!).then((res) => res.data.data),
    enabled: !!modelId,
  });
}

export function useStockDetailUsage(modelId: number | null, page = 1) {
  return useQuery({
    queryKey: [...STOCK_KEY, 'detail-usage', modelId, page],
    queryFn: () =>
      stockApi.getDetailUsage(modelId!, { page, limit: 20 }).then((res) => res.data.data),
    enabled: !!modelId,
  });
}

export function useStockHistory(modelId: number | null, page = 1) {
  return useQuery({
    queryKey: [...STOCK_KEY, 'history', modelId, page],
    queryFn: () => stockApi.getHistory(modelId!, { page, limit: 20 }).then((res) => res.data.data),
    enabled: !!modelId,
  });
}

export function useUpdateStockThreshold() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ modelId, minQuantity }: { modelId: number; minQuantity: number }) =>
      stockApi.updateThreshold(modelId, minQuantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STOCK_KEY });
    },
  });
}

export function useUpdateThresholdBulk() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items: { modelId: number; minQuantity: number; warningQuantity?: number }[]) =>
      stockApi.updateThresholdBulk(items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STOCK_KEY });
    },
  });
}

export function useRestock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      modelId,
      data,
    }: {
      modelId: number;
      data: { quantity: number; source: string; note?: string };
    }) => stockApi.restock(modelId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STOCK_KEY });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
}
