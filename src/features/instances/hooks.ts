import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi, useSetInstanceCredential } from '@/api/ApiProvider';
import type { ApiClient } from '@/api/client';
import type { CommandResult } from '@/api/envelopes';
import {
  connectInstance,
  createInstance,
  destroyInstance,
  disconnectInstance,
  getAdvancedSettings,
  getInstance,
  getInstanceCredentialHealth,
  getInstanceQr,
  getInstanceStatus,
  listInstances,
  logoutInstance,
  reconnectInstance,
  rotateInstanceToken,
  updateAdvancedSettings,
  type CompleteInstanceAdvancedSettings,
  type InstanceCreateRequest,
} from '@/api/instances';
import { instanceKeys, queryKeys } from '@/api/keys';
import { useInstanceClient } from '@/api/useInstanceClient';
import { CREDENTIAL_HEALTH_STALE_TIME, FLEET_STALE_TIME, pollingWhen, QUERY_INTERVALS } from '@/lib/query-policy';
import { clearInstanceCredentialCache } from './credential-cache';

export function useInstances(enabled: boolean, metadata: boolean) {
  const client = useApi();
  return useQuery({
    queryKey: queryKeys.instances({ metadata }),
    queryFn: () => listInstances(client, { metadata }),
    enabled,
    staleTime: FLEET_STALE_TIME,
    refetchInterval: pollingWhen(enabled, QUERY_INTERVALS.fleet),
  });
}

export function useInstance(instanceId: string | undefined, enabled: boolean, metadata: boolean) {
  const client = useApi();
  return useQuery({
    queryKey: queryKeys.instanceMetadata(instanceId ?? '', metadata),
    queryFn: () => getInstance(client, instanceId ?? '', metadata),
    enabled: enabled && instanceId !== undefined,
    staleTime: FLEET_STALE_TIME,
    refetchInterval: pollingWhen(enabled && Boolean(instanceId), QUERY_INTERVALS.fleet),
  });
}

export function useCredentialHealth(enabled: boolean) {
  const client = useApi();
  return useQuery({
    queryKey: queryKeys.instanceCredentialHealth,
    queryFn: () => getInstanceCredentialHealth(client),
    enabled,
    staleTime: CREDENTIAL_HEALTH_STALE_TIME,
  });
}

function useInvalidateInstance() {
  const queryClient = useQueryClient();
  return async (instanceId?: string) => {
    await queryClient.invalidateQueries({ queryKey: instanceKeys.root });
    if (instanceId) await queryClient.invalidateQueries({ queryKey: queryKeys.instance(instanceId) });
  };
}

export function useCreateInstance() {
  const client = useApi();
  const invalidate = useInvalidateInstance();
  const setCredential = useSetInstanceCredential();
  return useMutation({
    mutationFn: (body: InstanceCreateRequest) => createInstance(client, body),
    onSuccess: (result) => {
      setCredential(result.instanceId, result.token);
      return invalidate(result.instanceId);
    },
  });
}

export function useDestroyInstance(instanceId: string) {
  const client = useApi();
  const queryClient = useQueryClient();
  const invalidate = useInvalidateInstance();
  const setCredential = useSetInstanceCredential();
  return useMutation({
    mutationFn: () => destroyInstance(client, instanceId),
    onSuccess: () => {
      clearInstanceCredentialCache(queryClient, instanceId);
      setCredential(instanceId, undefined);
      return invalidate(instanceId);
    },
  });
}

export function useRotateInstanceToken(instanceId: string) {
  const client = useApi();
  const queryClient = useQueryClient();
  const invalidate = useInvalidateInstance();
  const setCredential = useSetInstanceCredential();
  return useMutation({
    mutationFn: ({ expectedVersion, reason }: { expectedVersion: number; reason: string }) =>
      rotateInstanceToken(client, instanceId, expectedVersion, reason),
    onSuccess: (result) => {
      clearInstanceCredentialCache(queryClient, instanceId);
      setCredential(instanceId, result.token);
      return invalidate(instanceId);
    },
  });
}

function useScopedCommand(instanceId: string, token: string | undefined, command: (client: ApiClient) => Promise<CommandResult>) {
  const client = useInstanceClient(token);
  const invalidate = useInvalidateInstance();
  return useMutation({
    mutationFn: () => {
      if (!client) throw new Error('Attach an instance token before submitting this command.');
      return command(client);
    },
    onSuccess: () => invalidate(instanceId),
  });
}

export function useInstanceStatus(instanceId: string, token: string | undefined) {
  const client = useInstanceClient(token);
  return useQuery({
    queryKey: queryKeys.instanceStatus(instanceId),
    queryFn: () => {
      if (!client) throw new Error('Instance token is not attached.');
      return getInstanceStatus(client);
    },
    enabled: client !== undefined,
    refetchInterval: pollingWhen(Boolean(client), QUERY_INTERVALS.fleet),
  });
}

export function useInstanceQr(instanceId: string, token: string | undefined, enabled: boolean) {
  const client = useInstanceClient(token);
  return useQuery({
    queryKey: queryKeys.instanceQr(instanceId),
    queryFn: () => {
      if (!client) throw new Error('Instance token is not attached.');
      return getInstanceQr(client);
    },
    enabled: enabled && client !== undefined,
    refetchInterval: pollingWhen(enabled && Boolean(client), QUERY_INTERVALS.qr),
  });
}

export function useConnectInstance(instanceId: string, token: string | undefined) {
  return useScopedCommand(instanceId, token, connectInstance);
}
export function useDisconnectInstance(instanceId: string, token: string | undefined) {
  return useScopedCommand(instanceId, token, disconnectInstance);
}
export function useReconnectInstance(instanceId: string, token: string | undefined) {
  return useScopedCommand(instanceId, token, reconnectInstance);
}
export function useLogoutInstance(instanceId: string, token: string | undefined) {
  return useScopedCommand(instanceId, token, logoutInstance);
}

export function useAdvancedSettings(instanceId: string, token: string | undefined) {
  const client = useInstanceClient(token);
  return useQuery({
    queryKey: queryKeys.instanceAdvancedSettings(instanceId),
    queryFn: () => {
      if (!client) throw new Error('Instance token is not attached.');
      return getAdvancedSettings(client, instanceId);
    },
    enabled: client !== undefined,
  });
}

export function useUpdateAdvancedSettings(instanceId: string, token: string | undefined) {
  const client = useInstanceClient(token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CompleteInstanceAdvancedSettings) => {
      if (!client) throw new Error('Attach an instance token before updating settings.');
      return updateAdvancedSettings(client, instanceId, body);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.instanceAdvancedSettings(instanceId) }),
  });
}
