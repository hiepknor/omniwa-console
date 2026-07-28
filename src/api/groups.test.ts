import { describe, expect, it, vi } from 'vitest';
import type { ApiClient } from './client';
import { getGroup, listInstanceGroups, updateGroupDescription, updateGroupName } from './groups';

function ok(data: unknown) {
  return { data, response: new Response(null, { status: 200 }) };
}

const projectedGroup = {
  JID: '120363000000000000@g.us',
  Name: 'Operations',
  Topic: 'Incidents',
  IsAnnounce: true,
  IsParent: false,
  LinkedParentJID: '120363999999999999@g.us',
  ParticipantCount: 8,
  OwnerPN: '15551230000@s.whatsapp.net',
  GroupCreated: '2026-07-20T08:00:00Z',
  NameSetAt: '2026-07-21T08:00:00Z',
  TopicSetAt: '2026-07-22T08:00:00Z',
  Suspended: false,
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
      adminCount: 1,
      announce: true,
      groupType: 'subgroup',
      sendMode: 'admins_only',
      memberCount: 8,
      ownerRef: '15551230000@s.whatsapp.net',
      parentGroupId: '120363999999999999@g.us',
      status: 'active',
      updatedAt: '2026-07-22T08:00:00Z',
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

  it('uses the bounded search directory for an empty paged query', async () => {
    const GET = vi.fn().mockResolvedValue(ok({ message: 'success', data: [], meta: { syncStatus: 'ready' } }));
    await listInstanceGroups({ GET } as unknown as ApiClient, 'instance-a', { limit: 50, paged: true });
    expect(GET).toHaveBeenCalledWith('/group/search', {
      params: { query: { q: '', limit: 50, cursor: undefined } },
    });
  });

  it('keeps the historical raw list response compatible without inventing readiness', async () => {
    const GET = vi.fn().mockResolvedValue(ok([projectedGroup]));

    const result = await listInstanceGroups({ GET } as unknown as ApiClient, 'instance-a');

    expect(result.meta).toBeUndefined();
    expect(result.resource?.items).toHaveLength(1);
    expect(result.resource?.pagination).toEqual({ nextCursor: null, hasMore: false });
  });

  it('does not convert omitted projected facts into active, ordinary, or disabled values', async () => {
    const GET = vi.fn().mockResolvedValue(ok({ message: 'success', data: [{ JID: 'unknown@g.us' }], meta: { syncStatus: 'ready' } }));
    const result = await listInstanceGroups({ GET } as unknown as ApiClient);
    expect(result.resource?.items[0]).toEqual(expect.objectContaining({
      id: 'unknown@g.us',
      groupType: undefined,
      status: undefined,
      adminsOnlyAdd: undefined,
      memberCount: undefined,
      adminCount: undefined,
    }));
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

  it('drops malformed rows without a stable group identity', async () => {
    const GET = vi.fn().mockResolvedValue(ok({ message: 'success', data: [{ Name: 'Missing JID' }, projectedGroup], meta: { syncStatus: 'ready' } }));
    const result = await listInstanceGroups({ GET } as unknown as ApiClient);
    expect(result.resource?.items.map((group) => group.id)).toEqual([projectedGroup.JID]);
  });

  it('submits subject and description as independent commands', async () => {
    const POST = vi.fn().mockResolvedValue(ok({ message: 'success' }));
    const client = { POST } as unknown as ApiClient;

    await updateGroupName(client, projectedGroup.JID, 'New name');
    expect(POST).toHaveBeenLastCalledWith('/group/name', { body: { groupJid: projectedGroup.JID, name: 'New name' } });

    await updateGroupDescription(client, projectedGroup.JID, 'New description');
    expect(POST).toHaveBeenLastCalledWith('/group/description', { body: { groupJid: projectedGroup.JID, description: 'New description' } });
    expect(POST).toHaveBeenCalledTimes(2);
  });
});
