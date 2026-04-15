import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApi, type UserFilterParams } from '../api';
import type { CreateUserFormData, UpdateUserFormData } from '../../../validation/settings.schema';

const USERS_KEY = ['settings', 'users'];

export function useUsers(params?: UserFilterParams) {
  return useQuery({
    queryKey: [...USERS_KEY, params],
    queryFn: () => usersApi.getAll(params).then((res) => res.data.data),
  });
}

export function useUser(uuid: string | undefined) {
  return useQuery({
    queryKey: [...USERS_KEY, uuid],
    queryFn: () => usersApi.getByUuid(uuid!).then((res) => res.data.data),
    enabled: !!uuid,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUserFormData) => usersApi.create(data).then((res) => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_KEY });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, data }: { uuid: string; data: UpdateUserFormData }) =>
      usersApi.update(uuid, data).then((res) => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_KEY });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => usersApi.delete(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_KEY });
    },
  });
}

export function useUserStats(uuid: string | undefined) {
  return useQuery({
    queryKey: [...USERS_KEY, uuid, 'stats'],
    queryFn: () => usersApi.getStats(uuid!).then((res) => res.data.data),
    enabled: !!uuid,
  });
}
