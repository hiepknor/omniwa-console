import type { ApiClient } from './client';
import type { components } from './generated/platform-schema';
import { notImplemented, type CollectionEnvelope, type UnavailableRead } from './envelopes';

// omniwa-go has no event-history or audit-record REST surface (realtime is
// WebSocket-only and is disabled in this client). This panel is stubbed.
export type EventResource = components['schemas']['EventResource'];
export type AuditRecordResource = components['schemas']['AuditRecordResource'];
export type EventsPagination = CollectionEnvelope['meta']['pagination'];
export type ReadResult<T> = { resource?: T; unavailable?: UnavailableRead };

export async function listEvents(
  _client: ApiClient,
  _params: { cursor?: string; limit?: number } = {},
): Promise<ReadResult<{ items: EventResource[]; pagination: EventsPagination }>> {
  throw notImplemented('Events');
}

export async function listAuditRecords(
  _client: ApiClient,
  _params: { cursor?: string; limit?: number } = {},
): Promise<ReadResult<{ items: AuditRecordResource[]; pagination: EventsPagination }>> {
  throw notImplemented('Audit records');
}
