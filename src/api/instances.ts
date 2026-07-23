import type { ApiClient } from './client';
import type { components } from './generated/schema';
import { unwrap, unwrapCommand, type CommandResult, type UnavailableRead } from './envelopes';

type GoInstance = components['schemas']['pkg_instance_handler.InstanceView'];
type MetadataInstance = components['schemas']['pkg_instance_handler.InstanceMetadataView'];
type GoStatus = components['schemas']['apidocs.StatusData'];
type GoQr = components['schemas']['apidocs.QRCodeData'];
type GoAdvancedSettings = components['schemas']['github_com_evolution-foundation_evolution-go_pkg_instance_model.AdvancedSettings'];
type RotationPayload = components['schemas']['github_com_evolution-foundation_evolution-go_pkg_instance_credential.RotationResult'];
type CredentialHealthPayload = components['schemas']['github_com_evolution-foundation_evolution-go_pkg_instance_credential.CredentialHealth'];

export type InstanceStatus = 'connected' | 'disconnected';

/**
 * Console-facing instance shape, adapted from omniwa-go's whatsmeow-shaped
 * `Instance`. `token` is the per-instance apikey used to build a client for the
 * token-scoped routes (`/instance/connect·qr·status·disconnect·reconnect`).
 */
export type InstanceResource = {
  id: string;
  displayName?: string;
  status: InstanceStatus;
  connected: boolean;
  jid?: string;
  credentialVersion?: number;
  webhook?: string;
  createdAt?: string;
  /** omniwa-go has no update timestamp; kept optional for shared table compatibility. */
  updatedAt?: string;
};

export type InstanceStatusResource = { connected: boolean; loggedIn: boolean; name?: string };
export type InstanceQr = { qrcode?: string; code?: string };
export type InstanceAdvancedSettings = {
  alwaysOnline: boolean;
  readMessages: boolean;
  rejectCall: boolean;
  ignoreGroups: boolean;
  ignoreStatus: boolean;
  msgRejectCall: string;
};
export type InstanceCreateRequest = { name?: string };
export type InstanceCredentialSecret = { instanceId: string; token: string; credentialVersion: number; rotatedAt?: string };
export type InstanceCredentialHealth = {
  generatedAt?: string;
  currentKeyVersion: number;
  instances: { total: number; currentDigest: number; plaintextOnly: number; otherKeyVersion: number };
  plaintextFallback: { lookups: number; affectedInstances: number; firstObservedAt?: string; lastObservedAt?: string };
};

export type InstancePagination = { nextCursor?: string | null; hasMore?: boolean };
export type ReadResult<T> = { resource?: T; unavailable?: UnavailableRead };
export type InstanceListPage = { items: InstanceResource[]; pagination: InstancePagination };

const NO_PAGINATION: InstancePagination = { nextCursor: null, hasMore: false };

function toInstance(raw: GoInstance | MetadataInstance): InstanceResource {
  const connected = raw.connected ?? false;
  return {
    id: raw.id ?? '',
    displayName: raw.name || undefined,
    connected,
    status: connected ? 'connected' : 'disconnected',
    jid: raw.jid || undefined,
    credentialVersion: 'credentialVersion' in raw ? raw.credentialVersion : undefined,
    webhook: raw.webhook || undefined,
    createdAt: raw.createdAt || undefined,
  };
}

// --- Global-key (admin) operations: the session client -----------------------

export async function listInstances(
  client: ApiClient,
  params: { cursor?: string; limit?: number; metadata?: boolean } = {},
): Promise<ReadResult<InstanceListPage>> {
  const data = params.metadata
    ? unwrap<MetadataInstance[]>(await client.GET('/instance/metadata'))
    : unwrap<GoInstance[]>(await client.GET('/instance/all'));
  return {
    resource: {
      items: (data ?? []).filter((instance) => Boolean(instance.id?.trim())).map(toInstance),
      pagination: NO_PAGINATION,
    },
  };
}

export async function getInstance(client: ApiClient, instanceId: string, metadata = false): Promise<ReadResult<InstanceResource>> {
  const data = metadata
    ? unwrap<MetadataInstance>(await client.GET('/instance/metadata/{instanceId}', { params: { path: { instanceId } } }))
    : unwrap<GoInstance>(await client.GET('/instance/info/{instanceId}', { params: { path: { instanceId } } }));
  return { resource: data?.id?.trim() ? toInstance(data) : undefined };
}

