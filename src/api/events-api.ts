import type { ApiClient } from './client';
import type { components } from './generated/schema';
import {
  ApiFailure,
  parseUnavailableRead,
  pickResources,
  type CollectionEnvelope,
  type ErrorEnvelope,
  type UnavailableRead,
} from './envelopes';

export type EventResource = components['schemas']['EventResource'];
export type AuditRecordResource = components['schemas']['AuditRecordResource'];
export type EventsPagination = CollectionEnvelope['meta']['pagination'];
export type ReadResult<T> = { resource?: T; unavailable?: UnavailableRead };

function unavailableOrThrow(result: { error?: unknown; response: Response }): UnavailableRead {
  const unavailable = parseUnavailableRead(result.error);
  if (unavailable !== undefined) return unavailable;
  throw new ApiFailure(result.error as ErrorEnvelope | undefined, result.response.status);
}

export async function listEvents(
  client: ApiClient,
  params: { cursor?: string; limit?: number } = {},
): Promise<ReadResult<{ items: EventResource[]; pagination: EventsPagination }>> {
  const result = await client.GET('/v1/events', {
    params: { query: { cursor: params.cursor, limit: params.limit ?? 100 } },
  });
  if (result.data !== undefined) {
    return {
      resource: {
        items: pickResources(result.data.data, 'event'),
        pagination: result.data.meta.pagination,
      },
    };
  }
  return { unavailable: unavailableOrThrow(result) };
}

export async function listAuditRecords(
  client: ApiClient,
  params: { cursor?: string; limit?: number } = {},
): Promise<ReadResult<{ items: AuditRecordResource[]; pagination: EventsPagination }>> {
  const result = await client.GET('/v1/audit-records', {
    params: { query: { cursor: params.cursor, limit: params.limit ?? 50 } },
  });
  if (result.data !== undefined) {
    return {
      resource: {
        items: pickResources(result.data.data, 'auditRecord'),
        pagination: result.data.meta.pagination,
      },
    };
  }
  return { unavailable: unavailableOrThrow(result) };
}
