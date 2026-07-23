import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/api/ApiProvider';
import { listEvents } from '@/api/events-api';
import { listInstances } from '@/api/instances';
import { queryKeys } from '@/api/keys';
import { useInstanceClient } from '@/api/useInstanceClient';
import { useServerCapability } from '@/api/CapabilitiesProvider';

export function useEventInstances() {
  const client = useApi();
  const metadata = useServerCapability('instance_metadata_views');
  return useQuery({
    queryKey: [...queryKeys.instances({ metadata }), 'events-picker'] as const,
    queryFn: () => listInstances(client, { limit: 50, metadata }),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useEvents(
  instanceId: string | undefined,
  token: string | undefined,
  params: { cursor?: string; type?: string },
  enabled: boolean,
) {
  const client = useInstanceClient(token);
  return useInfiniteQuery({
    queryKey: queryKeys.instanceEvents(instanceId ?? '', params),
    queryFn: ({ pageParam }) => listEvents(client!, { cursor: pageParam, limit: 100, type: params.type }),
    initialPageParam: params.cursor,
    getNextPageParam: (lastPage) => lastPage.resource.pagination.nextCursor ?? undefined,
    enabled: enabled && instanceId !== undefined && client !== undefined,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useResetEvents(instanceId: string | undefined, params: { cursor?: string; type?: string }) {
  const queryClient = useQueryClient();
  return () => queryClient.resetQueries({
    queryKey: queryKeys.instanceEvents(instanceId ?? '', params),
    exact: true,
  });
}
