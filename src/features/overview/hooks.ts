import { useQuery } from '@tanstack/react-query';
import { useApi } from '@/api/ApiProvider';
import { queryKeys } from '@/api/keys';
import { getOverview, getServerHealth } from '@/api/overview';
export { useResilientReadState as useStableReadState } from '@/lib/query-state';

export function isTransportFailure(error: unknown): boolean {
  if (error instanceof TypeError) return true;
  return error instanceof Error && /failed to fetch|load failed|networkerror/i.test(error.message);
}

export function useHealth() {
  const client = useApi();
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: () => getServerHealth(client),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

export function useOverview(window = '24h') {
  const client = useApi();
  return useQuery({
    queryKey: queryKeys.overview(window),
    queryFn: () => getOverview(client, window),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}
