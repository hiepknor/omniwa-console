import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useApi, useApiSession } from './ApiProvider';
import { getCapabilities, hasCapability, type CapabilityName, type CapabilitySnapshot } from './capabilities';
import { createApiClient } from './client';
import { queryKeys } from './keys';

const CapabilitiesContext = createContext<UseQueryResult<CapabilitySnapshot, Error> | null>(null);

export function CapabilitiesProvider({ children }: { children: ReactNode }) {
  const client = useApi();
  const query = useQuery({
    queryKey: queryKeys.capabilities('session'),
    queryFn: () => getCapabilities(client),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  return <CapabilitiesContext.Provider value={query}>{children}</CapabilitiesContext.Provider>;
}

export function useServerCapabilities(): UseQueryResult<CapabilitySnapshot, Error> {
  const query = useContext(CapabilitiesContext);
  if (!query) throw new Error('useServerCapabilities must be used inside CapabilitiesProvider');
  return query;
}

export function useServerCapability(capability: CapabilityName): boolean {
  return hasCapability(useServerCapabilities().data, capability);
}

/**
 * Projection readiness is instance-scoped. The token authenticates the request
 * but never enters the query key; the stable instance id owns the cache scope.
 */
export function useInstanceCapabilities(instanceId: string | undefined, token: string | undefined) {
  const session = useApiSession();
  const client = useMemo(
    () => (token ? createApiClient({ baseUrl: session.baseUrl, apiKey: token }) : undefined),
    [session.baseUrl, token],
  );

  return useQuery({
    queryKey: queryKeys.capabilities(instanceId ? `instance:${instanceId}` : 'instance:unknown'),
    queryFn: () => getCapabilities(client!),
    enabled: instanceId !== undefined && client !== undefined,
    staleTime: 10_000,
    // A projection capability appears only after its initial sync is ready.
    refetchInterval: 15_000,
  });
}
