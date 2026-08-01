import { useQuery } from '@tanstack/react-query';
import { useApi } from './ApiProvider';
import { listContacts } from './contacts';
import { queryKeys, SESSION_QUERY_SCOPE } from './keys';
import { pollingWhen, PROJECTION_READ_POLICY, QUERY_INTERVALS } from '@/lib/query-policy';

export function useContactsProjection(
  search: string,
  cursor: string | undefined,
  enabled: boolean,
  canonicalIdentity: boolean,
) {
  const client = useApi();
  const params = { search: search || undefined, cursor, limit: 50, canonicalIdentity };
  return useQuery({
    queryKey: queryKeys.instanceContacts(SESSION_QUERY_SCOPE, params),
    queryFn: () => listContacts(client, params),
    enabled,
    staleTime: PROJECTION_READ_POLICY.staleTime,
    refetchInterval: pollingWhen(enabled, QUERY_INTERVALS.projection),
  });
}
