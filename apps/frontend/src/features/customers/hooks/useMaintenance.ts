import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { maintenanceApi } from '../api';
import type { MaintenanceFilterParams } from '../types';

const QUERY_KEY = ['maintenance'] as const;

export function useMaintenance(params?: MaintenanceFilterParams) {
  return useQuery({
    queryKey: [...QUERY_KEY, params],
    queryFn: () => maintenanceApi.getAll(params).then((r) => r.data.data),
  });
}

export function useMaintenanceDetail(id: number) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => maintenanceApi.getById(id).then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useCreateMaintenance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      maintenanceApi.create(data).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Maintenance berhasil dibuat');
    },
    onError: () => toast.error('Gagal membuat maintenance'),
  });
}

export function useUpdateMaintenanceStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      maintenanceApi.updateStatus(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Status maintenance diperbarui');
    },
    onError: () => toast.error('Gagal memperbarui status maintenance'),
  });
}

export function useCompleteMaintenance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, resolution }: { id: number; resolution?: string }) =>
      maintenanceApi.complete(id, resolution ? { resolution } : undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Maintenance berhasil diselesaikan');
    },
    onError: () => toast.error('Gagal menyelesaikan maintenance'),
  });
}
