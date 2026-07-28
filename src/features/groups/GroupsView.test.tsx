import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { GroupResource } from '@/api/groups';
import { GroupsView, type GroupsViewProps } from './GroupsView';

const groups: GroupResource[] = [{
  id: '120363001@g.us',
  normalized: true,
  subject: 'Operations',
  groupType: 'subgroup',
  sendMode: 'admins_only',
  status: 'active',
  memberCount: 8,
  members: [],
}];

function render(overrides: Partial<GroupsViewProps> = {}) {
  return renderToStaticMarkup(<GroupsView
    refreshing={false}
    onRefresh={vi.fn()}
    onNew={vi.fn()}
    onJoin={vi.fn()}
    normalized
    filters={{}}
    onFilter={vi.fn()}
    searchDraft=""
    onSearchDraft={vi.fn()}
    onApply={(event) => event.preventDefault()}
    applyDisabled
    initialLoading={false}
    groups={groups}
    onOpen={vi.fn()}
    onCursor={vi.fn()}
    {...overrides}
  />);
}

describe('Groups directory', () => {
  it('renders factual type, group state, and send mode without page-local aggregate metrics', () => {
    const html = render();
    expect(html).toContain('Group state');
    expect(html).toContain('Send mode');
    expect(html).toContain('Subgroup');
    expect(html).toContain('Admins only');
    expect(html).not.toContain('Loaded groups');
    expect(html).toContain('do not establish this account');
  });

  it('keeps projected rows inspectable when provider commands are disabled', () => {
    const html = render({ commandsEnabled: false });
    expect(html).toContain('tabindex="0"');
    expect(html).toContain('disabled=""');
  });

  it('renders the caller-provided non-authoritative empty state', () => {
    const html = render({ groups: [], emptyState: { kind: 'loading', title: 'Group projection syncing', detail: 'Waiting for a usable snapshot.' } });
    expect(html).toContain('Group projection syncing');
    expect(html).not.toContain('The ready group projection contains no groups');
  });
});
