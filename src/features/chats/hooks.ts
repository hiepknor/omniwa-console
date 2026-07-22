import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/api/ApiProvider';
import { getContact, listContacts } from '@/api/contacts';
import {
  cancelMessage,
  getChat,
  getMessageDeliveryHistory,
  listInstanceChats,
  listInstanceMessages,
  registerMedia,
  retryMessage,
  sendInstanceMediaMessage,
  sendInstanceTextMessage,
} from '@/api/chats';
import { getInstance, listInstances } from '@/api/instances';
import { notImplemented } from '@/api/envelopes';
import { queryKeys } from '@/api/keys';
import { getLabel, listLabels } from '@/api/labels';
import { useRealtimeRefetchInterval } from '@/api/RealtimeProvider';
import { useInstanceClient } from '@/api/useInstanceClient';
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

export function useInstanceChats(instanceId: string | undefined, enabled = true) {
  const client = useApi();
  const refetchInterval = useRealtimeRefetchInterval();
  return useInfiniteQuery({
    queryKey: queryKeys.instanceChats(instanceId ?? '', {}),
    queryFn: ({ pageParam }) => listInstanceChats(client, instanceId ?? '', { cursor: pageParam, limit: 50 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.resource?.pagination?.nextCursor,
    enabled: enabled && instanceId !== undefined,
    refetchInterval,
  });
}

export function useChat(chatId: string | undefined) {
  const client = useApi();
  const refetchInterval = useRealtimeRefetchInterval();
  return useQuery({
    queryKey: queryKeys.chat(chatId ?? ''),
    queryFn: () => getChat(client, chatId ?? ''),
    enabled: chatId !== undefined,
    refetchInterval,
  });
}

export function useInstanceMessages(instanceId: string | undefined) {
  const client = useApi();
  const refetchInterval = useRealtimeRefetchInterval();
  return useInfiniteQuery({
    queryKey: queryKeys.instanceMessages(instanceId ?? '', {}),
    queryFn: ({ pageParam }) => listInstanceMessages(client, instanceId ?? '', {
      cursor: pageParam,
      limit: 100,
      sort: '-createdAt',
    }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.resource?.pagination?.nextCursor,
    enabled: instanceId !== undefined,
    refetchInterval,
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

export function useMessageDeliveryHistory(messageId: string | undefined) {
  const client = useApi();
  const refetchInterval = useRealtimeRefetchInterval();
  return useQuery({
    queryKey: queryKeys.messageDeliveryHistory(messageId ?? ''),
    queryFn: () => getMessageDeliveryHistory(client, messageId ?? ''),
    enabled: messageId !== undefined,
    refetchInterval,
  });
}

export function useMessagingInstance(instanceId: string | undefined) {
  const client = useApi();
  const refetchInterval = useRealtimeRefetchInterval();
  return useQuery({
    queryKey: queryKeys.instance(instanceId ?? ''),
    queryFn: () => getInstance(client, instanceId ?? ''),
    enabled: instanceId !== undefined,
    refetchInterval,
  });
}

export function useRequestInstanceReconnect(instanceId: string) {
  const queryClient = useQueryClient();
  const feedback = useFeedback();
  return useMutation({
    mutationFn: () => Promise.reject(notImplemented('Instance reconnect')),
    onSuccess: async () => {
      feedback.accepted({
        title: 'Instance reconnect accepted',
        detail: 'Connection state will update automatically.',
        dedupeKey: `instance:${instanceId}:reconnect`,
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.instance(instanceId) });
    },
  });
}

export function useSendTextMessage(instanceId: string) {
  const client = useApi();
  const queryClient = useQueryClient();
  const feedback = useFeedback();
  return useMutation({
    mutationFn: ({ chatId, text }: { chatId: string; text: string }) => (
      sendInstanceTextMessage(client, instanceId, { to: chatId, text })
    ),
    onSuccess: async (result, variables) => {
      feedback.command(result.disposition, {
        action: 'Message send',
        acceptedDetail: 'The send command was accepted. Delivery status will update in message history.',
        completedDetail: 'The send command completed. Delivery status remains separate and will update in message history.',
        requestId: result.requestId,
        dedupeKey: `message:${variables.chatId}:send`,
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.instanceMessages(instanceId, {}) });
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


function useMessageAction(instanceId: string, action: 'retry' | 'cancel') {
  const client = useApi();
  const queryClient = useQueryClient();
  const feedback = useFeedback();
  return useMutation({
    mutationFn: (messageId: string) => action === 'retry'
      ? retryMessage(client, messageId)
      : cancelMessage(client, messageId),
    onSuccess: async (result, messageId) => {
      feedback.command(result.disposition, {
        action: `Message ${action}`,
        acceptedDetail: 'The command was accepted. Message status will update in history.',
        completedDetail: 'The command completed. Delivery status remains separate and will update in history.',
        requestId: result.requestId,
        dedupeKey: `message:${messageId}:${action}`,
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.message(messageId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.instanceMessages(instanceId, {}) }),
      ]);
    },
  });
}

export function useRetryMessage(instanceId: string) {
  return useMessageAction(instanceId, 'retry');
}

export function useCancelMessage(instanceId: string) {
  return useMessageAction(instanceId, 'cancel');
}

export function useSendMediaMessage(instanceId: string) {
  const client = useApi();
  const queryClient = useQueryClient();
  const feedback = useFeedback();
  return useMutation({
    mutationFn: async ({ chatId, reference, contentType, caption }: {
      chatId: string;
      reference: string;
      contentType?: string;
      caption?: string;
    }) => {
      const isUrl = /^https?:\/\//iu.test(reference);
      const registration = await registerMedia(client, {
        ...(isUrl ? { url: reference } : { mediaRef: reference }),
        ...(contentType ? { contentType } : {}),
      });
      feedback.command(registration.disposition, {
        action: 'Media registration',
        acceptedDetail: 'The media reference was accepted for processing.',
        completedDetail: 'The media reference was registered.',
        requestId: registration.requestId,
        dedupeKey: `media:${reference}:register`,
      });
      const registeredReference = registration.operation?.resultRef ?? reference;
      return sendInstanceMediaMessage(client, instanceId, {
        type: 'media',
        to: chatId,
        ...(registration.operation?.resultRef ? { mediaId: registeredReference } : { mediaRef: registeredReference }),
        ...(caption ? { caption } : {}),
      });
    },
    onSuccess: async (result, variables) => {
      feedback.command(result.disposition, {
        action: 'Media message send',
        acceptedDetail: 'The send command was accepted. Delivery status will update in message history.',
        completedDetail: 'The send command completed. Delivery status remains separate and will update in message history.',
        requestId: result.requestId,
        dedupeKey: `message:${variables.chatId}:send-media`,
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.instanceMessages(instanceId, {}) });
    },
  });
}
