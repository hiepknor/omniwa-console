import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi, useApiSession } from '@/api/ApiProvider';
import { createApiClient, type ApiClient } from '@/api/client';
import type { CommandResult } from '@/api/envelopes';
import {
  addGroupMember,
  createGroup,
  demoteGroupMember,
  getGroup,
  getGroupInviteLink,
  leaveGroup,
  listInstanceGroups,
  promoteGroupMember,
  refreshGroupInviteLink,
  removeGroupMember,
  sendGroupTextMessage,
  updateGroup,
  updateGroupLocalState,
  updateGroupSetting,
  type GroupCreateRequest,
  type GroupLocalStateRequest,
  type GroupMetadataRequest,
  type GroupSetting,
} from '@/api/groups';
import { listInstances } from '@/api/instances';
import { queryKeys } from '@/api/keys';
import { useRealtimeRefetchInterval } from '@/api/RealtimeProvider';
import { useFeedback } from '@/components/feedback/FeedbackProvider';

/** Build a client authenticated with a specific instance's token (groups are token-scoped). */
function useGroupClient(token: string | undefined): ApiClient | undefined {
  const session = useApiSession();
  return useMemo(
    () => (token ? createApiClient({ baseUrl: session.baseUrl, apiKey: token }) : undefined),
    [session.baseUrl, token],
  );
}

export function usePickerInstances() {
  const client = useApi();
  const refetchInterval = useRealtimeRefetchInterval();
  return useQuery({
    queryKey: [...queryKeys.instances({}), 'picker'] as const,
    queryFn: () => listInstances(client),
    refetchInterval,
  });
}

// Group reads are PostgreSQL projection reads. Keep polling bounded; capability
// negotiation and explicit mutation invalidation remain the primary refresh
// mechanisms.
const GROUP_PROJECTION_READ = { refetchInterval: 60_000, staleTime: 30_000 };

export function useInstanceGroups(
  instanceId: string | undefined,
  token: string | undefined,
  params: { search?: string; cursor?: string; limit?: number },
) {
  const tokenClient = useGroupClient(token);
  return useQuery({
    queryKey: queryKeys.instanceGroups(instanceId ?? '', params),
    queryFn: () => listInstanceGroups(tokenClient as ApiClient, instanceId ?? '', params),
    enabled: instanceId !== undefined && tokenClient !== undefined,
    ...GROUP_PROJECTION_READ,
  });
}

export function useGroup(instanceId: string | undefined, groupId: string | undefined, token: string | undefined) {
  const tokenClient = useGroupClient(token);
  return useQuery({
    queryKey: queryKeys.group(instanceId ?? '', groupId ?? ''),
    queryFn: () => getGroup(tokenClient as ApiClient, groupId ?? ''),
    enabled: instanceId !== undefined && groupId !== undefined && tokenClient !== undefined,
    ...GROUP_PROJECTION_READ,
  });
}

function useGroupFeedback(groupId: string) {
  const feedback = useFeedback();
  return (
    result: CommandResult,
    action: string,
    key: string,
    acceptedDetail = 'omniwa-go accepted the command. Group data refreshes automatically.',
    completedDetail = 'omniwa-go completed the command. Group data refreshes automatically.',
  ) => {
    feedback.command(result.disposition, {
      action,
      acceptedDetail,
      completedDetail,
      requestId: result.requestId,
      dedupeKey: `group:${groupId}:${key}`,
    });
  };
}

export function useRefreshGroupInviteLink(instanceId: string | undefined, groupId: string, token: string | undefined) {
  const tokenClient = useGroupClient(token);
  const queryClient = useQueryClient();
  const accepted = useGroupFeedback(groupId);
  return useMutation({
    mutationFn: () => refreshGroupInviteLink(tokenClient as ApiClient, groupId),
    onSuccess: async (result) => {
      accepted(result, 'Invite link refresh', 'refresh-invite-link', 'omniwa-go reset the invite link.', 'omniwa-go reset the invite link.');
      if (instanceId) await queryClient.invalidateQueries({ queryKey: queryKeys.group(instanceId, groupId) });
    },
  });
}

export function useUpdateGroupLocalState(groupId: string, instanceId: string | undefined, token: string | undefined) {
  const tokenClient = useGroupClient(token);
  const queryClient = useQueryClient();
  const accepted = useGroupFeedback(groupId);
  return useMutation({
    mutationFn: (body: GroupLocalStateRequest) => updateGroupLocalState(tokenClient as ApiClient, groupId, body),
    onSuccess: async (result, body) => {
      accepted(result, 'Local state update', `local-state:${Object.keys(body)[0] ?? 'state'}`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.group(instanceId ?? '', groupId) }),
        ...(instanceId ? [queryClient.invalidateQueries({ queryKey: queryKeys.instanceGroups(instanceId) })] : []),
      ]);
    },
  });
}

export function useUpdateGroup(groupId: string, instanceId: string | undefined, token: string | undefined) {
  const tokenClient = useGroupClient(token);
  const queryClient = useQueryClient();
  const accepted = useGroupFeedback(groupId);
  return useMutation({
    mutationFn: (body: GroupMetadataRequest) => updateGroup(tokenClient as ApiClient, groupId, body),
    onSuccess: async (result) => {
      accepted(result, 'Metadata update', 'update-metadata');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.group(instanceId ?? '', groupId) }),
        ...(instanceId ? [queryClient.invalidateQueries({ queryKey: queryKeys.instanceGroups(instanceId) })] : []),
      ]);
    },
  });
}

