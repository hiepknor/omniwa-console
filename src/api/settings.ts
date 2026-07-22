import type { ApiClient } from './client';
import type { components } from './generated/platform-schema';
import { notImplemented, NOT_IMPLEMENTED_READ, type CommandResult, type UnavailableRead } from './envelopes';

// omniwa-go has no global settings surface (only per-instance advanced settings).
export type SettingsResource = components['schemas']['SettingsResource'];
export type ReadResult<T> = { resource?: T; unavailable?: UnavailableRead };

export async function getSettings(_client: ApiClient): Promise<ReadResult<SettingsResource>> {
  return { unavailable: NOT_IMPLEMENTED_READ };
}

export async function validateSettings(
  _client: ApiClient,
  _body: Record<string, unknown>,
): Promise<CommandResult> {
  throw notImplemented('Settings validation');
}

export async function activateSettings(
  _client: ApiClient,
  _body: Record<string, unknown>,
): Promise<CommandResult> {
  throw notImplemented('Settings activation');
}
