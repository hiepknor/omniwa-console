import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/api/ApiProvider';
import { queryKeys } from '@/api/keys';
import { useRealtimeRefetchInterval } from '@/api/RealtimeProvider';
import { activateSettings, getSettings, validateSettings } from '@/api/settings';

export function useSettings() {
  const client = useApi();
  const refetchInterval = useRealtimeRefetchInterval();

  return useQuery({
    queryKey: queryKeys.settings,
    queryFn: () => getSettings(client),
    refetchInterval,
  });
}

export function useValidateSettings() {
  const client = useApi();
  return useMutation({
    mutationFn: (draft: Record<string, unknown>) => validateSettings(client, draft),
  });
}

export function useActivateSettings() {
  const client = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (draft: Record<string, unknown>) => activateSettings(client, draft),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.settings }),
  });
}
