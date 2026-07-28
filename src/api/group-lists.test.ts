import { describe, expect, it, vi } from 'vitest';
import type { ApiClient } from './client';
import { checkGroupEligibility, createGroupList, eligibilityIssues, getGroupListEligibility, listGroupListEntries, listGroupLists, updateGroupList } from './group-lists';
import { ApiFailure } from './envelopes';

const ok = (data: unknown, status = 200) => ({ data, response: new Response(null, { status }) });

describe('Group Lists adapter', () => {
  it('preserves projection metadata and opaque cursors', async () => {
    const GET = vi.fn().mockResolvedValue(ok({ message: 'success', data: [{ id: 'list-1', name: 'Branches', groupCount: 2, version: 3 }], meta: { syncStatus: 'ready', nextCursor: 'opaque/next' } }));
    const result = await listGroupLists({ GET } as unknown as ApiClient, { search: 'bran', cursor: 'opaque/current', limit: 25 });
    expect(GET).toHaveBeenCalledWith('/group-lists', { params: { query: { search: 'bran', cursor: 'opaque/current', limit: 25 } } });
    expect(result).toEqual(expect.objectContaining({ nextCursor: 'opaque/next', meta: expect.objectContaining({ syncStatus: 'ready' }) }));
    expect(result.items[0]).toEqual(expect.objectContaining({ id: 'list-1', groupCount: 2, version: 3 }));
  });

  it('keeps omitted counts and versions unreported', async () => {
    const GET = vi.fn()
      .mockResolvedValueOnce(ok({ message: 'success', data: [{ id: 'list-1', name: 'Branches' }], meta: { syncStatus: 'stale' } }))
      .mockResolvedValueOnce(ok({ message: 'success', data: { groupListId: 'list-1' }, meta: { syncStatus: 'stale' } }));
    const client = { GET } as unknown as ApiClient;

    const lists = await listGroupLists(client);
    const assessment = await getGroupListEligibility(client, 'list-1', 4);

    expect(lists.items[0]).toMatchObject({ id: 'list-1', groupCount: undefined, version: undefined });
    expect(assessment.aggregate).toMatchObject({
      groupListVersion: undefined,
      total: undefined,
      eligible: undefined,
      unavailable: undefined,
      unknown: undefined,
      readyToTarget: undefined,
    });
  });

  it('uses backend eligibility without inferring from group metadata', async () => {
    const GET = vi.fn().mockResolvedValue(ok({ message: 'success', data: [{ groupJid: '1@g.us', currentName: 'Ops', eligibility: 'unavailable', eligibilityReason: 'send_permission_denied', canSend: false }], meta: {} }));
    const result = await listGroupListEntries({ GET } as unknown as ApiClient, 'list-1');
    expect(result.items[0]).toEqual(expect.objectContaining({ eligibility: 'unavailable', eligibilityReason: 'send_permission_denied', canSend: false }));
  });

  it('submits raw evidence only in the audited write command', async () => {
    const input = { name: 'Branches', groupJids: ['1@g.us'], authorization: { source: 'operator_attestation', evidenceReference: 'secret-ticket', authorizedAt: '2026-07-27T08:00:00Z' } };
    const POST = vi.fn().mockResolvedValue(ok({ message: 'success', data: { id: 'list-1', name: 'Branches', groupCount: 1, version: 1 } }, 201));
    const PUT = vi.fn().mockResolvedValue(ok({ message: 'success', data: { id: 'list-1', name: 'Branches', groupCount: 1, version: 2 } }));
    await createGroupList({ POST } as unknown as ApiClient, input);
    await updateGroupList({ PUT } as unknown as ApiClient, 'list-1', { ...input, expectedVersion: 1 });
    expect(POST).toHaveBeenCalledWith('/group-lists', { body: input });
    expect(PUT).toHaveBeenCalledWith('/group-lists/{groupListId}', { params: { path: { groupListId: 'list-1' } }, body: { ...input, expectedVersion: 1 } });
  });

  it('checks an ordered batch without inferring eligibility', async () => {
    const POST = vi.fn().mockResolvedValue(ok({ message: 'success', data: [
      { groupJid: '2@g.us', eligibility: 'unknown', eligibilityReason: 'projection_not_ready', canSend: false },
      { groupJid: '1@g.us', eligibility: 'eligible', canSend: true },
    ], meta: { source: 'groups_projection', syncStatus: 'stale' } }));
    const result = await checkGroupEligibility({ POST } as unknown as ApiClient, ['2@g.us', '1@g.us']);
    expect(POST).toHaveBeenCalledWith('/group-lists/eligibility', { body: { groupJids: ['2@g.us', '1@g.us'] } });
    expect(result.items.map((item) => item.groupJid)).toEqual(['2@g.us', '1@g.us']);
    expect(result.items[0]).toEqual(expect.objectContaining({ eligibility: 'unknown', canSend: false }));
    expect(result.meta).toEqual(expect.objectContaining({ source: 'groups_projection', syncStatus: 'stale' }));
  });

  it('reads an exact-version aggregate and preserves backend counts', async () => {
    const GET = vi.fn().mockResolvedValue(ok({ message: 'success', data: { groupListId: 'list-1', groupListVersion: 4, total: 3, eligible: 2, unavailable: 1, unknown: 0, readyToTarget: false, byReason: { group_access_lost: 1 } }, meta: { syncStatus: 'ready' } }));
    const result = await getGroupListEligibility({ GET } as unknown as ApiClient, 'list-1', 4);
    expect(GET).toHaveBeenCalledWith('/group-lists/{groupListId}/eligibility', { params: { path: { groupListId: 'list-1' }, query: { expectedVersion: 4 } } });
    expect(result.aggregate).toEqual(expect.objectContaining({ groupListVersion: 4, total: 3, eligible: 2, unavailable: 1, readyToTarget: false, byReason: { group_access_lost: 1 } }));
  });

  it('narrows bounded structured mutation issues and unknown eligibility values', () => {
    const failure = new ApiFailure({ error: 'blocked', details: { issueCount: 2, truncated: true, issues: [{ groupJid: '1@g.us', eligibility: 'future_state', canSend: true }] } }, 409);
    expect(eligibilityIssues(failure)).toEqual({ issueCount: 2, truncated: true, issues: [expect.objectContaining({ groupJid: '1@g.us', eligibility: 'unknown', canSend: true })] });
  });
});
