import type { ApiClient } from './client';
import type { components } from './generated/platform-schema';
import { notImplemented, type CollectionEnvelope, type CommandResult, type UnavailableRead } from './envelopes';

// omniwa-go backs instances via `/instance/*` (flat routes, no cursor, no
// sessions/provider-capabilities). Wiring the instances feature to those
// endpoints is a follow-up; the module is stubbed for now.
export type InstanceResource = components['schemas']['InstanceResource'];
export type SessionResource = components['schemas']['SessionResource'];
export type ProviderResource = components['schemas']['ProviderResource'];
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

export async function listInstances(
  _client: ApiClient,
  _params: { cursor?: string; limit?: number } = {},
): Promise<ReadResult<InstanceListPage>> {
  throw notImplemented('Instances');
}

export async function getInstance(_client: ApiClient, _instanceId: string): Promise<ReadResult<InstanceResource>> {
  throw notImplemented('Instance detail');
}

export async function listInstanceSessions(
  _client: ApiClient,
  _instanceId: string,
  _params: { cursor?: string; limit?: number } = {},
): Promise<ReadResult<SessionListPage>> {
  throw notImplemented('Instance sessions');
}

export async function getProviderCapabilities(_client: ApiClient): Promise<ReadResult<ProviderResource>> {
  throw notImplemented('Provider capabilities');
}

export async function createInstance(_client: ApiClient, _body: InstanceCreateRequest): Promise<CommandResult> {
  throw notImplemented('Create instance');
}

export async function updateInstance(
  _client: ApiClient,
  _instanceId: string,
  _body: { displayName: string },
): Promise<CommandResult> {
  throw notImplemented('Update instance');
}

export async function connectInstance(_client: ApiClient, _instanceId: string): Promise<CommandResult> {
  throw notImplemented('Connect instance');
}

export async function disconnectInstance(_client: ApiClient, _instanceId: string): Promise<CommandResult> {
  throw notImplemented('Disconnect instance');
}

export async function destroyInstance(_client: ApiClient, _instanceId: string): Promise<CommandResult> {
  throw notImplemented('Destroy instance');
}

export async function requestInstanceReconnect(_client: ApiClient, _instanceId: string): Promise<CommandResult> {
  throw notImplemented('Reconnect instance');
}

export async function refreshInstanceQr(_client: ApiClient, _instanceId: string): Promise<CommandResult> {
  throw notImplemented('Refresh QR');
}

export async function refreshProviderCapabilities(_client: ApiClient): Promise<CommandResult> {
  throw notImplemented('Refresh provider capabilities');
}
