import type { ApiClient } from './client';
import type { components } from './generated/schema';
import {
  ApiFailure,
  parseUnavailableRead,
  pickResource,
  unwrapCommand,
  type ErrorEnvelope,
  type UnavailableRead,
} from './envelopes';

export type SettingsResource = components['schemas']['SettingsResource'];
export type ReadResult<T> = { resource?: T; unavailable?: UnavailableRead };

function unavailableOrThrow(result: { error?: unknown; response: Response }): UnavailableRead {
  const unavailable = parseUnavailableRead(result.error);
  if (unavailable !== undefined) return unavailable;
  throw new ApiFailure(result.error as ErrorEnvelope | undefined, result.response.status);
}

function idempotencyKey(action: string): string {
  return `console-${action}-${crypto.randomUUID()}`;
}

export async function getSettings(
  client: ApiClient,
): Promise<ReadResult<SettingsResource>> {
  const result = await client.GET('/v1/settings');
  if (result.data !== undefined) {
    return { resource: pickResource(result.data.data, 'settings') };
  }
  return { unavailable: unavailableOrThrow(result) };
}

export async function validateSettings(
  client: ApiClient,
  body: Record<string, unknown>,
) {
  return unwrapCommand(await client.POST('/v1/settings/validate', { body }));
}

export async function activateSettings(client: ApiClient, body: Record<string, unknown>) {
  const result = await client.POST('/v1/settings/activate', {
    params: { header: { 'idempotency-key': idempotencyKey('activate-settings') } },
    body,
  });
  return unwrapCommand(result);
}
