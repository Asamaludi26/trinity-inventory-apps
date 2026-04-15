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
    mutationFn: ({
      uuid,
      version,
      data,
    }: {
      uuid: string;
      version: number;
      data: Record<string, unknown>;
    }) => projectApi.update(uuid, version, data).then((res) => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY });
    },
  });
}

export function useApproveProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, version, note }: { uuid: string; version: number; note?: string }) =>
      projectApi.approve(uuid, version, note ? { note } : undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY });
    },
  });
}

export function useRejectProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, version, reason }: { uuid: string; version: number; reason: string }) =>
      projectApi.reject(uuid, version, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY });
    },
  });
}

export function useExecuteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, version }: { uuid: string; version: number }) =>
      projectApi.execute(uuid, version),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY });
    },
  });
}

export function useCancelProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, version }: { uuid: string; version: number }) =>
      projectApi.cancel(uuid, version),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY });
    },
  });
}

export function useCompleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, version }: { uuid: string; version: number }) =>
      projectApi.complete(uuid, version),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY });
    },
  });
}

export function useHoldProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, version, reason }: { uuid: string; version: number; reason?: string }) =>
      projectApi.hold(uuid, version, reason ? { reason } : undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY });
    },
  });
}

export function useResumeProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, version }: { uuid: string; version: number }) =>
      projectApi.resume(uuid, version),
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

export function useAddProjectTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      uuid,
      data,
    }: {
      uuid: string;
      data: {
        title: string;
        description?: string;
        assigneeId?: number;
        dueDate?: string;
      };
    }) => projectApi.addTask(uuid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY });
    },
  });
}

export function useUpdateProjectTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      uuid,
      taskId,
      data,
    }: {
      uuid: string;
      taskId: number;
      data: {
        title?: string;
        description?: string;
        status?: string;
        assigneeId?: number;
        dueDate?: string;
      };
    }) => projectApi.updateTask(uuid, taskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY });
    },
  });
}

export function useRemoveProjectTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, taskId }: { uuid: string; taskId: number }) =>
      projectApi.removeTask(uuid, taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY });
    },
  });
}

export function useAddProjectMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      uuid,
      data,
    }: {
      uuid: string;
      data: { modelId?: number; description: string; quantity: number; note?: string };
    }) => projectApi.addMaterial(uuid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY });
    },
  });
}

export function useRemoveProjectMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, materialId }: { uuid: string; materialId: number }) =>
      projectApi.removeMaterial(uuid, materialId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY });
    },
  });
}

export function useAddProjectTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: { userId: number; role: string } }) =>
      projectApi.addTeamMember(uuid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY });
    },
  });
}

export function useRemoveProjectTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, memberId }: { uuid: string; memberId: number }) =>
      projectApi.removeTeamMember(uuid, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY });
    },
  });
}
