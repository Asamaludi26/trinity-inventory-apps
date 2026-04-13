import { useQuery } from '@tanstack/react-query';
import { auditApi, type AuditFilterParams } from '../api';

const QUERY_KEY = ['audit-logs'] as const;

export function useAuditLogs(params?: AuditFilterParams) {
  return useQuery({
    queryKey: [...QUERY_KEY, params],
    queryFn: () => auditApi.getAll(params).then((r) => r.data.data),
  });
}
