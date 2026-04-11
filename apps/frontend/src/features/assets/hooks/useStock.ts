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
