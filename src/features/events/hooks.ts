import { useInfiniteQuery } from '@tanstack/react-query';
import { useApi } from '@/api/ApiProvider';
import { listAuditRecords, listEvents } from '@/api/events-api';
import { queryKeys } from '@/api/keys';
import { useRealtimeRefetchInterval } from '@/api/RealtimeProvider';

export function useEvents(initialCursor?: string) {
  const client = useApi();
  const refetchInterval = useRealtimeRefetchInterval();

  return useInfiniteQuery({
    queryKey: queryKeys.events({ initialCursor }),
    queryFn: ({ pageParam }) => listEvents(client, { cursor: pageParam, limit: 100 }),
    initialPageParam: initialCursor,
    getNextPageParam: (lastPage) => lastPage.resource?.pagination?.nextCursor,
    refetchInterval,
  });
}

export function useAuditRecords() {
  const client = useApi();

  return useInfiniteQuery({
    queryKey: queryKeys.auditRecords({}),
    queryFn: ({ pageParam }) => listAuditRecords(client, { cursor: pageParam, limit: 50 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.resource?.pagination?.nextCursor,
  });
}
