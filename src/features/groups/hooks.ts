import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/api/ApiProvider';
import type { CommandResult } from '@/api/envelopes';
import {
  addGroupMember,
  demoteGroupMember,
  getGroup,
  listGroupMembers,
  listInstanceGroups,
  promoteGroupMember,
  refreshGroupInviteLink,
  refreshInstanceGroups,
  removeGroupMember,
  sendGroupTextMessage,
  updateGroup,
  updateGroupLocalState,
  type GroupLocalStateRequest,
  type GroupMetadataRequest,
} from '@/api/groups';
import { listInstances } from '@/api/instances';
import { queryKeys } from '@/api/keys';
import { useRealtimeRefetchInterval } from '@/api/RealtimeProvider';
import { useFeedback } from '@/components/feedback/FeedbackProvider';

export function usePickerInstances() {
  const client = useApi();
  const refetchInterval = useRealtimeRefetchInterval();
  return useQuery({
    queryKey: [...queryKeys.instances({}), 'picker'] as const,
    queryFn: () => listInstances(client, { limit: 50 }),
    refetchInterval,
  });
}

export function useInstanceGroups(instanceId: string | undefined, initialCursor?: string) {
  const client = useApi();
  const refetchInterval = useRealtimeRefetchInterval();
  return useInfiniteQuery({
    queryKey: queryKeys.instanceGroups(instanceId ?? '', { initialCursor }),
    queryFn: ({ pageParam }) => listInstanceGroups(client, instanceId ?? '', { cursor: pageParam, limit: 50 }),
    initialPageParam: initialCursor,
    getNextPageParam: (lastPage) => lastPage.resource?.pagination?.nextCursor,
    enabled: instanceId !== undefined,
    refetchInterval,
  });
}

export function useGroup(groupId: string | undefined) {
  const client = useApi();
  const refetchInterval = useRealtimeRefetchInterval();
  return useQuery({
    queryKey: queryKeys.group(groupId ?? ''),
    queryFn: () => getGroup(client, groupId ?? ''),
    enabled: groupId !== undefined,
    refetchInterval,
  });
}

export function useGroupMembers(groupId: string | undefined) {
  const client = useApi();
  const refetchInterval = useRealtimeRefetchInterval();
  return useInfiniteQuery({
    queryKey: queryKeys.groupMembers(groupId ?? ''),
    queryFn: ({ pageParam }) => listGroupMembers(client, groupId ?? '', { cursor: pageParam, limit: 50 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.resource?.pagination?.nextCursor,
    enabled: groupId !== undefined,
    refetchInterval,
  });
}

function useGroupFeedback(groupId: string) {
  const feedback = useFeedback();
  return (
    result: CommandResult,
    action: string,
    key: string,
    acceptedDetail = 'The platform accepted the command. Group data refreshes automatically.',
    completedDetail = 'The platform completed the command. Group data refreshes automatically.',
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

export function useRefreshGroupInviteLink(groupId: string) {
  const client = useApi();
  const accepted = useGroupFeedback(groupId);
  return useMutation({
    mutationFn: () => refreshGroupInviteLink(client, groupId),
    onSuccess: (result) => accepted(result, 'Invite link refresh', 'refresh-invite-link', 'The platform accepted the invite-link refresh.', 'The platform completed the invite-link refresh.'),
  });
}

export function useUpdateGroupLocalState(groupId: string, instanceId: string | undefined) {
  const client = useApi();
  const queryClient = useQueryClient();
  const accepted = useGroupFeedback(groupId);
  return useMutation({
    mutationFn: (body: GroupLocalStateRequest) => updateGroupLocalState(client, groupId, body),
    onSuccess: async (result, body) => {
      accepted(result, 'Local state update', `local-state:${Object.keys(body)[0] ?? 'state'}`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.group(groupId) }),
        ...(instanceId ? [queryClient.invalidateQueries({ queryKey: queryKeys.instanceGroups(instanceId, {}) })] : []),
      ]);
    },
  });
}

export function useUpdateGroup(groupId: string, instanceId: string | undefined) {
  const client = useApi();
  const queryClient = useQueryClient();
  const accepted = useGroupFeedback(groupId);
  return useMutation({
    mutationFn: (body: GroupMetadataRequest) => updateGroup(client, groupId, body),
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
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.groupMembers(groupId) });
}

export function useAddGroupMember(groupId: string) {
  const client = useApi();
  const invalidate = useInvalidateGroupMembers(groupId);
  const accepted = useGroupFeedback(groupId);
  return useMutation({
    mutationFn: (jid: string) => addGroupMember(client, groupId, { jid }),
    onSuccess: async (result, jid) => { accepted(result, 'Add member', `add-member:${jid}`); await invalidate(); },
  });
}

export function usePromoteGroupMember(groupId: string) {
  const client = useApi();
  const invalidate = useInvalidateGroupMembers(groupId);
  const accepted = useGroupFeedback(groupId);
  return useMutation({
    mutationFn: (memberJid: string) => promoteGroupMember(client, groupId, memberJid),
    onSuccess: async (result, memberJid) => { accepted(result, 'Promote member', `promote:${memberJid}`); await invalidate(); },
  });
}

export function useDemoteGroupMember(groupId: string) {
  const client = useApi();
  const invalidate = useInvalidateGroupMembers(groupId);
  const accepted = useGroupFeedback(groupId);
  return useMutation({
    mutationFn: (memberJid: string) => demoteGroupMember(client, groupId, memberJid),
    onSuccess: async (result, memberJid) => { accepted(result, 'Demote member', `demote:${memberJid}`); await invalidate(); },
  });
}

export function useRemoveGroupMember(groupId: string) {
  const client = useApi();
  const invalidate = useInvalidateGroupMembers(groupId);
  const accepted = useGroupFeedback(groupId);
  return useMutation({
    mutationFn: (memberJid: string) => removeGroupMember(client, groupId, memberJid),
    onSuccess: async (result, memberJid) => { accepted(result, 'Remove member', `remove:${memberJid}`); await invalidate(); },
  });
}

export function useSendGroupText(groupId: string) {
  const client = useApi();
  const accepted = useGroupFeedback(groupId);
  return useMutation({
    mutationFn: (text: string) => sendGroupTextMessage(client, groupId, { text }),
    onSuccess: (result) => accepted(result, 'Send text', 'send-text', 'The send command was accepted. Delivery follows the message pipeline.', 'The send command completed. Delivery remains a separate message state.'),
  });
}

export function useRefreshGroups(instanceId: string) {
  const client = useApi();
  const queryClient = useQueryClient();
  const feedback = useFeedback();
  return useMutation({
    mutationFn: () => refreshInstanceGroups(client, instanceId),
    onSuccess: async (result) => {
      feedback.command(result.disposition, {
        action: 'Group sync',
        acceptedDetail: 'Group discovery was accepted. Projections will refresh asynchronously.',
        completedDetail: 'Group discovery completed. Projections refresh automatically.',
        requestId: result.requestId,
        dedupeKey: `instance:${instanceId}:refresh-groups`,
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.instanceGroups(instanceId, {}) });
    },
  });
}
