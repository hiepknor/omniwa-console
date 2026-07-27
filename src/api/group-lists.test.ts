import { describe, expect, it, vi } from 'vitest';
import type { ApiClient } from './client';
import { createGroupList, listGroupListEntries, listGroupLists, updateGroupList } from './group-lists';

const ok = (data: unknown, status = 200) => ({ data, response: new Response(null, { status }) });

describe('Group Lists adapter', () => {
  it('preserves projection metadata and opaque cursors', async () => {
    const GET = vi.fn().mockResolvedValue(ok({ message: 'success', data: [{ id: 'list-1', name: 'Branches', groupCount: 2, version: 3 }], meta: { syncStatus: 'ready', nextCursor: 'opaque/next' } }));
    const result = await listGroupLists({ GET } as unknown as ApiClient, { search: 'bran', cursor: 'opaque/current', limit: 25 });
    expect(GET).toHaveBeenCalledWith('/group-lists', { params: { query: { search: 'bran', cursor: 'opaque/current', limit: 25 } } });
    expect(result).toEqual(expect.objectContaining({ nextCursor: 'opaque/next', meta: expect.objectContaining({ syncStatus: 'ready' }) }));
    expect(result.items[0]).toEqual(expect.objectContaining({ id: 'list-1', groupCount: 2, version: 3 }));
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
});
