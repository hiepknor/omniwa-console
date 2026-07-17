import type { ApiClient } from './client';
import type { components } from './generated/schema';
import {
  ApiFailure,
  parseUnavailableRead,
  pickResource,
  pickResources,
  unwrap,
  type CollectionEnvelope,
  type ErrorEnvelope,
  type PublicData,
  type UnavailableRead,
} from './envelopes';

export type InstanceResource = components['schemas']['InstanceResource'];
export type SessionResource = components['schemas']['SessionResource'];
export type ProviderResource = components['schemas']['ProviderResource'];
export type OperationData = components['schemas']['OperationData'];
export type InstanceCreateRequest = components['schemas']['InstanceCreateRequest'];
export type InstancePagination = CollectionEnvelope['meta']['pagination'];
export type ReadResult<T> = { resource?: T; unavailable?: UnavailableRead };

export type InstanceListPage = {
  items: InstanceResource[];
  pagination: InstancePagination;
};

export type SessionListPage = {
  items: SessionResource[];
  pagination: InstancePagination;
};

function unavailableOrThrow(result: { error?: unknown; response: Response }): UnavailableRead {
  const unavailable = parseUnavailableRead(result.error);
  if (unavailable !== undefined) return unavailable;
  throw new ApiFailure(result.error as ErrorEnvelope | undefined, result.response.status);
}

function operationFrom(data: PublicData | undefined): OperationData | undefined {
  if (data === undefined || !('operationStatus' in data)) return undefined;
  return data as OperationData;
}

function idempotencyKey(action: string, resourceId?: string): string {
  return `console-${action}-${resourceId ?? 'new'}-${crypto.randomUUID()}`;
}

export async function listInstances(
  client: ApiClient,
  params: { cursor?: string; limit?: number } = {},
): Promise<ReadResult<InstanceListPage>> {
  const result = await client.GET('/v1/instances', {
    params: { query: { cursor: params.cursor, limit: params.limit ?? 50 } },
  });
  if (result.data !== undefined) {
    return {
      resource: {
        items: pickResources(result.data.data, 'instance'),
        pagination: result.data.meta.pagination,
      },
    };
  }
  return { unavailable: unavailableOrThrow(result) };
}

export async function getInstance(
  client: ApiClient,
  instanceId: string,
): Promise<ReadResult<InstanceResource>> {
  const result = await client.GET('/v1/instances/{instanceId}', {
    params: { path: { instanceId } },
  });
  if (result.data !== undefined) {
    return { resource: pickResource(result.data.data, 'instance') };
  }
  return { unavailable: unavailableOrThrow(result) };
}

export async function listInstanceSessions(
  client: ApiClient,
  instanceId: string,
  params: { cursor?: string; limit?: number } = {},
): Promise<ReadResult<SessionListPage>> {
  const result = await client.GET('/v1/instances/{instanceId}/sessions', {
    params: {
      path: { instanceId },
      query: { cursor: params.cursor, limit: params.limit ?? 20 },
    },
  });
  if (result.data !== undefined) {
    return {
      resource: {
        items: pickResources(result.data.data, 'session'),
        pagination: result.data.meta.pagination,
      },
    };
  }
  return { unavailable: unavailableOrThrow(result) };
}

export async function getProviderCapabilities(
  client: ApiClient,
): Promise<ReadResult<ProviderResource>> {
  const result = await client.GET('/v1/provider/capabilities');
  if (result.data !== undefined) {
    return { resource: pickResource(result.data.data, 'provider') };
  }
  return { unavailable: unavailableOrThrow(result) };
}

export async function createInstance(client: ApiClient, body: InstanceCreateRequest) {
  const result = await client.POST('/v1/instances', {
    params: { header: { 'idempotency-key': idempotencyKey('create') } },
    body,
  });
  return operationFrom(unwrap(result).data);
}

export async function updateInstance(
  client: ApiClient,
  instanceId: string,
  body: { displayName: string },
) {
  const result = await client.PATCH('/v1/instances/{instanceId}', {
    params: { path: { instanceId } },
    body,
  });
  return operationFrom(unwrap(result).data);
}

export async function connectInstance(client: ApiClient, instanceId: string) {
  const result = await client.POST('/v1/instances/{instanceId}/connect', {
    params: {
      path: { instanceId },
      header: { 'idempotency-key': idempotencyKey('connect', instanceId) },
    },
    body: {},
  });
  return operationFrom(unwrap(result).data);
}

export async function disconnectInstance(client: ApiClient, instanceId: string) {
  const result = await client.POST('/v1/instances/{instanceId}/disconnect', {
    params: {
      path: { instanceId },
      header: { 'idempotency-key': idempotencyKey('disconnect', instanceId) },
    },
    body: {},
  });
  return operationFrom(unwrap(result).data);
}

export async function destroyInstance(client: ApiClient, instanceId: string) {
  const result = await client.DELETE('/v1/instances/{instanceId}', {
    params: {
      path: { instanceId },
      header: { 'idempotency-key': idempotencyKey('destroy', instanceId) },
    },
  });
  return operationFrom(unwrap(result).data);
}

export async function requestInstanceReconnect(client: ApiClient, instanceId: string) {
  const result = await client.POST('/v1/instances/{instanceId}/reconnect', {
    params: { path: { instanceId } },
  });
  return unwrap(result);
}

export async function refreshInstanceQr(client: ApiClient, instanceId: string) {
  const result = await client.POST('/v1/instances/{instanceId}/qr/refresh', {
    params: {
      path: { instanceId },
      header: { 'idempotency-key': idempotencyKey('qr', instanceId) },
    },
    body: {},
  });
  return operationFrom(unwrap(result).data);
}

export async function refreshProviderCapabilities(client: ApiClient) {
  const result = await client.POST('/v1/provider/capabilities/refresh');
  return unwrap(result);
}
