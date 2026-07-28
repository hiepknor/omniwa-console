import { useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/api/ApiProvider';
import {
  addGroupMember, createGroup, demoteGroupMember, getGroup, getGroupInviteLink, getGroupSummary,
  joinGroup, leaveGroup, listGroupAudit, listGroupMembers, listInstanceGroups, promoteGroupMember,
  refreshGroupInviteLink, removeGroupMember, setGroupPhoto, updateGroupDescription, updateGroupName,
  updateGroupSetting, type GroupCreateRequest, type GroupDirectoryFilters, type GroupMemberRole, type GroupSetting,
} from '@/api/groups';
import { getMediaAsset, getMediaAssetContent, uploadMediaAsset } from '@/api/media-assets';
import { queryKeys, SESSION_QUERY_SCOPE } from '@/api/keys';
import { MEDIA_ASSET_READ_POLICY, PROJECTION_READ_POLICY, QUERY_INTERVALS } from '@/lib/query-policy';
import { createCommandKeyStore, type CommandKeyStore } from './command-key';

function useCommandKey() {
  const current = useRef<CommandKeyStore>();
  current.current ??= createCommandKeyStore();
  return current.current;
}

export function useGroups(filters: GroupDirectoryFilters, enabled: boolean, normalized: boolean) {
  const client = useApi();
  const params = { ...filters, limit: 50, normalized };
  return useQuery({ queryKey: queryKeys.instanceGroups(SESSION_QUERY_SCOPE, params), queryFn: () => listInstanceGroups(client, params, normalized), enabled, ...PROJECTION_READ_POLICY });
}

export function useGroup(groupId: string | undefined, enabled: boolean, normalized: boolean) {
  const client = useApi();
  return useQuery({ queryKey: queryKeys.group(SESSION_QUERY_SCOPE, groupId ?? '', { normalized }), queryFn: () => getGroup(client, groupId ?? '', normalized), enabled: enabled && Boolean(groupId), ...PROJECTION_READ_POLICY });
}

export function useGroupSummary(enabled: boolean) {
  const client = useApi();
  return useQuery({ queryKey: queryKeys.groupSummary(SESSION_QUERY_SCOPE), queryFn: () => getGroupSummary(client), enabled, ...PROJECTION_READ_POLICY });
}

export function useGroupMembers(groupId: string, search: string, role: GroupMemberRole | undefined, cursor: string | undefined, enabled: boolean) {
  const client = useApi();
  const params = { search: search || undefined, role, cursor, limit: 50 };
  return useQuery({ queryKey: queryKeys.groupMembers(SESSION_QUERY_SCOPE, groupId, params), queryFn: () => listGroupMembers(client, groupId, params), enabled, ...PROJECTION_READ_POLICY });
}

export function useGroupAudit(groupId: string, cursor: string | undefined, enabled: boolean) {
  const client = useApi();
  return useQuery({ queryKey: queryKeys.groupAudit(SESSION_QUERY_SCOPE, groupId, { cursor, limit: 50 }), queryFn: () => listGroupAudit(client, groupId, cursor), enabled, ...PROJECTION_READ_POLICY });
}

export function useGroupInvite(groupId: string, enabled: boolean) {
  const client = useApi();
  return useQuery({ queryKey: queryKeys.groupInvite(SESSION_QUERY_SCOPE, groupId), queryFn: () => getGroupInviteLink(client, groupId), enabled, ...PROJECTION_READ_POLICY });
}

function useInvalidateGroup(groupId?: string) {
  const queryClient = useQueryClient();
  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.instanceGroups(SESSION_QUERY_SCOPE) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.groupSummary(SESSION_QUERY_SCOPE) }),
      ...(groupId ? [
        queryClient.invalidateQueries({ queryKey: queryKeys.group(SESSION_QUERY_SCOPE, groupId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.groupMembers(SESSION_QUERY_SCOPE, groupId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.groupAudit(SESSION_QUERY_SCOPE, groupId) }),
      ] : []),
    ]);
  };
}

