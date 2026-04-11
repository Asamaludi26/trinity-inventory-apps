import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { projectApi } from '../api/transactions.api';
import type { ProjectFilterParams } from '../types';

const PROJECTS_KEY = ['transactions', 'projects'];

export function useProjects(params?: ProjectFilterParams) {
  return useQuery({
    queryKey: [...PROJECTS_KEY, params],
    queryFn: () => projectApi.getAll(params).then((res) => res.data.data),
  });
}

export function useProject(uuid: string | undefined) {
  return useQuery({
    queryKey: [...PROJECTS_KEY, uuid],
    queryFn: () => projectApi.getById(uuid!).then((res) => res.data.data),
    enabled: !!uuid,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      projectApi.create(data).then((res) => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: Record<string, unknown> }) =>
      projectApi.update(uuid, data).then((res) => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => projectApi.remove(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY });
    },
  });
}
