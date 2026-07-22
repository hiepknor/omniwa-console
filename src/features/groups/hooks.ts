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
  listGroupMembers,
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

// /group/list and /group/info are live WhatsApp queries that WhatsApp rate-limits.
// They must NOT poll — fetch on demand, cache long, refetch only on Refresh or
// after a mutation invalidates.
const WHATSAPP_LIVE = { refetchInterval: false as const, staleTime: 5 * 60_000 };

export function useInstanceGroups(instanceId: string | undefined, token: string | undefined) {
  const tokenClient = useGroupClient(token);
  return useQuery({
    queryKey: queryKeys.instanceGroups(instanceId ?? '', {}),
    queryFn: () => listInstanceGroups(tokenClient as ApiClient, instanceId ?? ''),
    enabled: instanceId !== undefined && tokenClient !== undefined,
    ...WHATSAPP_LIVE,
  });
}

export function useGroup(groupId: string | undefined, token: string | undefined) {
  const tokenClient = useGroupClient(token);
  return useQuery({
    queryKey: queryKeys.group(groupId ?? ''),
    queryFn: () => getGroup(tokenClient as ApiClient, groupId ?? ''),
    enabled: groupId !== undefined && tokenClient !== undefined,
    ...WHATSAPP_LIVE,
  });
}

export function useGroupMembers(groupId: string | undefined, token: string | undefined) {
  const tokenClient = useGroupClient(token);
  return useQuery({
    queryKey: queryKeys.groupMembers(groupId ?? ''),
    queryFn: () => listGroupMembers(tokenClient as ApiClient, groupId ?? ''),
    enabled: groupId !== undefined && tokenClient !== undefined,
    ...WHATSAPP_LIVE,
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

export function useRefreshGroupInviteLink(groupId: string, token: string | undefined) {
  const tokenClient = useGroupClient(token);
  const accepted = useGroupFeedback(groupId);
  return useMutation({
    mutationFn: () => refreshGroupInviteLink(tokenClient as ApiClient, groupId),
    onSuccess: (result) => accepted(result, 'Invite link refresh', 'refresh-invite-link', 'omniwa-go reset the invite link.', 'omniwa-go reset the invite link.'),
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
        queryClient.invalidateQueries({ queryKey: queryKeys.group(groupId) }),
        ...(instanceId ? [queryClient.invalidateQueries({ queryKey: queryKeys.instanceGroups(instanceId, {}) })] : []),
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
        queryClient.invalidateQueries({ queryKey: queryKeys.group(groupId) }),
        ...(instanceId ? [queryClient.invalidateQueries({ queryKey: queryKeys.instanceGroups(instanceId, {}) })] : []),
      ]);
    },
  });
}

function useInvalidateGroupMembers(groupId: string) {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.groupMembers(groupId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.group(groupId) }),
    ]);
}

export function useAddGroupMember(groupId: string, token: string | undefined) {
  const tokenClient = useGroupClient(token);
  const invalidate = useInvalidateGroupMembers(groupId);
  const accepted = useGroupFeedback(groupId);
  return useMutation({
    mutationFn: (jid: string) => addGroupMember(tokenClient as ApiClient, groupId, { jid }),
    onSuccess: async (result, jid) => { accepted(result, 'Add member', `add-member:${jid}`); await invalidate(); },
  });
}

export function usePromoteGroupMember(groupId: string, token: string | undefined) {
  const tokenClient = useGroupClient(token);
  const invalidate = useInvalidateGroupMembers(groupId);
  const accepted = useGroupFeedback(groupId);
  return useMutation({
    mutationFn: (memberJid: string) => promoteGroupMember(tokenClient as ApiClient, groupId, memberJid),
    onSuccess: async (result, memberJid) => { accepted(result, 'Promote member', `promote:${memberJid}`); await invalidate(); },
  });
}

export function useDemoteGroupMember(groupId: string, token: string | undefined) {
  const tokenClient = useGroupClient(token);
  const invalidate = useInvalidateGroupMembers(groupId);
  const accepted = useGroupFeedback(groupId);
  return useMutation({
    mutationFn: (memberJid: string) => demoteGroupMember(tokenClient as ApiClient, groupId, memberJid),
    onSuccess: async (result, memberJid) => { accepted(result, 'Demote member', `demote:${memberJid}`); await invalidate(); },
  });
}

export function useRemoveGroupMember(groupId: string, token: string | undefined) {
  const tokenClient = useGroupClient(token);
  const invalidate = useInvalidateGroupMembers(groupId);
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

/** Refetch the group directory from omniwa-go's live connection. */
export function useRefreshGroups(instanceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => queryClient.invalidateQueries({ queryKey: queryKeys.instanceGroups(instanceId, {}) }),
  });
}

export function useGroupInviteLink(groupId: string | undefined, token: string | undefined) {
  const tokenClient = useGroupClient(token);
  return useQuery({
    queryKey: [...queryKeys.group(groupId ?? ''), 'invite-link'],
    queryFn: () => getGroupInviteLink(tokenClient as ApiClient, groupId ?? ''),
    enabled: groupId !== undefined && tokenClient !== undefined,
    ...WHATSAPP_LIVE,
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
      await queryClient.invalidateQueries({ queryKey: queryKeys.instanceGroups(instanceId, {}) });
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
      if (instanceId) await queryClient.invalidateQueries({ queryKey: queryKeys.instanceGroups(instanceId, {}) });
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
        queryClient.invalidateQueries({ queryKey: queryKeys.group(groupId) }),
        ...(instanceId ? [queryClient.invalidateQueries({ queryKey: queryKeys.instanceGroups(instanceId, {}) })] : []),
      ]);
    },
  });
}
