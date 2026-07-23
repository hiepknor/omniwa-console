import { useQuery } from '@tanstack/react-query';
import { useApi } from '@/api/ApiProvider';
import { listEvents } from '@/api/events-api';
import { queryKeys, SESSION_QUERY_SCOPE } from '@/api/keys';

export function useEventsV2(type: string, cursor: string | undefined, enabled: boolean) {
  const client = useApi();
  const params = { type: type || undefined, cursor, limit: 100 };
  return useQuery({
    queryKey: queryKeys.instanceEvents(SESSION_QUERY_SCOPE, params),
    queryFn: () => listEvents(client, params),
    enabled,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
