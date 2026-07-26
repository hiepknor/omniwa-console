import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/api/keys';

/** Drop reads authenticated by a replaceable instance token before installing its successor. */
export function clearInstanceCredentialCache(queryClient: QueryClient, instanceId: string): void {
  for (const queryKey of [
    queryKeys.capabilities(`instance:${instanceId}`),
    queryKeys.instanceStatus(instanceId),
    queryKeys.instanceQr(instanceId),
    queryKeys.instanceAdvancedSettings(instanceId),
  ]) {
    queryClient.removeQueries({ queryKey, exact: true });
  }
}
