import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi, useApiSession } from '@/api/ApiProvider';
import { createApiClient, type ApiClient } from '@/api/client';
import {
  connectInstance,
  createInstance,
  destroyInstance,
  disconnectInstance,
  getAdvancedSettings,
  getInstance,
  getInstanceQr,
  getInstanceStatus,
  listInstances,
  logoutInstance,
  reconnectInstance,
  rotateInstanceToken,
  updateAdvancedSettings,
  type InstanceAdvancedSettings,
  type InstanceCreateRequest,
} from '@/api/instances';
import { instanceKeys, queryKeys } from '@/api/keys';
import { useRealtimeRefetchInterval } from '@/api/RealtimeProvider';
import { useServerCapability } from '@/api/CapabilitiesProvider';
import { useSetInstanceCredential } from '@/api/ApiProvider';

/**
 * Build a client authenticated with a specific instance's token, for omniwa-go's
 * token-scoped routes. Returns undefined until a token is known.
 */
function useInstanceClient(token: string | undefined): ApiClient | undefined {
  const session = useApiSession();
  return useMemo(
    () => (token ? createApiClient({ baseUrl: session.baseUrl, apiKey: token }) : undefined),
    [session.baseUrl, token],
  );
}

export function useInstances() {
  const client = useApi();
  const metadata = useServerCapability('instance_metadata_views');
  const refetchInterval = useRealtimeRefetchInterval();
  return useQuery({
    queryKey: queryKeys.instances({ metadata }),
    queryFn: () => listInstances(client, { metadata }),
    refetchInterval,
  });
}

export function useInstance(instanceId: string | undefined) {
  const client = useApi();
  const metadata = useServerCapability('instance_metadata_views');
  const refetchInterval = useRealtimeRefetchInterval();
  return useQuery({
    queryKey: [...queryKeys.instance(instanceId ?? ''), { metadata }] as const,
    queryFn: () => getInstance(client, instanceId ?? '', metadata),
    enabled: instanceId !== undefined,
    refetchInterval,
  });
}

export function useInstanceStatus(instanceId: string, token: string | undefined) {
  const tokenClient = useInstanceClient(token);
  const refetchInterval = useRealtimeRefetchInterval();
  return useQuery({
    queryKey: [...queryKeys.instance(instanceId), 'status'],
    queryFn: () => getInstanceStatus(tokenClient as ApiClient),
    enabled: tokenClient !== undefined,
    refetchInterval,
  });
}

export function useInstanceQr(instanceId: string, token: string | undefined, enabled: boolean) {
  const tokenClient = useInstanceClient(token);
  return useQuery({
    queryKey: [...queryKeys.instance(instanceId), 'qr'],
    queryFn: () => getInstanceQr(tokenClient as ApiClient),
    enabled: enabled && tokenClient !== undefined,
    // QR rotates while pairing; poll only during that short window (and only when
    // connected, per the drawer gate) to stay well under WhatsApp's limits.
    refetchInterval: enabled ? 20_000 : false,
  });
}

function useInvalidateInstance() {
  const queryClient = useQueryClient();
  return async (instanceId?: string) => {
    await queryClient.invalidateQueries({ queryKey: instanceKeys.root });
    if (instanceId !== undefined) {
      await queryClient.invalidateQueries({ queryKey: queryKeys.instance(instanceId) });
    }
  };
}

export function useCreateInstance() {
  const client = useApi();
  const invalidate = useInvalidateInstance();
  const setCredential = useSetInstanceCredential();
  return useMutation({
    mutationFn: (body: InstanceCreateRequest) => createInstance(client, body),
    onSuccess: (result) => { setCredential(result.instanceId, result.token); return invalidate(); },
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

export function useRotateInstanceToken(instanceId: string) {
  const client = useApi();
  const invalidate = useInvalidateInstance();
  const setCredential = useSetInstanceCredential();
  return useMutation({
    mutationFn: ({ expectedVersion, reason }: { expectedVersion: number; reason: string }) => rotateInstanceToken(client, instanceId, expectedVersion, reason),
    onSuccess: (result) => { setCredential(instanceId, result.token); return invalidate(instanceId); },
  });
}

export function useConnectInstance(instanceId: string, token: string | undefined) {
  const tokenClient = useInstanceClient(token);
  const invalidate = useInvalidateInstance();
  return useMutation({
    mutationFn: () => connectInstance(tokenClient as ApiClient),
    onSuccess: () => invalidate(instanceId),
  });
}

export function useDisconnectInstance(instanceId: string, token: string | undefined) {
  const tokenClient = useInstanceClient(token);
  const invalidate = useInvalidateInstance();
  return useMutation({
    mutationFn: () => disconnectInstance(tokenClient as ApiClient),
    onSuccess: () => invalidate(instanceId),
  });
}

export function useReconnectInstance(instanceId: string, token: string | undefined) {
  const tokenClient = useInstanceClient(token);
  const invalidate = useInvalidateInstance();
  return useMutation({
    mutationFn: () => reconnectInstance(tokenClient as ApiClient),
    onSuccess: () => invalidate(instanceId),
  });
}

export function useLogoutInstance(instanceId: string, token: string | undefined) {
  const tokenClient = useInstanceClient(token);
  const invalidate = useInvalidateInstance();
  return useMutation({
    mutationFn: () => logoutInstance(tokenClient as ApiClient),
    onSuccess: () => invalidate(instanceId),
  });
}

export function useInstanceAdvancedSettings(instanceId: string, token: string | undefined) {
  const tokenClient = useInstanceClient(token);
  return useQuery({
    queryKey: [...queryKeys.instance(instanceId), 'advanced-settings'],
    queryFn: () => getAdvancedSettings(tokenClient as ApiClient, instanceId),
    enabled: tokenClient !== undefined,
  });
}

export function useUpdateAdvancedSettings(instanceId: string, token: string | undefined) {
  const tokenClient = useInstanceClient(token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: InstanceAdvancedSettings) => updateAdvancedSettings(tokenClient as ApiClient, instanceId, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...queryKeys.instance(instanceId), 'advanced-settings'] }),
  });
}
