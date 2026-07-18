import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/api/ApiProvider';
import { getChat, listInstanceChats, listInstanceLabels, listInstanceMessages, sendInstanceTextMessage } from '@/api/chats';
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
