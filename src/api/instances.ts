import type { ApiClient } from './client';
import type { components } from './generated/schema';
import { unwrap, unwrapCommand, type CommandResult, type UnavailableRead } from './envelopes';

type GoInstance = components['schemas']['github_com_evolution-foundation_evolution-go_pkg_instance_model.Instance'];
type GoStatus = components['schemas']['apidocs.StatusData'];
type GoQr = components['schemas']['apidocs.QRCodeData'];

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
  token?: string;
  webhook?: string;
  createdAt?: string;
  /** omniwa-go has no update timestamp; kept optional for shared table compatibility. */
  updatedAt?: string;
};

export type InstanceStatusResource = { connected: boolean; loggedIn: boolean; name?: string };
export type InstanceQr = { qrcode?: string; code?: string };
export type InstanceCreateRequest = { name?: string };

export type InstancePagination = { nextCursor?: string | null; hasMore?: boolean };
export type ReadResult<T> = { resource?: T; unavailable?: UnavailableRead };
export type InstanceListPage = { items: InstanceResource[]; pagination: InstancePagination };

const NO_PAGINATION: InstancePagination = { nextCursor: null, hasMore: false };

function toInstance(raw: GoInstance): InstanceResource {
  const connected = raw.connected ?? false;
  return {
    id: raw.id ?? '',
    displayName: raw.name || undefined,
    connected,
    status: connected ? 'connected' : 'disconnected',
    jid: raw.jid || undefined,
    token: raw.token || undefined,
    webhook: raw.webhook || undefined,
    createdAt: raw.createdAt || undefined,
  };
}

// --- Global-key (admin) operations: the session client -----------------------

export async function listInstances(
  client: ApiClient,
  _params: { cursor?: string; limit?: number } = {},
): Promise<ReadResult<InstanceListPage>> {
  const data = unwrap<GoInstance[]>(await client.GET('/instance/all'));
  return { resource: { items: (data ?? []).map(toInstance), pagination: NO_PAGINATION } };
}

export async function getInstance(client: ApiClient, instanceId: string): Promise<ReadResult<InstanceResource>> {
  const data = unwrap<GoInstance>(
    await client.GET('/instance/info/{instanceId}', { params: { path: { instanceId } } }),
  );
  return { resource: data ? toInstance(data) : undefined };
}

export async function createInstance(client: ApiClient, body: InstanceCreateRequest): Promise<CommandResult> {
  // omniwa-go requires a UUID `instanceId` (the primary key) and a `token` (the
  // per-instance apikey); both are generated here rather than entered by hand.
  const instanceId = crypto.randomUUID();
  const token = crypto.randomUUID();
  return unwrapCommand(
    await client.POST('/instance/create', { body: { instanceId, token, name: body.name || instanceId } }),
  );
}

export async function destroyInstance(client: ApiClient, instanceId: string): Promise<CommandResult> {
  return unwrapCommand(await client.DELETE('/instance/delete/{instanceId}', { params: { path: { instanceId } } }));
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
