import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { installationApi } from '../api';
import type { InstallationFilterParams } from '../types';

const QUERY_KEY = ['installations'] as const;

export function useInstallations(params?: InstallationFilterParams) {
  return useQuery({
    queryKey: [...QUERY_KEY, params],
    queryFn: () => installationApi.getAll(params).then((r) => r.data.data),
  });
}

export function useInstallation(id: number) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => installationApi.getById(id).then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useCreateInstallation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      installationApi.create(data).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Instalasi berhasil dibuat');
    },
    onError: () => toast.error('Gagal membuat instalasi'),
  });
}

export function useUpdateInstallationStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      installationApi.updateStatus(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Status instalasi diperbarui');
    },
    onError: () => toast.error('Gagal memperbarui status instalasi'),
  });
}
