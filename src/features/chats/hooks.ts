import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/api/ApiProvider';
import { getContact, listContacts } from '@/api/contacts';
import { getChat, listChats } from '@/api/chats';
import {
  getMessage,
  listMessageReceipts,
  listMessages,
  sendMediaMessage,
  sendTextMessage,
  type SendMediaInput,
} from '@/api/messages';
import { listInstances } from '@/api/instances';
import { queryKeys } from '@/api/keys';
import { getLabel, listLabels } from '@/api/labels';
import { useRealtimeRefetchInterval } from '@/api/RealtimeProvider';
import { useInstanceClient } from '@/api/useInstanceClient';
import { useFeedback } from '@/components/feedback/FeedbackProvider';
import { useServerCapability } from '@/api/CapabilitiesProvider';

export function usePickerInstances() {
  const client = useApi();
  const metadata = useServerCapability('instance_metadata_views');
  const refetchInterval = useRealtimeRefetchInterval();
  return useQuery({
    queryKey: [...queryKeys.instances({ metadata }), 'picker'] as const,
    queryFn: () => listInstances(client, { limit: 50, metadata }),
    refetchInterval,
  });
}

export function useInstanceChats(instanceId: string | undefined, token: string | undefined, enabled = true) {
  const client = useInstanceClient(token);
  return useInfiniteQuery({
    queryKey: queryKeys.instanceChats(instanceId ?? '', {}),
    queryFn: ({ pageParam }) => listChats(client!, { cursor: pageParam, limit: 50 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.resource.pagination.nextCursor ?? undefined,
    enabled: enabled && instanceId !== undefined && client !== undefined,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useResetInstanceChats(instanceId: string | undefined) {
  const queryClient = useQueryClient();
  return () => queryClient.resetQueries({
    queryKey: queryKeys.instanceChats(instanceId ?? '', {}),
    exact: true,
  });
}

export function useChat(instanceId: string | undefined, chatId: string | undefined, token: string | undefined, enabled = true) {
  const client = useInstanceClient(token);
  return useQuery({
    queryKey: queryKeys.chat(instanceId ?? '', chatId ?? ''),
    queryFn: () => getChat(client!, chatId ?? ''),
    enabled: enabled && instanceId !== undefined && chatId !== undefined && client !== undefined,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useInstanceMessages(
  instanceId: string | undefined,
  chatId: string | undefined,
  token: string | undefined,
  enabled = true,
) {
  const client = useInstanceClient(token);
  return useInfiniteQuery({
    queryKey: queryKeys.instanceMessages(instanceId ?? '', chatId ?? '', {}),
    queryFn: ({ pageParam }) => listMessages(client!, chatId ?? '', { cursor: pageParam, limit: 100 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.resource.pagination.nextCursor ?? undefined,
    enabled: enabled && instanceId !== undefined && chatId !== undefined && client !== undefined,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useResetInstanceMessages(instanceId: string | undefined, chatId: string | undefined) {
  const queryClient = useQueryClient();
  return () => queryClient.resetQueries({
    queryKey: queryKeys.instanceMessages(instanceId ?? '', chatId ?? '', {}),
    exact: true,
  });
}

export function useMessage(instanceId: string | undefined, messageId: string | undefined, token: string | undefined, enabled = true) {
  const client = useInstanceClient(token);
  return useQuery({
    queryKey: queryKeys.message(instanceId ?? '', messageId ?? ''),
    queryFn: () => getMessage(client!, messageId ?? ''),
    enabled: enabled && instanceId !== undefined && messageId !== undefined && client !== undefined,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useInstanceContacts(
  instanceId: string | undefined,
  token: string | undefined,
  params: { search?: string; cursor?: string; limit?: number } = {},
  enabled = true,
) {
  const client = useInstanceClient(token);
  return useQuery({
    queryKey: queryKeys.instanceContacts(instanceId ?? '', params),
    queryFn: () => listContacts(client!, params),
    enabled: enabled && instanceId !== undefined && client !== undefined,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useContact(
  instanceId: string | undefined,
  contactId: string | undefined,
  token: string | undefined,
  enabled = true,
) {
  const client = useInstanceClient(token);
  return useQuery({
    queryKey: queryKeys.contact(instanceId ?? '', contactId ?? ''),
    queryFn: () => getContact(client!, contactId ?? ''),
    enabled: enabled && instanceId !== undefined && contactId !== undefined && client !== undefined,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useMessageDeliveryHistory(instanceId: string | undefined, messageId: string | undefined, token: string | undefined, enabled = true) {
  const client = useInstanceClient(token);
  return useQuery({
    queryKey: queryKeys.messageDeliveryHistory(instanceId ?? '', messageId ?? ''),
    queryFn: () => listMessageReceipts(client!, messageId ?? ''),
    enabled: enabled && instanceId !== undefined && messageId !== undefined && client !== undefined,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useSendTextMessage(instanceId: string, token: string | undefined) {
  const client = useInstanceClient(token);
  const queryClient = useQueryClient();
  const feedback = useFeedback();
  return useMutation({
    mutationFn: ({ chatId, text }: { chatId: string; text: string }) => (
      sendTextMessage(client!, chatId, text)
    ),
    onSuccess: async (result, variables) => {
      feedback.command(result.disposition, {
        action: 'Message send',
        acceptedDetail: 'The send command was accepted. Delivery status will update in message history.',
        completedDetail: 'The send command completed. Delivery status remains separate and will update in message history.',
        requestId: result.requestId,
        dedupeKey: `message:${variables.chatId}:send`,
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.instanceChats(instanceId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.instanceMessages(instanceId, variables.chatId, {}) }),
      ]);
    },
  });
}

export function useSendMediaMessage(instanceId: string, token: string | undefined) {
  const client = useInstanceClient(token);
  const queryClient = useQueryClient();
  const feedback = useFeedback();
  return useMutation({
    mutationFn: ({ chatId, ...input }: SendMediaInput & { chatId: string }) => (
      sendMediaMessage(client!, chatId, input)
    ),
    onSuccess: async (result, variables) => {
      feedback.command(result.disposition, {
        action: 'Media send',
        acceptedDetail: 'The media send command was accepted. Delivery status will update in message history.',
        completedDetail: 'The media send command completed. Delivery status remains separate and will update in message history.',
        requestId: result.requestId,
        dedupeKey: `message:${variables.chatId}:media-send`,
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.instanceChats(instanceId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.instanceMessages(instanceId, variables.chatId, {}) }),
      ]);
    },
  });
}

export function useInstanceLabels(instanceId: string | undefined, token: string | undefined, enabled = true) {
  const client = useInstanceClient(token);
  return useQuery({
    queryKey: queryKeys.instanceLabels(instanceId ?? ''),
    queryFn: () => listLabels(client!),
    enabled: enabled && instanceId !== undefined && client !== undefined,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useLabel(instanceId: string | undefined, labelId: string | undefined, token: string | undefined, enabled = true) {
  const client = useInstanceClient(token);
  return useQuery({
    queryKey: queryKeys.label(instanceId ?? '', labelId ?? ''),
    queryFn: () => getLabel(client!, labelId ?? ''),
    enabled: enabled && instanceId !== undefined && labelId !== undefined && client !== undefined,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
