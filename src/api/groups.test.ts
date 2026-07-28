import { describe, expect, it, vi } from 'vitest';
import type { ApiClient } from './client';
import {
  addGroupMember,
  createGroup,
  getGroup,
  getGroupSummary,
  listGroupAudit,
  listGroupMembers,
  listInstanceGroups,
  updateGroupDescription,
  updateGroupName,
} from './groups';

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

    const result = await listInstanceGroups({ GET } as unknown as ApiClient, {}, false);

    expect(GET).toHaveBeenCalledWith('/group/search', expect.any(Object));
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

    const result = await listInstanceGroups({ GET } as unknown as ApiClient, {
      search: '  Oper  ',
      cursor: 'opaque.current/value',
      limit: 25,
    }, false);

    expect(GET).toHaveBeenCalledWith('/group/search', {
      params: { query: { q: 'Oper', type: undefined, myRole: undefined, sendMode: undefined, state: undefined, membershipState: undefined, limit: 25, cursor: 'opaque.current/value' } },
    });
    expect(result.resource?.pagination).toEqual({
      nextCursor: 'opaque.next/value',
      hasMore: true,
    });
  });

  it('uses the bounded search directory for an empty paged query', async () => {
    const GET = vi.fn().mockResolvedValue(ok({ message: 'success', data: [], meta: { syncStatus: 'ready' } }));
    await listInstanceGroups({ GET } as unknown as ApiClient, { limit: 50 }, false);
    expect(GET).toHaveBeenCalledWith('/group/search', {
      params: { query: { q: '', type: undefined, myRole: undefined, sendMode: undefined, state: undefined, membershipState: undefined, limit: 50, cursor: undefined } },
    });
  });

  it('keeps the historical raw list response compatible without inventing readiness', async () => {
    const GET = vi.fn().mockResolvedValue(ok([projectedGroup]));

    const result = await listInstanceGroups({ GET } as unknown as ApiClient, {}, false);

    expect(result.meta).toBeUndefined();
    expect(result.resource?.items).toHaveLength(1);
    expect(result.resource?.pagination).toEqual({ nextCursor: null, hasMore: false });
  });

  it('does not convert omitted projected facts into active, ordinary, or disabled values', async () => {
    const GET = vi.fn().mockResolvedValue(ok({ message: 'success', data: [{ JID: 'unknown@g.us' }], meta: { syncStatus: 'ready' } }));
    const result = await listInstanceGroups({ GET } as unknown as ApiClient, {}, false);
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

    const result = await getGroup({ POST } as unknown as ApiClient, projectedGroup.JID, false);

    expect(POST).toHaveBeenCalledWith('/group/info', { body: { groupJid: projectedGroup.JID } });
    expect(result.resource?.id).toBe(projectedGroup.JID);
    expect(result.meta?.syncStatus).toBe('syncing');
  });

  it('uses the normalized unfiltered directory without exposing participant aliases', async () => {
    const GET = vi.fn().mockResolvedValue(ok({
      message: 'success',
      data: [{ groupJid: 'group-1@g.us', name: 'Operations', type: 'group', state: 'active', myRole: 'admin' }],
      meta: { source: 'projection', syncStatus: 'ready', nextCursor: 'next:list' },
    }));

    const result = await listInstanceGroups({ GET } as unknown as ApiClient, { limit: 20 }, true);

    expect(GET).toHaveBeenCalledWith('/group/list', { params: { query: { limit: 20, cursor: undefined } } });
    expect(result.resource?.items[0]).toMatchObject({
      id: 'group-1@g.us', normalized: true, subject: 'Operations', myRole: 'admin', members: [],
    });
  });

  it('passes the complete normalized filter scope to search', async () => {
    const GET = vi.fn().mockResolvedValue(ok({ message: 'success', data: [], meta: { syncStatus: 'ready' } }));
    await listInstanceGroups({ GET } as unknown as ApiClient, {
      search: ' Ops ', type: 'subgroup', myRole: 'admin', sendMode: 'admins_only', state: 'active', membershipState: 'joined', cursor: 'opaque:2', limit: 100,
    }, true);
    expect(GET).toHaveBeenCalledWith('/group/search', { params: { query: {
      q: 'Ops', type: 'subgroup', myRole: 'admin', sendMode: 'admins_only', state: 'active', membershipState: 'joined', limit: 100, cursor: 'opaque:2',
    } } });
  });

  it('preserves tri-state detail decisions without inferring permissions', async () => {
    const POST = vi.fn().mockResolvedValue(ok({ message: 'success', data: {
      groupJid: 'group-1@g.us', name: 'Operations', myRole: 'owner',
      actions: {
        editName: { state: 'allowed', checkedAt: '2026-07-28T10:00:00Z' },
        removeMembers: { state: 'denied', reason: 'protected_member' },
        sendMessage: { state: 'unknown', reason: 'permission_unknown' },
      },
    }, meta: { syncStatus: 'ready' } }));

    const result = await getGroup({ POST } as unknown as ApiClient, 'group-1@g.us', true);
    expect(result.resource?.actions).toMatchObject({
      editName: { state: 'allowed' },
      removeMembers: { state: 'denied', reason: 'protected_member' },
      sendMessage: { state: 'unknown', reason: 'permission_unknown' },
    });
  });

  it('maps authoritative global summary independently from a directory page', async () => {
    const GET = vi.fn().mockResolvedValue(ok({ message: 'success', data: { total: 120, active: 105, communities: 4, updatedAt: '2026-07-28T10:00:00Z' }, meta: { syncStatus: 'ready' } }));
    const result = await getGroupSummary({ GET } as unknown as ApiClient);
    expect(GET).toHaveBeenCalledWith('/group/summary');
    expect(result.resource).toEqual(expect.objectContaining({ total: 120, active: 105, communities: 4 }));
  });

  it('maps member pages with opaque ids and advisory actions', async () => {
    const GET = vi.fn().mockResolvedValue(ok({ message: 'success', data: [{
      memberId: '927beb51-46c2-4331-b3b4-d96f67280bd3', displayName: 'Ann', role: 'member', membershipState: 'active', actions: { promote: { state: 'allowed' }, remove: { state: 'unknown', reason: 'permission_unknown' } },
    }], meta: { syncStatus: 'ready', nextCursor: 'member:2' } }));
    const result = await listGroupMembers({ GET } as unknown as ApiClient, 'group-1@g.us', { search: ' Ann ', role: 'member', cursor: 'member:1', limit: 25 });
    expect(GET).toHaveBeenCalledWith('/group/{groupJid}/members', { params: { path: { groupJid: 'group-1@g.us' }, query: { q: 'Ann', role: 'member', cursor: 'member:1', limit: 25 } } });
    expect(result.resource?.items[0]).toMatchObject({ id: '927beb51-46c2-4331-b3b4-d96f67280bd3', displayName: 'Ann', actions: { promote: { state: 'allowed' }, remove: { state: 'unknown' } } });
    expect(result.resource?.pagination.nextCursor).toBe('member:2');
  });

  it('preserves per-participant partial and unknown outcomes and the idempotency key', async () => {
    const POST = vi.fn().mockResolvedValue(ok({ message: 'success', data: {
      commandId: '927beb51-46c2-4331-b3b4-d96f67280bd3', groupJid: 'group-1@g.us', action: 'add', status: 'partially_completed', requestedCount: 2, succeededCount: 1, unknownCount: 1,
      outcomes: [{ participant: 'a@s.whatsapp.net', status: 'succeeded' }, { participant: 'b@s.whatsapp.net', status: 'unknown', code: 'unknown_outcome' }],
    } }));
    const result = await addGroupMember({ POST } as unknown as ApiClient, 'group-1@g.us', 'a@s.whatsapp.net', true, 'same-command-key');
    expect(POST).toHaveBeenCalledWith('/group/participant', expect.objectContaining({ headers: { 'Idempotency-Key': 'same-command-key' } }));
    expect(result).toMatchObject({ status: 'partially_completed', succeededCount: 1, unknownCount: 1, outcomes: [{ status: 'succeeded' }, { status: 'unknown', code: 'unknown_outcome' }] });
  });

  it('preserves unknown create outcomes for operator review', async () => {
    const POST = vi.fn().mockResolvedValue(ok({ message: 'success', data: { acknowledgementStatus: 'unknown', requestedCount: 1, unknownCount: 1, participantOutcomes: [{ participant: 'a@s.whatsapp.net', status: 'unknown' }] } }));
    const result = await createGroup({ POST } as unknown as ApiClient, { name: 'Ops', participants: ['a@s.whatsapp.net'] }, true, 'create-key');
    expect(result).toMatchObject({ status: 'unknown', requestedCount: 1, unknownCount: 1, outcomes: [{ status: 'unknown' }] });
  });

  it('maps newest-first public-safe audit pages without deriving state', async () => {
    const GET = vi.fn().mockResolvedValue(ok({ message: 'success', data: [{ id: 'event-1', eventType: 'participant_update', commandStatus: 'failed', occurredAt: '2026-07-28T10:00:00Z', summary: { failureCount: 1 } }], meta: { nextCursor: 'audit:2' } }));
    const result = await listGroupAudit({ GET } as unknown as ApiClient, 'group-1@g.us', 'audit:1');
    expect(GET).toHaveBeenCalledWith('/group/{groupJid}/audit', { params: { path: { groupJid: 'group-1@g.us' }, query: { limit: 50, cursor: 'audit:1' } } });
    expect(result.resource).toMatchObject({ items: [{ id: 'event-1', commandStatus: 'failed' }], pagination: { nextCursor: 'audit:2', hasMore: true } });
  });

  it('drops malformed rows without a stable group identity', async () => {
    const GET = vi.fn().mockResolvedValue(ok({ message: 'success', data: [{ Name: 'Missing JID' }, projectedGroup], meta: { syncStatus: 'ready' } }));
    const result = await listInstanceGroups({ GET } as unknown as ApiClient, {}, false);
    expect(result.resource?.items.map((group) => group.id)).toEqual([projectedGroup.JID]);
  });

  it('submits subject and description as independent commands', async () => {
    const POST = vi.fn().mockResolvedValue(ok({ message: 'success' }));
    const client = { POST } as unknown as ApiClient;

    await updateGroupName(client, projectedGroup.JID, 'New name', false);
    expect(POST).toHaveBeenLastCalledWith('/group/name', { body: { groupJid: projectedGroup.JID, name: 'New name' } });

    await updateGroupDescription(client, projectedGroup.JID, 'New description', false);
    expect(POST).toHaveBeenLastCalledWith('/group/description', { body: { groupJid: projectedGroup.JID, description: 'New description' } });
    expect(POST).toHaveBeenCalledTimes(2);
  });
});
