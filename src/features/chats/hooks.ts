import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useApi } from '@/api/ApiProvider';
import { getChat, listInstanceChats, listInstanceLabels } from '@/api/chats';
import { listInstances } from '@/api/instances';
import { queryKeys } from '@/api/keys';
import { useRealtimeRefetchInterval } from '@/api/RealtimeProvider';

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
