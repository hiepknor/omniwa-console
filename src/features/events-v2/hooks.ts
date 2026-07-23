import { useQuery } from '@tanstack/react-query';
import { useApi } from '@/api/ApiProvider';
import { listEvents } from '@/api/events-api';
import { queryKeys, SESSION_QUERY_SCOPE } from '@/api/keys';
import { PROJECTION_READ_POLICY } from '@/lib/query-policy';

export function useEventsV2(type: string, cursor: string | undefined, enabled: boolean) {
  const client = useApi();
  const params = { type: type || undefined, cursor, limit: 100 };
  return useQuery({
    queryKey: queryKeys.instanceEvents(SESSION_QUERY_SCOPE, params),
    queryFn: () => listEvents(client, params),
    enabled,
    ...PROJECTION_READ_POLICY,
  });
}
