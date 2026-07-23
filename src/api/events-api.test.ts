import { describe, expect, it, vi } from 'vitest';
import type { ApiClient } from './client';
import { ApiFailure } from './envelopes';
import { listEvents } from './events-api';

function ok(data: unknown) {
  return { data, response: new Response(null, { status: 200 }) };
}

describe('durable event history adapter', () => {
  it('normalizes safe history and preserves the opaque cursor and retention policy', async () => {
    const GET = vi.fn().mockResolvedValue(ok({
      message: 'success',
      data: [{
        id: 'event-1',
        type: 'Message',
        occurredAt: '2026-07-23T00:00:00Z',
        ingestedAt: '2026-07-23T00:00:01Z',
        summary: { messageId: 'message-1', success: true },
        providerPayload: { secret: true },
      }],
      meta: { source: 'projection', nextCursor: 'opaque/next', generatedAt: '2026-07-23T00:01:00Z', retentionSeconds: 2_592_000, backfill: true },
    }));
    const result = await listEvents({ GET } as unknown as ApiClient, { cursor: 'opaque/current', limit: 25, type: 'Message' });

    expect(GET).toHaveBeenCalledWith('/events', { params: { query: { cursor: 'opaque/current', limit: 25, type: 'Message' } } });
    expect(result.resource.items).toEqual([{
      resourceType: 'event',
      id: 'event-1',
      type: 'Message',
      occurredAt: '2026-07-23T00:00:00Z',
      ingestedAt: '2026-07-23T00:00:01Z',
      summary: { messageId: 'message-1', success: true },
    }]);
    expect(result.resource.items[0]).not.toHaveProperty('providerPayload');
    expect(result.resource.pagination.nextCursor).toBe('opaque/next');
    expect(result.meta).toEqual(expect.objectContaining({ source: 'projection', retentionSeconds: 2_592_000, backfill: false }));
  });

  it('drops malformed records instead of inventing durable identities', async () => {
    const GET = vi.fn().mockResolvedValue(ok({ message: 'success', data: [
      { id: '', type: 'Message', summary: {} },
      { id: 'event-2', type: '', summary: {} },
      { id: 'event-3', type: 'Receipt', summary: ['not', 'an', 'object'] },
    ], meta: { retentionSeconds: 60, backfill: false } }));

    const result = await listEvents({ GET } as unknown as ApiClient);
    expect(result.resource.items).toEqual([expect.objectContaining({ id: 'event-3', type: 'Receipt', summary: {} })]);
  });

  it('preserves the backend invalid-cursor failure for URL recovery', async () => {
    const GET = vi.fn().mockResolvedValue({
      error: { error: 'invalid event cursor', code: 'invalid_cursor' },
      response: new Response(null, { status: 400 }),
    });

    await expect(listEvents({ GET } as unknown as ApiClient, { cursor: 'expired' }))
      .rejects.toMatchObject({ code: 'invalid_cursor', category: 'validation' } satisfies Partial<ApiFailure>);
  });
});