export async function createInstance(client: ApiClient, body: InstanceCreateRequest): Promise<CommandResult & { instanceId: string; token: string }> {
  // omniwa-go requires a UUID `instanceId` (the primary key) and a `token` (the
  // per-instance apikey); both are generated here rather than entered by hand.
  const instanceId = crypto.randomUUID();
  const token = crypto.randomUUID();
  const command = unwrapCommand(
    await client.POST('/instance/create', { body: { instanceId, token, name: body.name || instanceId } }),
  );
  return { ...command, instanceId, token };
}

export async function destroyInstance(client: ApiClient, instanceId: string): Promise<CommandResult> {
  return unwrapCommand(await client.DELETE('/instance/delete/{instanceId}', { params: { path: { instanceId } } }));
}

export async function rotateInstanceToken(client: ApiClient, instanceId: string, expectedVersion: number, reason: string): Promise<InstanceCredentialSecret> {
  const data = unwrap<RotationPayload>(await client.POST('/instance/rotate-token/{instanceId}', {
    params: { path: { instanceId } }, body: { expectedVersion, reason },
  }));
  if (!data?.instanceId || !data.token || !data.credentialVersion) throw new Error('Token rotation response is incomplete');
  return { instanceId: data.instanceId, token: data.token, credentialVersion: data.credentialVersion, rotatedAt: data.rotatedAt };
}

export async function getInstanceCredentialHealth(client: ApiClient): Promise<InstanceCredentialHealth> {
  const data = unwrap<CredentialHealthPayload>(await client.GET('/instance/credential-health'));
  return {
    generatedAt: data?.generatedAt,
    currentKeyVersion: data?.currentKeyVersion ?? 0,
    instances: {
      total: data?.instances?.total ?? 0,
      currentDigest: data?.instances?.currentDigest ?? 0,
      plaintextOnly: data?.instances?.plaintextOnly ?? 0,
      otherKeyVersion: data?.instances?.otherKeyVersion ?? 0,
    },
    plaintextFallback: {
      lookups: data?.plaintextFallback?.lookups ?? 0,
      affectedInstances: data?.plaintextFallback?.affectedInstances ?? 0,
      firstObservedAt: data?.plaintextFallback?.firstObservedAt,
      lastObservedAt: data?.plaintextFallback?.lastObservedAt,
    },
  };
}

// --- Token-scoped operations: a per-instance client (built from `token`) ------

export async function getInstanceStatus(client: ApiClient): Promise<InstanceStatusResource> {
  const data = unwrap<GoStatus>(await client.GET('/instance/status'));
  return { connected: data?.Connected ?? false, loggedIn: data?.LoggedIn ?? false, name: data?.Name || undefined };
}

export async function getInstanceQr(client: ApiClient): Promise<InstanceQr> {
  const data = unwrap<GoQr>(await client.GET('/instance/qr'));
  return { qrcode: data?.qrcode || undefined, code: data?.code || undefined };
}

export async function connectInstance(client: ApiClient, opts: { immediate?: boolean } = {}): Promise<CommandResult> {
  return unwrapCommand(await client.POST('/instance/connect', { body: { immediate: opts.immediate ?? true } }));
}

export async function disconnectInstance(client: ApiClient): Promise<CommandResult> {
  return unwrapCommand(await client.POST('/instance/disconnect'));
}

export async function reconnectInstance(client: ApiClient): Promise<CommandResult> {
  return unwrapCommand(await client.POST('/instance/reconnect'));
}

export async function logoutInstance(client: ApiClient): Promise<CommandResult> {
  return unwrapCommand(await client.DELETE('/instance/logout'));
}

function toAdvancedSettings(raw: GoAdvancedSettings | undefined): InstanceAdvancedSettings {
  return {
    alwaysOnline: raw?.alwaysOnline ?? false,
    readMessages: raw?.readMessages ?? false,
    rejectCall: raw?.rejectCall ?? false,
    ignoreGroups: raw?.ignoreGroups ?? false,
    ignoreStatus: raw?.ignoreStatus ?? false,
    msgRejectCall: raw?.msgRejectCall ?? '',
  };
}

export async function getAdvancedSettings(client: ApiClient, instanceId: string): Promise<InstanceAdvancedSettings> {
  // Returns the raw AdvancedSettings object (no {message,data} envelope).
  const data = unwrap<GoAdvancedSettings>(
    await client.GET('/instance/{instanceId}/advanced-settings', { params: { path: { instanceId } } }),
  );
  return toAdvancedSettings(data);
}

export async function updateAdvancedSettings(
  client: ApiClient,
  instanceId: string,
  body: InstanceAdvancedSettings,
): Promise<CommandResult> {
  return unwrapCommand(
    await client.PUT('/instance/{instanceId}/advanced-settings', { params: { path: { instanceId } }, body }),
  );
}
