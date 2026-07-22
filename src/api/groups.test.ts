import { describe, expect, it, vi } from 'vitest';
import type { ApiClient } from './client';
import { getGroup, listInstanceGroups } from './groups';

function ok(data: unknown) {
  return { data, response: new Response(null, { status: 200 }) };
}

const projectedGroup = {
  JID: '120363000000000000@g.us',
  Name: 'Operations',
  Topic: 'Incidents',
  IsAnnounce: true,
  Participants: [
    { JID: '100@s.whatsapp.net', IsSuperAdmin: true },
    { JID: '200@s.whatsapp.net' },
  ],
};

describe('group projection adapter', () => {
  it('preserves list freshness metadata and maps normalized resources', async () => {
    const GET = vi.fn().mockResolvedValue(ok({
      message: 'success',
      data: [projectedGroup],
      meta: { source: 'projection', syncStatus: 'stale', lastSyncedAt: '2026-07-22T08:00:00Z' },
    }));

    const result = await listInstanceGroups({ GET } as unknown as ApiClient, 'instance-a');

    expect(GET).toHaveBeenCalledWith('/group/list');
    expect(result.meta).toEqual({
      source: 'projection',
      syncStatus: 'stale',
      lastSyncedAt: '2026-07-22T08:00:00Z',
      nextCursor: undefined,
    });
    expect(result.resource?.items).toEqual([expect.objectContaining({
      id: projectedGroup.JID,
      subject: 'Operations',
      description: 'Incidents',
      memberCount: 2,
      adminCount: 1,
      announce: true,
    })]);
  });

  it('sends trimmed prefix search and opaque cursor to the projection endpoint', async () => {
    const GET = vi.fn().mockResolvedValue(ok({
      message: 'success',
      data: [projectedGroup],
      meta: { source: 'projection', syncStatus: 'ready', nextCursor: 'opaque.next/value' },
    }));

    const result = await listInstanceGroups({ GET } as unknown as ApiClient, 'instance-a', {
      search: '  Oper  ',
      cursor: 'opaque.current/value',
      limit: 25,
    });

    expect(GET).toHaveBeenCalledWith('/group/search', {
      params: { query: { q: 'Oper', limit: 25, cursor: 'opaque.current/value' } },
    });
    expect(result.resource?.pagination).toEqual({
      nextCursor: 'opaque.next/value',
      hasMore: true,
    });
  });

  it('keeps the legacy raw list response compatible without inventing readiness', async () => {
    const GET = vi.fn().mockResolvedValue(ok([projectedGroup]));

    const result = await listInstanceGroups({ GET } as unknown as ApiClient, 'instance-a');

    expect(result.meta).toBeUndefined();
    expect(result.resource?.items).toHaveLength(1);
    expect(result.resource?.pagination).toEqual({ nextCursor: null, hasMore: false });
  });

  it('preserves group-detail projection metadata', async () => {
    const POST = vi.fn().mockResolvedValue(ok({
      message: 'success',
      data: projectedGroup,
      meta: { source: 'projection', syncStatus: 'syncing' },
    }));

    const result = await getGroup({ POST } as unknown as ApiClient, projectedGroup.JID);

    expect(POST).toHaveBeenCalledWith('/group/info', { body: { groupJid: projectedGroup.JID } });
    expect(result.resource?.id).toBe(projectedGroup.JID);
    expect(result.meta?.syncStatus).toBe('syncing');
  });
});
