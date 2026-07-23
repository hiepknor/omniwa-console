import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/api/ApiProvider';
import {
  addGroupMember, createGroup, demoteGroupMember, getGroup, getGroupInviteLink, leaveGroup,
  listInstanceGroups, promoteGroupMember, refreshGroupInviteLink, removeGroupMember,
  sendGroupTextMessage, updateGroup, updateGroupSetting,
  type GroupCreateRequest, type GroupMetadataRequest, type GroupSetting,
} from '@/api/groups';
import { queryKeys } from '@/api/keys';

const SCOPE = 'session';
const READ_POLICY = { staleTime: 30_000, refetchInterval: 60_000 };

export function useGroupsV2(search: string, cursor: string | undefined, enabled: boolean) {
  const client = useApi();
  const params = { search: search || undefined, cursor, limit: 50 };
  return useQuery({ queryKey: queryKeys.instanceGroups(SCOPE, params), queryFn: () => listInstanceGroups(client, undefined, params), enabled, ...READ_POLICY });
}
export function useGroupV2(groupId: string | undefined, enabled: boolean) {
  const client = useApi();
  return useQuery({ queryKey: queryKeys.group(SCOPE, groupId ?? ''), queryFn: () => getGroup(client, groupId ?? ''), enabled: enabled && Boolean(groupId), ...READ_POLICY });
}
export function useGroupInviteV2(groupId: string, enabled: boolean) {
  const client = useApi();
  return useQuery({ queryKey: [...queryKeys.group(SCOPE, groupId), 'invite-link'], queryFn: () => getGroupInviteLink(client, groupId), enabled, ...READ_POLICY });
}
function useInvalidateGroupV2(groupId?: string) {
  const queryClient = useQueryClient();
  return async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.instanceGroups(SCOPE) });
    if (groupId) await queryClient.invalidateQueries({ queryKey: queryKeys.group(SCOPE, groupId) });
  };
}
export function useCreateGroupV2() { const client = useApi(); const invalidate = useInvalidateGroupV2(); return useMutation({ mutationFn: (body: GroupCreateRequest) => createGroup(client, body), onSuccess: invalidate }); }
export function useUpdateGroupV2(groupId: string) { const client = useApi(); const invalidate = useInvalidateGroupV2(groupId); return useMutation({ mutationFn: (body: GroupMetadataRequest) => updateGroup(client, groupId, body), onSuccess: invalidate }); }
export function useUpdateGroupSettingV2(groupId: string) { const client = useApi(); const invalidate = useInvalidateGroupV2(groupId); return useMutation({ mutationFn: ({ setting, enabled }: { setting: GroupSetting; enabled: boolean }) => updateGroupSetting(client, groupId, setting, enabled), onSuccess: invalidate }); }
export function useAddGroupMemberV2(groupId: string) { const client = useApi(); const invalidate = useInvalidateGroupV2(groupId); return useMutation({ mutationFn: (jid: string) => addGroupMember(client, groupId, { jid }), onSuccess: invalidate }); }
export function usePromoteGroupMemberV2(groupId: string) { const client = useApi(); const invalidate = useInvalidateGroupV2(groupId); return useMutation({ mutationFn: (jid: string) => promoteGroupMember(client, groupId, jid), onSuccess: invalidate }); }
export function useDemoteGroupMemberV2(groupId: string) { const client = useApi(); const invalidate = useInvalidateGroupV2(groupId); return useMutation({ mutationFn: (jid: string) => demoteGroupMember(client, groupId, jid), onSuccess: invalidate }); }
export function useRemoveGroupMemberV2(groupId: string) { const client = useApi(); const invalidate = useInvalidateGroupV2(groupId); return useMutation({ mutationFn: (jid: string) => removeGroupMember(client, groupId, jid), onSuccess: invalidate }); }
export function useLeaveGroupV2(groupId: string) { const client = useApi(); const invalidate = useInvalidateGroupV2(); return useMutation({ mutationFn: () => leaveGroup(client, groupId), onSuccess: invalidate }); }
export function useResetInviteV2(groupId: string) { const client = useApi(); const queryClient = useQueryClient(); const invalidate = useInvalidateGroupV2(groupId); return useMutation({ mutationFn: () => refreshGroupInviteLink(client, groupId), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: [...queryKeys.group(SCOPE, groupId), 'invite-link'] }); await invalidate(); } }); }
export function useSendGroupTextV2(groupId: string) { const client = useApi(); return useMutation({ mutationFn: (text: string) => sendGroupTextMessage(client, groupId, { text }) }); }
