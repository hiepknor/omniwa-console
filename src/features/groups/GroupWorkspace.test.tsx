import { createElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { GroupResource } from '@/api/groups';
import { GroupWorkspace } from './GroupWorkspace';

const group: GroupResource = {
  id: '120363001@g.us',
  subject: 'Operations',
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
    useSendGroupText: mutation,
    useUpdateGroupSetting: mutation,
    useUpdateGroup: mutation,
  };
});

describe('GroupWorkspace capability loss', () => {
  it('keeps cached detail visible and disables every provider command', () => {
    const html = renderToStaticMarkup(
      <GroupWorkspace
        groupId={group.id}
        readEnabled={false}
        commandsEnabled={false}
        outboundEnabled
        onClose={vi.fn()}
        onLeft={vi.fn()}
      />,
    );

    expect(html).toContain('Operations');
    expect(html).toContain('Keeping the last usable group detail visible');
    expect(html).not.toContain('Loading group');
    expect((html.match(/disabled=""/g) ?? []).length).toBeGreaterThanOrEqual(10);
  });
});
