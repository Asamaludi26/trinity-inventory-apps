import { useMutation, useQueryClient } from '@tanstack/react-query';
import { assetApi } from '../api/assets.api';
import type { BatchAssetRegistration } from '../types';
import { toast } from 'sonner';

const ASSETS_KEY = ['assets'];
const BATCH_KEY = ['assets', 'batch'];

/**
 * Hook for batch asset registration
 * Registers multiple assets with the same model in a single transaction
 */
export function useBatchAssetRegistration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const response = await assetApi.createBatch(data);
      return response.data.data as BatchAssetRegistration;
    },
    onSuccess: (data) => {
      // Invalidate asset queries to refresh list
      queryClient.invalidateQueries({ queryKey: ASSETS_KEY });
      queryClient.invalidateQueries({ queryKey: BATCH_KEY });

      toast.success(`${data.quantity} aset berhasil didaftarkan (${data.documentNumber})`);
    },
    onError: (error: unknown) => {
      const axiosError = error as { response?: { data?: { message?: string } } };
      const message = axiosError.response?.data?.message || 'Gagal mendaftarkan batch aset';
      toast.error(message);
    },
  });
}
