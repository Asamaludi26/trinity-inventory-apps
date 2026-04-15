import { useQuery } from '@tanstack/react-query';
import { assetApi } from '../api';

export function useStockMovements(assetId: string | undefined) {
  return useQuery({
    queryKey: ['stock-movements', assetId],
    queryFn: async () => {
      const { data } = await assetApi.getStockMovements(assetId!);
      return data.data;
    },
    enabled: !!assetId,
  });
}
