import { createElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GroupResource } from '@/api/groups';
import { ApiFailure } from '@/api/envelopes';
import { GroupWorkspace } from './GroupWorkspace';

const workspaceState = vi.hoisted(() => ({ inviteAvailable: undefined as boolean | undefined, inviteError: undefined as unknown }));

const group: GroupResource = {
  id: '120363001@g.us',
  normalized: false,
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
    normalized: false,
    subject: 'Operations',
    groupType: 'group',
    status: 'active',
    actions: {
      editName: { state: 'allowed' },
      editDescription: { state: 'unknown', reason: 'projection_not_ready' },
      editSettings: { state: 'denied', reason: 'admin_required' },
      sendMessage: { state: 'allowed' },
      readInviteLink: { state: 'allowed' },
      resetInviteLink: { state: 'allowed' },
      setPhoto: { state: 'allowed' },
    },
    members: [{ id: 'member-1', memberRef: '15551230000', role: 'member' }],
  };
  const mutation = () => ({ data: undefined, error: undefined, isPending: false, mutate: vi.fn(), reset: vi.fn() });
  return {
    useGroup: () => ({ data: { resource: { ...cachedGroup, inviteLink: workspaceState.inviteAvailable === undefined ? undefined : { available: workspaceState.inviteAvailable } }, meta: { syncStatus: 'ready' } }, error: undefined, isPending: false, refetch: vi.fn() }),
    useGroupInvite: () => ({ data: workspaceState.inviteError ? undefined : { resource: 'https://example.test/invite' }, error: workspaceState.inviteError, isPending: false, refetch: vi.fn() }),
    useGroupMembers: () => ({ data: undefined, error: undefined, isPending: false, isFetching: false, refetch: vi.fn() }),
    useGroupAudit: () => ({ data: undefined, error: undefined, isPending: false, refetch: vi.fn() }),
    useUploadMediaAsset: mutation,
    useMediaAsset: () => ({ data: undefined, error: undefined, isPending: false, refetch: vi.fn() }),
    useMediaAssetContent: () => ({ data: undefined, error: undefined, isPending: false, refetch: vi.fn() }),
    useSetGroupPhoto: mutation,
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
  beforeEach(() => { workspaceState.inviteAvailable = undefined; workspaceState.inviteError = undefined; });
  it('keeps cached detail visible and disables every provider command', () => {
    const html = renderToStaticMarkup(
      <GroupWorkspace
        groupId={group.id}
        readEnabled={false}
        commandsEnabled={false}
        normalized={false}
        membersEnabled={false}
        auditEnabled={false}
        photoEnabled={false}
        activeTab="settings"
        memberSearch=""
        onParam={vi.fn()}
        onTab={vi.fn()}
        onClose={vi.fn()}
        onLeft={vi.fn()}
      />,
    );

    expect(html).toContain('Operations');
    expect(html).toContain('Keeping the last usable detail visible');
    expect(html).not.toContain('Loading group');
    expect((html.match(/disabled=""/g) ?? []).length).toBeGreaterThanOrEqual(7);
  });

  it('keeps messaging disabled when normalized permission is unavailable while handing off targeting', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <GroupWorkspace
          groupId={group.id}
          readEnabled
          commandsEnabled={false}
          normalized={false}
          membersEnabled={false}
          auditEnabled={false}
          photoEnabled={false}
          activeTab="overview"
          memberSearch=""
          onParam={vi.fn()}
          onTab={vi.fn()}
          onClose={vi.fn()}
          onLeft={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(html).toContain('Messaging unavailable');
    expect(html).not.toContain('/conversations/120363001%40g.us');
    expect(html).toContain('Manage campaign targets');
    expect(html).not.toContain('Send group text');
  });

  it('presents subject and description as separate commands', () => {
    const html = renderToStaticMarkup(
      <GroupWorkspace
        groupId={group.id}
        readEnabled
        commandsEnabled
        normalized={false}
        membersEnabled={false}
        auditEnabled={false}
        photoEnabled={false}
        activeTab="settings"
        memberSearch=""
        onParam={vi.fn()}
        onTab={vi.fn()}
        onClose={vi.fn()}
        onLeft={vi.fn()}
      />,
    );

    expect(html).toContain('Update subject');
    expect(html).toContain('Update description');
    expect(html).toContain('independent commands with independently revalidated permission');
  });

  it('uses the canonical file chooser for Group photos', () => {
    const html = renderToStaticMarkup(
      <GroupWorkspace
        groupId={group.id}
        readEnabled
        commandsEnabled
        normalized
        membersEnabled
        auditEnabled
        photoEnabled
        activeTab="settings"
        memberSearch=""
        onParam={vi.fn()}
        onTab={vi.fn()}
        onClose={vi.fn()}
        onLeft={vi.fn()}
      />,
    );

    expect(html).toContain('No file selected');
    expect(html).toContain('Choose file');
    expect(html).toContain('The file stays local until Upload asset is selected.');
  });

  it('renders allowed, denied, and unknown decisions as distinct normalized states', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <GroupWorkspace
          groupId={group.id}
          readEnabled
          commandsEnabled
          normalized
          membersEnabled
          auditEnabled
          photoEnabled={false}
          activeTab="overview"
          memberSearch=""
          onParam={vi.fn()}
          onTab={vi.fn()}
          onClose={vi.fn()}
          onLeft={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(html).toContain('Edit name');
    expect(html).toContain('Allowed');
    expect(html).toContain('Denied');
    expect(html).toContain('Admin required');
    expect(html).toContain('Unknown');
    expect(html).toContain('Projection not ready');
  });

  it('renders missing cached invite links as unavailable without a retry action', () => {
    workspaceState.inviteAvailable = false;
    const html = renderToStaticMarkup(
      <GroupWorkspace
        groupId={group.id}
        readEnabled
        commandsEnabled
        normalized
        membersEnabled
        auditEnabled
        photoEnabled={false}
        activeTab="settings"
        memberSearch=""
        onParam={vi.fn()}
        onTab={vi.fn()}
        onClose={vi.fn()}
        onLeft={vi.fn()}
      />,
    );

    expect(html).toContain('Invite link not available');
    expect(html).toContain('Reset invite link');
    expect(html).not.toContain('Read failed');
    expect(html).not.toContain('Retry');
  });

  it('treats a raced missing-link response as unavailable instead of a failed read', () => {
    workspaceState.inviteAvailable = true;
    workspaceState.inviteError = new ApiFailure({ code: 'group_invite_link_not_found', error: 'cached group invite link is not available' }, 404);
    const html = renderToStaticMarkup(
      <GroupWorkspace
        groupId={group.id}
        readEnabled
        commandsEnabled
        normalized
        membersEnabled
        auditEnabled
        photoEnabled={false}
        activeTab="settings"
        memberSearch=""
        onParam={vi.fn()}
        onTab={vi.fn()}
        onClose={vi.fn()}
        onLeft={vi.fn()}
      />,
    );

    expect(html).toContain('Invite link not available');
    expect(html).not.toContain('Read failed');
    expect(html).not.toContain('Retry');
  });
});
