import type { ApiClient } from './client';
import type { components } from './generated/schema';
import {
  ApiFailure,
  parseUnavailableRead,
  pickResources,
  unwrap,
  type CollectionEnvelope,
  type ErrorEnvelope,
  type PublicData,
  type UnavailableRead,
} from './envelopes';

export type ApiKeyResource = components['schemas']['ApiKeyResource'];
export type ApiKeyLifecycleOperationData =
  components['schemas']['ApiKeyLifecycleOperationData'];
export type ApiKeyProvisionRequest = components['schemas']['ApiKeyProvisionRequest'];
export type ApiKeyRotationRequest = components['schemas']['ApiKeyRotationRequest'];
export type ApiKeyRevocationRequest = components['schemas']['ApiKeyRevocationRequest'];
export type ApiKeyPagination = CollectionEnvelope['meta']['pagination'];
export type ReadResult<T> = { resource?: T; unavailable?: UnavailableRead };

export type ApiKeyListPage = {
  items: ApiKeyResource[];
  pagination: ApiKeyPagination;
};

function unavailableOrThrow(result: { error?: unknown; response: Response }): UnavailableRead {
  const unavailable = parseUnavailableRead(result.error);
  if (unavailable !== undefined) return unavailable;
  throw new ApiFailure(result.error as ErrorEnvelope | undefined, result.response.status);
}

function lifecycleOperationFrom(
  data: PublicData | undefined,
): ApiKeyLifecycleOperationData | undefined {
  if (data?.resourceType !== 'apiKey' || !('operationStatus' in data)) return undefined;
  return data as ApiKeyLifecycleOperationData;
}

export async function listApiKeys(
  client: ApiClient,
  params: { cursor?: string; limit?: number; sort?: string } = {},
): Promise<ReadResult<ApiKeyListPage>> {
  const result = await client.GET('/v1/api-keys', {
    params: {
      query: { cursor: params.cursor, limit: params.limit ?? 50, sort: params.sort },
    },
  });
  if (result.data !== undefined) {
    return {
      resource: {
        items: pickResources(result.data.data, 'apiKey').filter(
          (item): item is ApiKeyResource => 'id' in item,
        ),
        pagination: result.data.meta.pagination,
      },
    };
  }
  return { unavailable: unavailableOrThrow(result) };
}

export async function provisionApiKey(client: ApiClient, body: ApiKeyProvisionRequest) {
  const result = await client.POST('/v1/api-keys', { body });
  return lifecycleOperationFrom(unwrap(result).data);
}

export async function rotateApiKey(
  client: ApiClient,
  keyId: string,
  body: ApiKeyRotationRequest,
) {
  const result = await client.POST('/v1/api-keys/{keyId}/rotate', {
    params: { path: { keyId } },
    body,
  });
  return lifecycleOperationFrom(unwrap(result).data);
}

export async function revokeApiKey(
  client: ApiClient,
  keyId: string,
  body: ApiKeyRevocationRequest = {},
) {
  const result = await client.POST('/v1/api-keys/{keyId}/revoke', {
    params: { path: { keyId } },
    body,
  });
  return lifecycleOperationFrom(unwrap(result).data);
}
