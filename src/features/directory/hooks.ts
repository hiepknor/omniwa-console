import { useQuery } from '@tanstack/react-query';
import { useApi } from '@/api/ApiProvider';
import { getContact, listContacts } from '@/api/contacts';
import { getLabel, listLabels } from '@/api/labels';
import { queryKeys, SESSION_QUERY_SCOPE } from '@/api/keys';
import { pollingWhen, PROJECTION_READ_POLICY, QUERY_INTERVALS } from '@/lib/query-policy';

export function useContacts(search: string, cursor: string | undefined, enabled: boolean, canonicalIdentity: boolean) {
  const client = useApi();
  const params = { search: search || undefined, cursor, limit: 50, canonicalIdentity };
  return useQuery({ queryKey: queryKeys.instanceContacts(SESSION_QUERY_SCOPE, params), queryFn: () => listContacts(client, params), enabled, staleTime: PROJECTION_READ_POLICY.staleTime, refetchInterval: pollingWhen(enabled, QUERY_INTERVALS.projection) });
}
export function useContact(contactId: string | undefined, enabled: boolean, canonicalIdentity: boolean) {
  const client = useApi();
  return useQuery({ queryKey: queryKeys.contact(SESSION_QUERY_SCOPE, contactId ?? '', { canonicalIdentity }), queryFn: () => getContact(client, contactId ?? '', canonicalIdentity), enabled: enabled && Boolean(contactId), staleTime: PROJECTION_READ_POLICY.staleTime });
}

export function useLabels(enabled: boolean) {
  const client = useApi();
  return useQuery({ queryKey: queryKeys.instanceLabels(SESSION_QUERY_SCOPE), queryFn: () => listLabels(client), enabled, staleTime: PROJECTION_READ_POLICY.staleTime, refetchInterval: pollingWhen(enabled, QUERY_INTERVALS.projection) });
}

export function useLabel(labelId: string | undefined, enabled: boolean) {
  const client = useApi();
  return useQuery({ queryKey: queryKeys.label(SESSION_QUERY_SCOPE, labelId ?? ''), queryFn: () => getLabel(client, labelId ?? ''), enabled: enabled && Boolean(labelId), staleTime: PROJECTION_READ_POLICY.staleTime });
}
