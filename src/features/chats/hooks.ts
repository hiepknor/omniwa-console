import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/api/ApiProvider';
import {
  cancelMessage,
  getChat,
  getMessageDeliveryHistory,
  listInstanceChats,
  listInstanceContacts,
  listInstanceLabels,
  listInstanceMessages,
  registerMedia,
  retryMessage,
  sendInstanceMediaMessage,
  sendInstanceTextMessage,
} from '@/api/chats';
import { getInstance, listInstances } from '@/api/instances';
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

export function useInstanceChats(instanceId: string | undefined) {
  const client = useApi();
  const refetchInterval = useRealtimeRefetchInterval();
  return useInfiniteQuery({
    queryKey: queryKeys.instanceChats(instanceId ?? '', {}),
    queryFn: ({ pageParam }) => listInstanceChats(client, instanceId ?? '', { cursor: pageParam, limit: 50 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.resource?.pagination?.nextCursor,
    enabled: instanceId !== undefined,
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

export function useInstanceContacts(instanceId: string | undefined) {
  const client = useApi();
  const refetchInterval = useRealtimeRefetchInterval();
  return useQuery({
    queryKey: queryKeys.instanceContacts(instanceId ?? '', {}),
    queryFn: () => listInstanceContacts(client, instanceId ?? '', { limit: 200 }),
    enabled: instanceId !== undefined,
    refetchInterval,
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

export function useSendTextMessage(instanceId: string) {
  const client = useApi();
  const queryClient = useQueryClient();
  const feedback = useFeedback();
  return useMutation({
    mutationFn: ({ chatId, text }: { chatId: string; text: string }) => (
      sendInstanceTextMessage(client, instanceId, { to: chatId, text })
    ),
    onSuccess: async (_operation, variables) => {
      feedback.accepted({
        title: 'Message send accepted',
        detail: 'Delivery status will update in message history.',
        dedupeKey: `message:${variables.chatId}:send`,
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.instanceMessages(instanceId, {}) });
    },
  });
}

export function useInstanceLabels(instanceId: string | undefined) {
  const client = useApi();
  const refetchInterval = useRealtimeRefetchInterval();
  return useQuery({
    queryKey: queryKeys.instanceLabels(instanceId ?? ''),
    queryFn: () => listInstanceLabels(client, instanceId ?? '', { limit: 100 }),
    enabled: instanceId !== undefined,
    refetchInterval,
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
    onSuccess: async (_operation, messageId) => {
      feedback.accepted({
        title: `Message ${action} accepted`,
        detail: 'Delivery status will update in message history.',
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
      feedback.accepted({
        title: 'Media registration accepted',
        detail: 'The media reference was accepted for processing.',
        dedupeKey: `media:${reference}:register`,
      });
      const registeredReference = registration?.resultRef ?? reference;
      return sendInstanceMediaMessage(client, instanceId, {
        type: 'media',
        to: chatId,
        ...(registration?.resultRef ? { mediaId: registeredReference } : { mediaRef: registeredReference }),
        ...(caption ? { caption } : {}),
      });
    },
    onSuccess: async (_operation, variables) => {
      feedback.accepted({
        title: 'Media message send accepted',
        detail: 'Delivery status will update in message history.',
        dedupeKey: `message:${variables.chatId}:send-media`,
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.instanceMessages(instanceId, {}) });
    },
  });
}
