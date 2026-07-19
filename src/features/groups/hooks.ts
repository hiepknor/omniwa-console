import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/api/ApiProvider';
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

export function useInstanceGroups(instanceId: string | undefined) {
  const client = useApi();
  const refetchInterval = useRealtimeRefetchInterval();
  return useInfiniteQuery({
    queryKey: queryKeys.instanceGroups(instanceId ?? '', {}),
    queryFn: ({ pageParam }) => listInstanceGroups(client, instanceId ?? '', { cursor: pageParam, limit: 50 }),
    initialPageParam: undefined as string | undefined,
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
  return (action: string, key: string, detail = 'Group data refreshes automatically.') => {
    feedback.accepted({
      title: `${action} accepted`,
      detail,
      dedupeKey: `group:${groupId}:${key}`,
    });
  };
}

export function useRefreshGroupInviteLink(groupId: string) {
  const client = useApi();
  const accepted = useGroupFeedback(groupId);
  return useMutation({
    mutationFn: () => refreshGroupInviteLink(client, groupId),
    onSuccess: () => accepted('Invite link refresh', 'refresh-invite-link', 'The platform will refresh the invite link asynchronously.'),
  });
}

export function useUpdateGroupLocalState(groupId: string, instanceId: string | undefined) {
  const client = useApi();
  const queryClient = useQueryClient();
  const accepted = useGroupFeedback(groupId);
  return useMutation({
    mutationFn: (body: GroupLocalStateRequest) => updateGroupLocalState(client, groupId, body),
    onSuccess: async (_data, body) => {
      accepted('Local state update', `local-state:${Object.keys(body)[0] ?? 'state'}`);
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
    onSuccess: async () => {
      accepted('Metadata update', 'update-metadata');
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
    onSuccess: async (_data, jid) => { accepted('Add member', `add-member:${jid}`); await invalidate(); },
  });
}

export function usePromoteGroupMember(groupId: string) {
  const client = useApi();
  const invalidate = useInvalidateGroupMembers(groupId);
  const accepted = useGroupFeedback(groupId);
  return useMutation({
    mutationFn: (memberJid: string) => promoteGroupMember(client, groupId, memberJid),
    onSuccess: async (_data, memberJid) => { accepted('Promote member', `promote:${memberJid}`); await invalidate(); },
  });
}

export function useDemoteGroupMember(groupId: string) {
  const client = useApi();
  const invalidate = useInvalidateGroupMembers(groupId);
  const accepted = useGroupFeedback(groupId);
  return useMutation({
    mutationFn: (memberJid: string) => demoteGroupMember(client, groupId, memberJid),
    onSuccess: async (_data, memberJid) => { accepted('Demote member', `demote:${memberJid}`); await invalidate(); },
  });
}

export function useRemoveGroupMember(groupId: string) {
  const client = useApi();
  const invalidate = useInvalidateGroupMembers(groupId);
  const accepted = useGroupFeedback(groupId);
  return useMutation({
    mutationFn: (memberJid: string) => removeGroupMember(client, groupId, memberJid),
    onSuccess: async (_data, memberJid) => { accepted('Remove member', `remove:${memberJid}`); await invalidate(); },
  });
}

export function useSendGroupText(groupId: string) {
  const client = useApi();
  const accepted = useGroupFeedback(groupId);
  return useMutation({
    mutationFn: (text: string) => sendGroupTextMessage(client, groupId, { text }),
    onSuccess: () => accepted('Send text', 'send-text', 'Delivery follows the message pipeline.'),
  });
}

export function useRefreshGroups(instanceId: string) {
  const client = useApi();
  const queryClient = useQueryClient();
  const feedback = useFeedback();
  return useMutation({
    mutationFn: () => refreshInstanceGroups(client, instanceId),
    onSuccess: async () => {
      feedback.accepted({
        title: 'Group sync accepted',
        detail: 'Group projections will refresh asynchronously.',
        dedupeKey: `instance:${instanceId}:refresh-groups`,
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.instanceGroups(instanceId, {}) });
    },
  });
}
