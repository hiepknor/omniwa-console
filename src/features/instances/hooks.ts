import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/api/ApiProvider';
import {
  connectInstance,
  createInstance,
  destroyInstance,
  disconnectInstance,
  getInstance,
  getProviderCapabilities,
  listInstances,
  listInstanceSessions,
  refreshInstanceQr,
  refreshProviderCapabilities,
  requestInstanceReconnect,
  updateInstance,
} from '@/api/instances';
import { instanceKeys, queryKeys } from '@/api/keys';
import { useRealtimeRefetchInterval } from '@/api/RealtimeProvider';

export function useInstances(initialCursor?: string) {
  const client = useApi();
  const refetchInterval = useRealtimeRefetchInterval();
  return useInfiniteQuery({
    queryKey: queryKeys.instances({ initialCursor }),
    queryFn: ({ pageParam }) => listInstances(client, { cursor: pageParam, limit: 50 }),
    initialPageParam: initialCursor,
    getNextPageParam: (lastPage) => lastPage.resource?.pagination?.nextCursor,
    refetchInterval,
  });
}

export function useInstance(instanceId: string | undefined) {
  const client = useApi();
  const refetchInterval = useRealtimeRefetchInterval();
  return useQuery({
    queryKey: queryKeys.instance(instanceId ?? ''),
    queryFn: () => getInstance(client, instanceId ?? ''),
    enabled: instanceId !== undefined,
    refetchInterval,
  });
}

export function useInstanceSessions(instanceId: string | undefined) {
  const client = useApi();
  const refetchInterval = useRealtimeRefetchInterval();
  return useQuery({
    queryKey: queryKeys.instanceSessions(instanceId ?? ''),
    queryFn: () => listInstanceSessions(client, instanceId ?? '', { limit: 20 }),
    enabled: instanceId !== undefined,
    refetchInterval,
  });
}

export function useProviderCapabilities(enabled: boolean) {
  const client = useApi();
  const refetchInterval = useRealtimeRefetchInterval();
  return useQuery({
    queryKey: queryKeys.providerCapabilities,
    queryFn: () => getProviderCapabilities(client),
    enabled,
    refetchInterval,
  });
}

function useInvalidateInstance() {
  const queryClient = useQueryClient();
  return async (instanceId?: string) => {
    await queryClient.invalidateQueries({ queryKey: instanceKeys.root });
    if (instanceId !== undefined) {
      await queryClient.invalidateQueries({ queryKey: queryKeys.instance(instanceId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.instanceSessions(instanceId) });
    }
  };
}

export function useCreateInstance() {
  const client = useApi();
  const invalidate = useInvalidateInstance();
  return useMutation({
    mutationFn: (displayName: string) => createInstance(client, { displayName }),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateInstance(instanceId: string) {
  const client = useApi();
  const invalidate = useInvalidateInstance();
  return useMutation({
    mutationFn: (displayName: string) => updateInstance(client, instanceId, { displayName }),
    onSuccess: () => invalidate(instanceId),
  });
}

export function useConnectInstance(instanceId: string) {
  const client = useApi();
  const invalidate = useInvalidateInstance();
  return useMutation({
    mutationFn: () => connectInstance(client, instanceId),
    onSuccess: () => invalidate(instanceId),
  });
}

export function useDisconnectInstance(instanceId: string) {
  const client = useApi();
  const invalidate = useInvalidateInstance();
  return useMutation({
    mutationFn: () => disconnectInstance(client, instanceId),
    onSuccess: () => invalidate(instanceId),
  });
}

export function useDestroyInstance(instanceId: string) {
  const client = useApi();
  const invalidate = useInvalidateInstance();
  return useMutation({
    mutationFn: () => destroyInstance(client, instanceId),
    onSuccess: () => invalidate(instanceId),
  });
}

export function useReconnectInstance(instanceId: string) {
  const client = useApi();
  const invalidate = useInvalidateInstance();
  return useMutation({
    mutationFn: () => requestInstanceReconnect(client, instanceId),
    onSuccess: () => invalidate(instanceId),
  });
}

export function useRefreshInstanceQr(instanceId: string) {
  const client = useApi();
  const invalidate = useInvalidateInstance();
  return useMutation({
    mutationFn: () => refreshInstanceQr(client, instanceId),
    onSuccess: () => invalidate(instanceId),
  });
}

export function useRefreshProviderCapabilities() {
  const client = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => refreshProviderCapabilities(client),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: instanceKeys.provider }),
  });
}
