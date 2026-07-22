import { useMemo } from 'react';
import { useApiSession } from './ApiProvider';
import { createApiClient, type ApiClient } from './client';

/**
 * Build an instance-scoped client without allowing the bearer token into a
 * query key, URL, log, or component-owned cache.
 */
export function useInstanceClient(token: string | undefined): ApiClient | undefined {
  const session = useApiSession();
  return useMemo(
    () => (token ? createApiClient({ baseUrl: session.baseUrl, apiKey: token }) : undefined),
    [session.baseUrl, token],
  );
}
