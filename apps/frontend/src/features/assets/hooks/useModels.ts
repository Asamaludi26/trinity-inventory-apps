import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { modelApi } from '../api/assets.api';

const MODELS_KEY = ['assets', 'models'];

export function useModels(typeId?: number) {
  return useQuery({
    queryKey: [...MODELS_KEY, typeId],
    queryFn: () => modelApi.getAll(typeId).then((res) => res.data.data.data),
  });
}

export function useCreateModel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { typeId: number; name: string; brand: string }) =>
      modelApi.create(data).then((res) => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MODELS_KEY });
    },
  });
}

export function useUpdateModel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name?: string; brand?: string } }) =>
      modelApi.update(id, data).then((res) => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MODELS_KEY });
    },
  });
}

export function useDeleteModel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => modelApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MODELS_KEY });
    },
  });
}
