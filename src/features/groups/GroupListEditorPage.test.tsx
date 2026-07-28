import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { GroupListEditorPage } from './GroupListEditorPage';

vi.mock('react-router-dom', async (importOriginal) => ({
  ...await importOriginal<typeof import('react-router-dom')>(),
  useBlocker: () => ({ state: 'unblocked' }),
  useBeforeUnload: () => undefined,
}));
vi.mock('@/api/ApiProvider', () => ({ useApiSession: () => ({ keyKind: 'api' }) }));
vi.mock('@/api/CapabilitiesProvider', () => ({ useServerCapabilities: () => ({ data: { capabilities: ['group_lists', 'group_list_eligibility', 'groups_projection', 'group_management_permissions'] } }) }));
vi.mock('./hooks', () => ({
  useGroups: () => ({
    isPending: false,
    isFetching: false,
    error: null,
    refetch: vi.fn(),
    data: { resource: { items: [
      { id: '120363001@g.us', subject: 'Operations', groupType: 'subgroup', memberCount: 84, status: 'active' },
      { id: '120363002@g.us', subject: 'Editorial', groupType: 'group', status: 'unavailable' },
    ], pagination: { nextCursor: 'next-groups' } } },
  }),
}));
vi.mock('@/api/group-list-hooks', () => ({
  useGroupList: () => ({ isPending: false, error: null, data: undefined }),
  useAllGroupListEntries: () => ({ isPending: false, error: null, data: undefined }),
  useGroupEligibility: () => ({ isPending: false, error: null, refetch: vi.fn(), data: { items: [
    { groupJid: '120363001@g.us', eligibility: 'eligible', canSend: true },
    { groupJid: '120363002@g.us', eligibility: 'unavailable', eligibilityReason: 'send_permission_denied', canSend: false },
  ] } }),
  useCreateGroupList: () => ({ isPending: false, error: null, data: undefined, mutate: vi.fn(), reset: vi.fn() }),
  useUpdateGroupList: () => ({ isPending: false, error: null, data: undefined, mutate: vi.fn(), reset: vi.fn() }),
}));

describe('GroupListEditorPage', () => {
  it('renders the canonical target table, page-scoped selection, and cursor controls', () => {
    const html = renderToStaticMarkup(<MemoryRouter initialEntries={['/groups/lists/new']}><Routes><Route path="/groups/lists/new" element={<GroupListEditorPage />} /></Routes></MemoryRouter>);

    expect(html).toContain('Create Group List');
    expect(html).toContain('min-[900px]:max-h-[28rem]');
    expect(html).toContain('min-[900px]:overflow-y-auto');
    expect(html).not.toContain('class="max-h-[28rem] overflow-y-auto');
    expect(html).toContain('Select eligible on this page');
    expect(html).toContain('Operations');
    expect(html).toContain('Subgroup');
    expect(html).toContain('84');
    expect(html).toContain('Send permission denied');
    expect(html).toContain('Load more');
    expect(html).toContain('Submission review');
    expect(html).toContain('sticky bottom-0');
    expect(html).not.toContain('Next page');
  });
});