function useInvalidateGroupDetail(instanceId: string | undefined, groupId: string) {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.group(instanceId ?? '', groupId) });
}

export function useAddGroupMember(instanceId: string | undefined, groupId: string, token: string | undefined) {
  const tokenClient = useGroupClient(token);
  const invalidate = useInvalidateGroupDetail(instanceId, groupId);
  const accepted = useGroupFeedback(groupId);
  return useMutation({
    mutationFn: (jid: string) => addGroupMember(tokenClient as ApiClient, groupId, { jid }),
    onSuccess: async (result, jid) => { accepted(result, 'Add member', `add-member:${jid}`); await invalidate(); },
  });
}

export function usePromoteGroupMember(instanceId: string | undefined, groupId: string, token: string | undefined) {
  const tokenClient = useGroupClient(token);
  const invalidate = useInvalidateGroupDetail(instanceId, groupId);
  const accepted = useGroupFeedback(groupId);
  return useMutation({
    mutationFn: (memberJid: string) => promoteGroupMember(tokenClient as ApiClient, groupId, memberJid),
    onSuccess: async (result, memberJid) => { accepted(result, 'Promote member', `promote:${memberJid}`); await invalidate(); },
  });
}

export function useDemoteGroupMember(instanceId: string | undefined, groupId: string, token: string | undefined) {
  const tokenClient = useGroupClient(token);
  const invalidate = useInvalidateGroupDetail(instanceId, groupId);
  const accepted = useGroupFeedback(groupId);
  return useMutation({
    mutationFn: (memberJid: string) => demoteGroupMember(tokenClient as ApiClient, groupId, memberJid),
    onSuccess: async (result, memberJid) => { accepted(result, 'Demote member', `demote:${memberJid}`); await invalidate(); },
  });
}

export function useRemoveGroupMember(instanceId: string | undefined, groupId: string, token: string | undefined) {
  const tokenClient = useGroupClient(token);
  const invalidate = useInvalidateGroupDetail(instanceId, groupId);
  const accepted = useGroupFeedback(groupId);
  return useMutation({
    mutationFn: (memberJid: string) => removeGroupMember(tokenClient as ApiClient, groupId, memberJid),
    onSuccess: async (result, memberJid) => { accepted(result, 'Remove member', `remove:${memberJid}`); await invalidate(); },
  });
}

export function useSendGroupText(groupId: string, token: string | undefined) {
  const tokenClient = useGroupClient(token);
  const accepted = useGroupFeedback(groupId);
  return useMutation({
    mutationFn: (text: string) => sendGroupTextMessage(tokenClient as ApiClient, groupId, { text }),
    onSuccess: (result) => accepted(result, 'Send text', 'send-text', 'The send command was accepted.', 'The send command completed.'),
  });
}

/** Refetch the persisted group directory without issuing a live WhatsApp query. */
export function useRefreshGroups(instanceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => queryClient.invalidateQueries({ queryKey: queryKeys.instanceGroups(instanceId) }),
  });
}

export function useGroupInviteLink(instanceId: string | undefined, groupId: string | undefined, token: string | undefined) {
  const tokenClient = useGroupClient(token);
  return useQuery({
    queryKey: [...queryKeys.group(instanceId ?? '', groupId ?? ''), 'invite-link'],
    queryFn: () => getGroupInviteLink(tokenClient as ApiClient, groupId ?? ''),
    enabled: instanceId !== undefined && groupId !== undefined && tokenClient !== undefined,
    ...GROUP_PROJECTION_READ,
  });
}

export function useCreateGroup(instanceId: string, token: string | undefined) {
  const tokenClient = useGroupClient(token);
  const queryClient = useQueryClient();
  const feedback = useFeedback();
  return useMutation({
    mutationFn: (body: GroupCreateRequest) => createGroup(tokenClient as ApiClient, body),
    onSuccess: async (result) => {
      feedback.command(result.disposition, {
        action: 'Create group',
        acceptedDetail: 'omniwa-go accepted the group creation.',
        completedDetail: 'omniwa-go created the group.',
        requestId: result.requestId,
        dedupeKey: `instance:${instanceId}:create-group`,
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.instanceGroups(instanceId) });
    },
  });
}

export function useLeaveGroup(groupId: string, instanceId: string | undefined, token: string | undefined) {
  const tokenClient = useGroupClient(token);
  const queryClient = useQueryClient();
  const accepted = useGroupFeedback(groupId);
  return useMutation({
    mutationFn: () => leaveGroup(tokenClient as ApiClient, groupId),
    onSuccess: async (result) => {
      accepted(result, 'Leave group', 'leave');
      if (instanceId) await queryClient.invalidateQueries({ queryKey: queryKeys.instanceGroups(instanceId) });
    },
  });
}

export function useUpdateGroupSetting(groupId: string, instanceId: string | undefined, token: string | undefined) {
  const tokenClient = useGroupClient(token);
  const queryClient = useQueryClient();
  const accepted = useGroupFeedback(groupId);
  return useMutation({
    mutationFn: ({ setting, enabled }: { setting: GroupSetting; enabled: boolean }) =>
      updateGroupSetting(tokenClient as ApiClient, groupId, setting, enabled),
    onSuccess: async (result, { setting }) => {
      accepted(result, 'Group setting', `setting:${setting}`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.group(instanceId ?? '', groupId) }),
        ...(instanceId ? [queryClient.invalidateQueries({ queryKey: queryKeys.instanceGroups(instanceId) })] : []),
      ]);
    },
  });
}
