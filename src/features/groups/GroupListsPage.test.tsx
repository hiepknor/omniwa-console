import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { GroupListsPage } from './GroupListsPage';

vi.mock('@/api/ApiProvider', () => ({ useApiSession: () => ({ keyKind: 'api' }) }));
vi.mock('@/api/CapabilitiesProvider', () => ({ useServerCapabilities: () => ({ isPending: false, data: { capabilities: ['group_lists', 'group_list_eligibility'] } }) }));
vi.mock('@/api/group-list-hooks', () => ({
  useGroupLists: () => ({ isPending: false, isFetching: false, error: null, refetch: vi.fn(), data: { items: [{ id: 'list-1', name: 'Operations', description: 'Approved targets', groupCount: 3, version: 2, authorizationSource: 'operator_attestation', updatedAt: '2026-07-28T08:00:00Z' }], nextCursor: 'next' } }),
  useGroupList: vi.fn(),
  useGroupListEntries: vi.fn(),
  useGroupListAudit: vi.fn(),
  useGroupListEligibility: vi.fn(),
  useDeleteGroupList: vi.fn(),
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
});
