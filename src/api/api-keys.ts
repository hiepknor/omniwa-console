import type { ApiClient } from './client';
import type { components } from './generated/platform-schema';
import { notImplemented, NOT_IMPLEMENTED_READ, type CollectionEnvelope, type CommandResult, type UnavailableRead } from './envelopes';

// omniwa-go keys are static env (global key) plus per-instance tokens returned by
// `POST /instance/create`; there is no key provisioning/rotation API. Stubbed.
export type ApiKeyResource = components['schemas']['ApiKeyResource'];
export type ApiKeyLifecycleOperationData = components['schemas']['ApiKeyLifecycleOperationData'];
export type ApiKeyProvisionRequest = components['schemas']['ApiKeyProvisionRequest'];
export type ApiKeyRotationRequest = components['schemas']['ApiKeyRotationRequest'];
export type ApiKeyRevocationRequest = components['schemas']['ApiKeyRevocationRequest'];
export type ApiKeyPagination = CollectionEnvelope['meta']['pagination'];
export type ReadResult<T> = { resource?: T; unavailable?: UnavailableRead };
export type ApiKeyCommandResult = CommandResult & {
  lifecycle?: ApiKeyLifecycleOperationData;
};

export type ApiKeyListPage = {
  items: ApiKeyResource[];
  pagination: ApiKeyPagination;
};

export async function listApiKeys(
  _client: ApiClient,
  _params: { cursor?: string; limit?: number; sort?: string } = {},
): Promise<ReadResult<ApiKeyListPage>> {
  return { unavailable: NOT_IMPLEMENTED_READ };
}

export async function provisionApiKey(_client: ApiClient, _body: ApiKeyProvisionRequest): Promise<ApiKeyCommandResult> {
  throw notImplemented('API key provisioning');
}

export async function rotateApiKey(
  _client: ApiClient,
  _keyId: string,
  _body: ApiKeyRotationRequest,
): Promise<ApiKeyCommandResult> {
  throw notImplemented('API key rotation');
}

export async function revokeApiKey(
  _client: ApiClient,
  _keyId: string,
  _body: ApiKeyRevocationRequest = {},
): Promise<ApiKeyCommandResult> {
  throw notImplemented('API key revocation');
}
