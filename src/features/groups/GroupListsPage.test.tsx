import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { GroupListsPage } from './GroupListsPage';

vi.mock('react-dom', async (importOriginal) => ({
  ...await importOriginal<typeof import('react-dom')>(),
  createPortal: (children: React.ReactNode) => children,
}));
Object.defineProperty(globalThis, 'document', { value: { body: {} }, configurable: true });

vi.mock('@/api/ApiProvider', () => ({ useApiSession: () => ({ keyKind: 'api' }) }));
vi.mock('@/api/CapabilitiesProvider', () => ({ useServerCapabilities: () => ({ isPending: false, data: { capabilities: ['group_lists', 'group_list_eligibility'] } }) }));
vi.mock('@/api/group-list-hooks', () => ({
  useGroupLists: () => ({ isPending: false, isFetching: false, error: null, refetch: vi.fn(), data: { items: [{ id: 'list-1', name: 'Operations', description: 'Approved targets', groupCount: 3, version: 2, authorizationSource: 'operator_attestation', updatedAt: '2026-07-28T08:00:00Z' }], nextCursor: 'next' } }),
  useGroupList: () => ({ isPending: false, error: null, refetch: vi.fn(), data: { id: 'list-1', name: 'Operations', groupCount: 1, version: 2, authorizationSource: 'operator_attestation' } }),
  useGroupListEntries: () => ({ isPending: false, error: null, refetch: vi.fn(), data: { items: [{ groupJid: '123456789012345678901234567890@g.us', currentName: 'A target group name long enough to require wrapping inside the inspector', snapshotName: 'The previous long target group name', eligibility: 'eligible' }], nextCursor: undefined } }),
  useGroupListAudit: () => ({ isPending: false, error: null, refetch: vi.fn(), data: { items: [], nextCursor: undefined } }),
  useGroupListEligibility: () => ({ isPending: false, error: null, refetch: vi.fn(), data: undefined }),
  useDeleteGroupList: () => ({ isPending: false, mutateAsync: vi.fn() }),
}));

describe('GroupListsPage', () => {
  it('renders the URL-addressable directory with canonical table and cursor controls', () => {
    const html = renderToStaticMarkup(<MemoryRouter initialEntries={['/groups/lists']}><Routes><Route path="/groups/lists" element={<GroupListsPage />} /></Routes></MemoryRouter>);

    expect(html).toContain('Group List directory');
    expect(html).toContain('Operations');
    expect(html).toContain('Approved targets');
    expect(html).toContain('Operator attestation');
    expect(html).toContain('Load more');
    expect(html).toContain('New group list');
  });

  it('keeps long target identities visible and exposes the Group JID copy action', () => {
    const html = renderToStaticMarkup(<MemoryRouter initialEntries={['/groups/lists/list-1']}><Routes><Route path="/groups/lists/:groupListId" element={<GroupListsPage />} /></Routes></MemoryRouter>);

    expect(html).toContain('A target group name long enough to require wrapping inside the inspector');
    expect(html).toContain('123456789012345678901234567890@g.us');
    expect(html).toContain('aria-label="Copy Group JID"');
    expect(html).toContain('grid-cols-[minmax(0,1fr)_auto]');
    expect(html).toContain('<strong class="min-w-0 break-words text-sm leading-snug">');
    expect(html).toContain('<code class="min-w-0 break-all text-xs text-fg-3">');
    expect(html).toContain('<small class="min-w-0 break-words text-xs text-fg-3">Previously:');
  });
});
