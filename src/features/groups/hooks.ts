import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/api/ApiProvider';
import { listInstanceGroups, refreshInstanceGroups } from '@/api/groups';
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