export function useCreateGroup(normalized: boolean) {
  const client = useApi(); const invalidate = useInvalidateGroup(); const key = useCommandKey();
  return useMutation({ mutationFn: (body: GroupCreateRequest) => createGroup(client, body, normalized, normalized ? key.for(JSON.stringify(body)) : undefined), onSuccess: async () => { key.clear(); await invalidate(); } });
}
export function useJoinGroup() {
  const client = useApi(); const invalidate = useInvalidateGroup(); const key = useCommandKey();
  return useMutation({ mutationFn: (code: string) => joinGroup(client, code, key.for(code)), onSuccess: async () => { key.clear(); await invalidate(); } });
}
export function useUpdateGroupName(groupId: string, normalized: boolean) {
  const client = useApi(); const invalidate = useInvalidateGroup(groupId); const key = useCommandKey();
  return useMutation({ mutationFn: (name: string) => updateGroupName(client, groupId, name, normalized, normalized ? key.for(name) : undefined), onSuccess: async () => { key.clear(); await invalidate(); } });
}
export function useUpdateGroupDescription(groupId: string, normalized: boolean) {
  const client = useApi(); const invalidate = useInvalidateGroup(groupId); const key = useCommandKey();
  return useMutation({ mutationFn: (description: string) => updateGroupDescription(client, groupId, description, normalized, normalized ? key.for(description) : undefined), onSuccess: async () => { key.clear(); await invalidate(); } });
}
export function useUpdateGroupSetting(groupId: string, normalized: boolean) {
  const client = useApi(); const invalidate = useInvalidateGroup(groupId); const key = useCommandKey();
  return useMutation({ mutationFn: ({ setting, enabled }: { setting: GroupSetting; enabled: boolean }) => updateGroupSetting(client, groupId, setting, enabled, normalized, normalized ? key.for(`${setting}:${enabled}`) : undefined), onSuccess: async () => { key.clear(); await invalidate(); } });
}
export function useAddGroupMember(groupId: string, normalized: boolean) {
  const client = useApi(); const invalidate = useInvalidateGroup(groupId); const key = useCommandKey();
  return useMutation({ mutationFn: (jid: string) => addGroupMember(client, groupId, jid, normalized, normalized ? key.for(jid) : undefined), onSuccess: async () => { key.clear(); await invalidate(); } });
}
export function usePromoteGroupMember(groupId: string, normalized: boolean) {
  const client = useApi(); const invalidate = useInvalidateGroup(groupId); const key = useCommandKey();
  return useMutation({ mutationFn: (id: string) => promoteGroupMember(client, groupId, id, normalized, normalized ? key.for(id) : undefined), onSuccess: async () => { key.clear(); await invalidate(); } });
}
export function useDemoteGroupMember(groupId: string, normalized: boolean) {
  const client = useApi(); const invalidate = useInvalidateGroup(groupId); const key = useCommandKey();
  return useMutation({ mutationFn: (id: string) => demoteGroupMember(client, groupId, id, normalized, normalized ? key.for(id) : undefined), onSuccess: async () => { key.clear(); await invalidate(); } });
}
export function useRemoveGroupMember(groupId: string, normalized: boolean) {
  const client = useApi(); const invalidate = useInvalidateGroup(groupId); const key = useCommandKey();
  return useMutation({ mutationFn: (id: string) => removeGroupMember(client, groupId, id, normalized, normalized ? key.for(id) : undefined), onSuccess: async () => { key.clear(); await invalidate(); } });
}
export function useLeaveGroup(groupId: string, normalized: boolean) {
  const client = useApi(); const invalidate = useInvalidateGroup(); const key = useCommandKey();
  return useMutation({ mutationFn: () => leaveGroup(client, groupId, normalized, normalized ? key.for(groupId) : undefined), onSuccess: async () => { key.clear(); await invalidate(); } });
}
export function useResetInvite(groupId: string, normalized: boolean) {
  const client = useApi(); const queryClient = useQueryClient(); const invalidate = useInvalidateGroup(groupId); const key = useCommandKey();
  return useMutation({ mutationFn: () => refreshGroupInviteLink(client, groupId, normalized, normalized ? key.for(groupId) : undefined), onSuccess: async () => { key.clear(); await queryClient.invalidateQueries({ queryKey: queryKeys.groupInvite(SESSION_QUERY_SCOPE, groupId) }); await invalidate(); } });
}
export function useSetGroupPhoto(groupId: string) {
  const client = useApi(); const invalidate = useInvalidateGroup(groupId); const key = useCommandKey();
  return useMutation({ mutationFn: (mediaAssetId: string) => setGroupPhoto(client, groupId, mediaAssetId, key.for(mediaAssetId)), onSuccess: async () => { key.clear(); await invalidate(); } });
}

export function useUploadMediaAsset() {
  const client = useApi(); const key = useCommandKey();
  return useMutation({ mutationFn: (file: File) => uploadMediaAsset(client, file, key.for(`${file.name}:${file.size}:${file.type}:${file.lastModified}`)), onSuccess: () => key.clear() });
}
export function useMediaAsset(mediaId: string | undefined, enabled: boolean) {
  const client = useApi();
  return useQuery({ queryKey: queryKeys.mediaAsset(SESSION_QUERY_SCOPE, mediaId ?? ''), queryFn: () => getMediaAsset(client, mediaId!), enabled: enabled && Boolean(mediaId), staleTime: MEDIA_ASSET_READ_POLICY.staleTime, refetchInterval: (query) => query.state.data && !['ready', 'failed', 'deleted'].includes(query.state.data.status) ? QUERY_INTERVALS.mediaAsset : false });
}
export function useMediaAssetContent(mediaId: string | undefined, enabled: boolean) {
  const client = useApi();
  return useQuery({ queryKey: queryKeys.mediaAssetContent(SESSION_QUERY_SCOPE, mediaId ?? ''), queryFn: () => getMediaAssetContent(client, mediaId!), enabled: enabled && Boolean(mediaId), staleTime: MEDIA_ASSET_READ_POLICY.terminalStaleTime });
}
