import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from './ApiProvider';
import {
  checkGroupEligibility, createGroupList, deleteGroupList, getGroupList, getGroupListEligibility, listGroupListAudit, listGroupListEntries,
  listGroupLists, loadAllGroupListEntries, updateGroupList, type GroupListWrite,
} from './group-lists';
import { queryKeys, SESSION_QUERY_SCOPE } from './keys';
import { PROJECTION_READ_POLICY } from '@/lib/query-policy';

export function useGroupLists(search: string, cursor: string | undefined, enabled: boolean) {
  const client = useApi();
  const params = { search: search || undefined, cursor, limit: 50 };
  return useQuery({ queryKey: queryKeys.instanceGroupLists(SESSION_QUERY_SCOPE, params), queryFn: () => listGroupLists(client, params), enabled, ...PROJECTION_READ_POLICY });
}
export function useGroupList(id: string | undefined, enabled: boolean) {
  const client = useApi();
  return useQuery({ queryKey: queryKeys.groupList(SESSION_QUERY_SCOPE, id ?? ''), queryFn: () => getGroupList(client, id!), enabled: enabled && Boolean(id), ...PROJECTION_READ_POLICY });
}
export function useGroupListEntries(id: string | undefined, cursor: string | undefined, enabled: boolean) {
  const client = useApi();
  const params = { cursor, limit: 50 };
  return useQuery({ queryKey: queryKeys.groupListEntries(SESSION_QUERY_SCOPE, id ?? '', params), queryFn: () => listGroupListEntries(client, id!, params), enabled: enabled && Boolean(id), ...PROJECTION_READ_POLICY });
}
export function useAllGroupListEntries(id: string | undefined, expectedCount: number | undefined, enabled: boolean) {
  const client = useApi();
  return useQuery({ queryKey: queryKeys.groupListEntries(SESSION_QUERY_SCOPE, id ?? '', { all: true, expectedCount }), queryFn: () => loadAllGroupListEntries(client, id!, expectedCount!), enabled: enabled && Boolean(id) && expectedCount !== undefined, staleTime: 30_000, retry: false });
}
export function useGroupListAudit(id: string | undefined, cursor: string | undefined, enabled: boolean) {
  const client = useApi();
  const params = { cursor, limit: 50 };
  return useQuery({ queryKey: queryKeys.groupListAudit(SESSION_QUERY_SCOPE, id ?? '', params), queryFn: () => listGroupListAudit(client, id!, params), enabled: enabled && Boolean(id), ...PROJECTION_READ_POLICY });
}
export function useGroupEligibility(groupJids: string[], enabled: boolean) {
  const client = useApi();
  return useQuery({ queryKey: queryKeys.groupEligibility(SESSION_QUERY_SCOPE, groupJids), queryFn: () => checkGroupEligibility(client, groupJids), enabled: enabled && groupJids.length > 0, ...PROJECTION_READ_POLICY });
}
export function useGroupListEligibility(id: string | undefined, expectedVersion: number | undefined, enabled: boolean) {
  const client = useApi();
  return useQuery({ queryKey: queryKeys.groupListEligibility(SESSION_QUERY_SCOPE, id ?? '', expectedVersion), queryFn: () => getGroupListEligibility(client, id!, expectedVersion), enabled: enabled && Boolean(id), ...PROJECTION_READ_POLICY });
}
function useInvalidateGroupList(id?: string) {
  const cache = useQueryClient();
  return async () => {
    await cache.invalidateQueries({ queryKey: queryKeys.instanceGroupLists(SESSION_QUERY_SCOPE) });
    if (!id) return;
    await Promise.all([
      cache.invalidateQueries({ queryKey: queryKeys.groupList(SESSION_QUERY_SCOPE, id) }),
      cache.invalidateQueries({ queryKey: queryKeys.groupListEntries(SESSION_QUERY_SCOPE, id) }),
      cache.invalidateQueries({ queryKey: queryKeys.groupListAudit(SESSION_QUERY_SCOPE, id) }),
      cache.invalidateQueries({ queryKey: queryKeys.groupListEligibility(SESSION_QUERY_SCOPE, id) }),
    ]);
  };
}
export function useCreateGroupList() { const client = useApi(); const invalidate = useInvalidateGroupList(); return useMutation({ mutationFn: (input: GroupListWrite) => createGroupList(client, input), onSuccess: invalidate }); }
export function useUpdateGroupList(id: string) { const client = useApi(); const invalidate = useInvalidateGroupList(id); return useMutation({ mutationFn: (input: GroupListWrite & { expectedVersion: number }) => updateGroupList(client, id, input), onSuccess: invalidate }); }
export function useDeleteGroupList(id: string) { const client = useApi(); const invalidate = useInvalidateGroupList(id); return useMutation({ mutationFn: () => deleteGroupList(client, id), onSuccess: invalidate }); }
