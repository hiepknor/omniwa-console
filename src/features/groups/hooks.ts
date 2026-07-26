import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/api/ApiProvider';
import {
  addGroupMember, createGroup, demoteGroupMember, getGroup, getGroupInviteLink, leaveGroup,
  listInstanceGroups, promoteGroupMember, refreshGroupInviteLink, removeGroupMember,
  sendGroupTextMessage, updateGroup, updateGroupSetting,
  type GroupCreateRequest, type GroupMetadataRequest, type GroupSetting,
} from '@/api/groups';
import { queryKeys, SESSION_QUERY_SCOPE } from '@/api/keys';
import { PROJECTION_READ_POLICY } from '@/lib/query-policy';

export function useGroups(search: string, cursor: string | undefined, enabled: boolean) {
  const client = useApi();
  const params = { search: search || undefined, cursor, limit: 50 };
  return useQuery({ queryKey: queryKeys.instanceGroups(SESSION_QUERY_SCOPE, params), queryFn: () => listInstanceGroups(client, undefined, params), enabled, ...PROJECTION_READ_POLICY });
}
export function useGroup(groupId: string | undefined, enabled: boolean) {
  const client = useApi();
  return useQuery({ queryKey: queryKeys.group(SESSION_QUERY_SCOPE, groupId ?? ''), queryFn: () => getGroup(client, groupId ?? ''), enabled: enabled && Boolean(groupId), ...PROJECTION_READ_POLICY });
}
export function useGroupInvite(groupId: string, enabled: boolean) {
  const client = useApi();
  return useQuery({ queryKey: queryKeys.groupInvite(SESSION_QUERY_SCOPE, groupId), queryFn: () => getGroupInviteLink(client, groupId), enabled, ...PROJECTION_READ_POLICY });
}
function useInvalidateGroup(groupId?: string) {
  const queryClient = useQueryClient();
  return async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.instanceGroups(SESSION_QUERY_SCOPE) });
    if (groupId) await queryClient.invalidateQueries({ queryKey: queryKeys.group(SESSION_QUERY_SCOPE, groupId) });
  };
}
export function useCreateGroup() { const client = useApi(); const invalidate = useInvalidateGroup(); return useMutation({ mutationFn: (body: GroupCreateRequest) => createGroup(client, body), onSuccess: invalidate }); }
export function useUpdateGroup(groupId: string) { const client = useApi(); const invalidate = useInvalidateGroup(groupId); return useMutation({ mutationFn: (body: GroupMetadataRequest) => updateGroup(client, groupId, body), onSuccess: invalidate }); }
export function useUpdateGroupSetting(groupId: string) { const client = useApi(); const invalidate = useInvalidateGroup(groupId); return useMutation({ mutationFn: ({ setting, enabled }: { setting: GroupSetting; enabled: boolean }) => updateGroupSetting(client, groupId, setting, enabled), onSuccess: invalidate }); }
export function useAddGroupMember(groupId: string) { const client = useApi(); const invalidate = useInvalidateGroup(groupId); return useMutation({ mutationFn: (jid: string) => addGroupMember(client, groupId, { jid }), onSuccess: invalidate }); }
export function usePromoteGroupMember(groupId: string) { const client = useApi(); const invalidate = useInvalidateGroup(groupId); return useMutation({ mutationFn: (jid: string) => promoteGroupMember(client, groupId, jid), onSuccess: invalidate }); }
export function useDemoteGroupMember(groupId: string) { const client = useApi(); const invalidate = useInvalidateGroup(groupId); return useMutation({ mutationFn: (jid: string) => demoteGroupMember(client, groupId, jid), onSuccess: invalidate }); }
export function useRemoveGroupMember(groupId: string) { const client = useApi(); const invalidate = useInvalidateGroup(groupId); return useMutation({ mutationFn: (jid: string) => removeGroupMember(client, groupId, jid), onSuccess: invalidate }); }
export function useLeaveGroup(groupId: string) { const client = useApi(); const invalidate = useInvalidateGroup(); return useMutation({ mutationFn: () => leaveGroup(client, groupId), onSuccess: invalidate }); }
export function useResetInvite(groupId: string) { const client = useApi(); const queryClient = useQueryClient(); const invalidate = useInvalidateGroup(groupId); return useMutation({ mutationFn: () => refreshGroupInviteLink(client, groupId), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: queryKeys.groupInvite(SESSION_QUERY_SCOPE, groupId) }); await invalidate(); } }); }
export function useSendGroupText(groupId: string) { const client = useApi(); return useMutation({ mutationFn: (text: string) => sendGroupTextMessage(client, groupId, { text }) }); }
