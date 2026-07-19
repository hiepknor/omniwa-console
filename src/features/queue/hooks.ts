import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useApi } from '@/api/ApiProvider';
import { queryKeys } from '@/api/keys';
import { getJob, getQueueStatus, listJobs } from '@/api/queue';
import { useRealtimeRefetchInterval } from '@/api/RealtimeProvider';

export function useQueueStatus() {
  const client = useApi();
  const refetchInterval = useRealtimeRefetchInterval();
  return useQuery({
    queryKey: queryKeys.queueStatus,
    queryFn: () => getQueueStatus(client),
    refetchInterval,
  });
}

export function useJobs(initialCursor?: string) {
  const client = useApi();
  const refetchInterval = useRealtimeRefetchInterval();
  return useInfiniteQuery({
    queryKey: queryKeys.jobs({ initialCursor }),
    queryFn: ({ pageParam }) => listJobs(client, { cursor: pageParam, limit: 50 }),
    initialPageParam: initialCursor,
    getNextPageParam: (lastPage) => lastPage.resource?.pagination?.nextCursor,
    refetchInterval,
  });
}

export function useJob(jobId: string | undefined) {
  const client = useApi();
  const refetchInterval = useRealtimeRefetchInterval();
  return useQuery({
    queryKey: queryKeys.job(jobId ?? ''),
    queryFn: () => getJob(client, jobId ?? ''),
    enabled: Boolean(jobId),
    refetchInterval,
  });
}
