import { createElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { GroupResource } from '@/api/groups';
import { GroupWorkspace } from './GroupWorkspace';

const group: GroupResource = {
  id: '120363001@g.us',
  subject: 'Operations',
  groupType: 'group',
  status: 'active',
  members: [{ id: 'member-1', memberRef: '15551230000', role: 'member' }],
};

vi.mock('@/ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/ui')>();
  return {
    ...actual,
    Drawer: ({ children }: { children: ReactNode }) => createElement('div', null, children),
  };
});

vi.mock('./hooks', () => {
  const cachedGroup: GroupResource = {
    id: '120363001@g.us',
    subject: 'Operations',
    groupType: 'group',
    status: 'active',
    members: [{ id: 'member-1', memberRef: '15551230000', role: 'member' }],
  };
  const mutation = () => ({ data: undefined, error: undefined, isPending: false, mutate: vi.fn(), reset: vi.fn() });
  return {
    useGroup: () => ({ data: { resource: cachedGroup, meta: { syncStatus: 'ready' } }, error: undefined, isPending: false, refetch: vi.fn() }),
    useGroupInvite: () => ({ data: 'https://example.test/invite', error: undefined, isPending: false, refetch: vi.fn() }),
    useAddGroupMember: mutation,
    useDemoteGroupMember: mutation,
    useLeaveGroup: mutation,
    usePromoteGroupMember: mutation,
    useRemoveGroupMember: mutation,
    useResetInvite: mutation,
    useUpdateGroupSetting: mutation,
    useUpdateGroupName: mutation,
    useUpdateGroupDescription: mutation,
  };
});

describe('GroupWorkspace capability loss', () => {
  it('keeps cached detail visible and disables every provider command', () => {
    const html = renderToStaticMarkup(
      <GroupWorkspace
        groupId={group.id}
        readEnabled={false}
        commandsEnabled={false}
        activeTab="settings"
        onTab={vi.fn()}
        onClose={vi.fn()}
        onLeft={vi.fn()}
      />,
    );

    expect(html).toContain('Operations');
    expect(html).toContain('Keeping the last usable group detail visible');
    expect(html).not.toContain('Loading group');
    expect((html.match(/disabled=""/g) ?? []).length).toBeGreaterThanOrEqual(7);
  });

  it('hands messaging and targeting to their owning routes without a send command', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <GroupWorkspace
          groupId={group.id}
          readEnabled
          commandsEnabled
          activeTab="overview"
          onTab={vi.fn()}
          onClose={vi.fn()}
          onLeft={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(html).toContain('Open in Inbox');
    expect(html).toContain('/chats/120363001%40g.us');
    expect(html).toContain('Manage campaign targets');
    expect(html).not.toContain('Send group text');
  });

  it('presents subject and description as separate commands', () => {
    const html = renderToStaticMarkup(
      <GroupWorkspace
        groupId={group.id}
        readEnabled
        commandsEnabled
        activeTab="settings"
        onTab={vi.fn()}
        onClose={vi.fn()}
        onLeft={vi.fn()}
      />,
    );

    expect(html).toContain('Update subject');
    expect(html).toContain('Update description');
    expect(html).toContain('independent provider commands');
  });
});
