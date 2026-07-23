import { describe, expect, it, vi } from 'vitest';
import type { ApiClient } from './client';
import { getOverview, getServerHealth } from './overview';

function ok(data: unknown) {
  return { data, response: new Response(null, { status: 200 }) };
}

describe('persisted overview adapters', () => {
  it('preserves explicit scope, window, and projection counters', async () => {
    const GET = vi.fn().mockResolvedValue(ok({ message: 'success', data: {
      generatedAt: '2026-07-23T01:00:00Z',
      scope: { type: 'server' },
      window: { start: '2026-07-22T01:00:00Z', end: '2026-07-23T01:00:00Z', durationSeconds: 86_400 },
      instances: { total: 2, connected: 1, disconnected: 1 },
      projections: { groups: 3, contacts: 4, chats: 5, messages: 6, events: 7 },
      messages: { total: 6, incoming: 4, outgoing: 2 },
    } }));
    const result = await getOverview({ GET } as unknown as ApiClient, '24h');
    expect(GET).toHaveBeenCalledWith('/server/overview', { params: { query: { window: '24h' } } });
    expect(result).toEqual(expect.objectContaining({
      scope: { type: 'server', instanceId: undefined },
      window: expect.objectContaining({ durationSeconds: 86_400 }),
      instances: { total: 2, connected: 1, disconnected: 1 },
      messages: { total: 6, incoming: 4, outgoing: 2 },
    }));
  });

  it('keeps API, connection, projection, and throttling independent', async () => {
    const GET = vi.fn().mockResolvedValue(ok({ message: 'success', data: {
      generatedAt: '2026-07-23T01:00:00Z',
      api: { status: 'healthy' },
      instances: [{
        instanceId: 'instance-1',
        connection: { status: 'disconnected', connected: false },
        projection: { status: 'degraded', total: 2, byStatus: { ready: 1, stale: 1 }, resources: [{ resource: 'groups', syncStatus: 'stale', eventLagSeconds: 12 }] },
        throttling: { status: 'throttled', observed: true, circuitState: 'open', retryAfterSeconds: 45, openUntil: '2026-07-23T01:00:45Z' },
      }],
    } }));
    const result = await getServerHealth({ GET } as unknown as ApiClient);
    expect(GET).toHaveBeenCalledWith('/server/health');
    expect(result.api.status).toBe('healthy');
    expect(result.instances[0]).toEqual(expect.objectContaining({
      connection: { status: 'disconnected', connected: false },
      projection: expect.objectContaining({ status: 'degraded', total: 2 }),
      throttling: expect.objectContaining({ status: 'throttled', circuitState: 'open', retryAfterSeconds: 45 }),
    }));
  });

  it('does not pass through unknown provider or storage fields', async () => {
    const GET = vi.fn().mockResolvedValue(ok({ message: 'success', data: {
      api: { status: 'healthy', databaseDsn: 'secret' },
      instances: [{ instanceId: 'instance-1', token: 'secret', connection: {}, projection: {}, throttling: {} }],
    } }));
    const result = await getServerHealth({ GET } as unknown as ApiClient);
    expect(result.api).not.toHaveProperty('databaseDsn');
    expect(result.instances[0]).not.toHaveProperty('token');
  });
});
