import { useQuery } from '@tanstack/react-query';
import { useApi } from '@/api/ApiProvider';
import { listEvents } from '@/api/events-api';
import { queryKeys } from '@/api/keys';

const SCOPE = 'session';

export function useEventsV2(type: string, cursor: string | undefined, enabled: boolean) {
  const client = useApi();
  const params = { type: type || undefined, cursor, limit: 100 };
  return useQuery({
    queryKey: queryKeys.instanceEvents(SCOPE, params),
    queryFn: () => listEvents(client, params),
    enabled,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
