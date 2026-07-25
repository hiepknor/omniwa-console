import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/api/ApiProvider';
import { queryKeys } from '@/api/keys';
import { PLATFORM_READ_POLICY, RECOVERY_STALE_TIME } from '@/lib/query-policy';
import { getOverview, getProjectionHealth, getServerHealth } from '@/api/overview';
import {
  discardProjectionFailure,
  getProjectionFailures,
  replayProjectionFailure,
  type ProjectionFailureCommand,
  type ProjectionFailureFilters,
} from '@/api/recovery';

export function usePlatformOverview(window: string) {
  const client = useApi();
  return useQuery({
    queryKey: queryKeys.overview(window),
    queryFn: () => getOverview(client, window),
    ...PLATFORM_READ_POLICY,
  });
}

export function usePlatformHealth() {
  const client = useApi();
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: () => getServerHealth(client),
    ...PLATFORM_READ_POLICY,
  });
}

export function usePlatformProjectionHealth() {
  const client = useApi();
  return useQuery({
    queryKey: queryKeys.projectionHealth,
    queryFn: () => getProjectionHealth(client),
    ...PLATFORM_READ_POLICY,
  });
}

export function useProjectionFailures(filters: ProjectionFailureFilters, enabled: boolean) {
  const client = useApi();
  return useQuery({
    queryKey: queryKeys.projectionFailures(filters),
    queryFn: () => getProjectionFailures(client, filters),
    enabled,
    staleTime: RECOVERY_STALE_TIME,
  });
}

function useRecoveryCommand(action: 'replay' | 'discard') {
  const client = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ProjectionFailureCommand) =>
      action === 'replay'
        ? replayProjectionFailure(client, body)
        : discardProjectionFailure(client, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.projectionFailuresRoot }),
  });
}

export function useReplayProjectionFailure() {
  return useRecoveryCommand('replay');
}

export function useDiscardProjectionFailure() {
  return useRecoveryCommand('discard');
}
