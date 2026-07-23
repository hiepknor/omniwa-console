import type { ApiClient } from './client';
import { ApiFailure } from './envelopes';
import type { components } from './generated/schema';

type EventPayload = components['schemas']['github_com_evolution-foundation_evolution-go_pkg_projection_service.DurableEventHistoryItem'];
type EventMetaPayload = components['schemas']['github_com_evolution-foundation_evolution-go_pkg_projection_service.DurableEventHistoryMeta'];

export type EventResource = {
  resourceType: 'event';
  id: string;
  type: string;
  occurredAt?: string;
  ingestedAt?: string;
  summary: Readonly<Record<string, unknown>>;
};

export type EventHistoryMeta = {
  source?: string;
  nextCursor?: string;
  generatedAt?: string;
  retentionSeconds?: number;
  backfill: false;
};

export type EventHistoryPage = {
  items: EventResource[];
  pagination: { nextCursor: string | null; hasMore: boolean };
};

export type EventHistoryResult = { resource: EventHistoryPage; meta: EventHistoryMeta };

type EventEnvelope = { message?: string; data?: EventPayload[]; meta?: EventMetaPayload };

function nonEmpty(value: string | undefined): string | undefined {
  return value?.trim() || undefined;
}

function normalizeSummary(value: EventPayload['summary']): Readonly<Record<string, unknown>> {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? { ...value } : {};
}

function toEvent(payload: EventPayload): EventResource | undefined {
  const id = nonEmpty(payload.id);
  const type = nonEmpty(payload.type);
  if (!id || !type) return undefined;
  return {
    resourceType: 'event',
    id,
    type,
    occurredAt: nonEmpty(payload.occurredAt),
    ingestedAt: nonEmpty(payload.ingestedAt),
    summary: normalizeSummary(payload.summary),
  };
}

export async function listEvents(
  client: ApiClient,
  params: { cursor?: string; limit?: number; type?: string } = {},
): Promise<EventHistoryResult> {
  const result = await client.GET('/events', {
    params: { query: { cursor: params.cursor, limit: params.limit ?? 100, type: nonEmpty(params.type) } },
  });
  if (result.data === undefined) {
    throw new ApiFailure(result.error, result.response.status, result.response.headers);
  }
  const envelope = result.data as EventEnvelope;
  const nextCursor = nonEmpty(envelope.meta?.nextCursor) ?? null;
  return {
    resource: {
      items: (envelope.data ?? []).map(toEvent).filter((item): item is EventResource => item !== undefined),
      pagination: { nextCursor, hasMore: nextCursor !== null },
    },
    meta: {
      source: nonEmpty(envelope.meta?.source),
      nextCursor: nextCursor ?? undefined,
      generatedAt: nonEmpty(envelope.meta?.generatedAt),
      retentionSeconds: typeof envelope.meta?.retentionSeconds === 'number' && envelope.meta.retentionSeconds > 0
        ? envelope.meta.retentionSeconds
        : undefined,
      // The backend contract deliberately promises no historical backfill.
      backfill: false,
    },
  };
}
