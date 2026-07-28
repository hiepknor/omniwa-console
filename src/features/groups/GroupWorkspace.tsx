import { useEffect, useState } from 'react';
import { ApiFailureNotice } from '@/components/ApiFailureNotice';
import type { GroupMemberResource, GroupResource, GroupSetting } from '@/api/groups';
import type { ProjectionMeta } from '@/api/envelopes';
import { humanizeToken, relativeTime } from '@/lib/format';
import { Button, ButtonLink, DescriptionItem, DescriptionList, Dialog, Drawer, Field, Input, Panel, StateNotice, Status, Switch, Tabs, Textarea, type Tone } from '@/ui';
import {
  useAddGroupMember, useDemoteGroupMember, useGroupInvite, useGroup,
  useLeaveGroup, usePromoteGroupMember, useRemoveGroupMember,
  useResetInvite, useUpdateGroupDescription, useUpdateGroupName, useUpdateGroupSetting,
} from './hooks';
import type { GroupWorkspaceTab } from './route-state';

type Confirm = { action: 'remove'; member: GroupMemberResource } | { action: 'leave' } | { action: 'reset-invite' };
const settings: Array<{ key: GroupSetting; label: string; hint: string }> = [
  { key: 'announce', label: 'Announcement only', hint: 'Only admins can post.' },
  { key: 'locked', label: 'Locked metadata', hint: 'Only admins can edit group information.' },
  { key: 'joinApproval', label: 'Join approval', hint: 'New members require approval.' },
  { key: 'adminsOnlyAdd', label: 'Admin member add', hint: 'Only admins can add members.' },
];

function Fail({ error, command, stale, onRetry }: { error: unknown; command?: boolean; stale?: boolean; onRetry?: () => void }) {
  return <ApiFailureNotice error={error} title={command ? 'Command failed' : stale ? 'Showing last known data' : 'Read failed'} onRetry={onRetry} />;
}
function Ack({ action }: { action: string }) { return <StateNotice kind="info" title={`${action} accepted`} detail="The refreshed group projection remains authoritative; acknowledgement does not prove provider completion." />; }
function ProjectionLine({ meta }: { meta?: ProjectionMeta }) {
  if (!meta?.syncStatus) return null;
  const tone: Tone = meta.syncStatus === 'ready' ? 'ok' : meta.syncStatus === 'failed' ? 'failed' : meta.syncStatus === 'stale' ? 'degraded' : 'pending';
  return <Status tone={tone}>Projection {meta.syncStatus.replace('_', ' ')}</Status>;
}

export function GroupWorkspace({
  groupId,
  readEnabled,
  commandsEnabled,
  activeTab,
  onTab,
  onClose,
  onLeft,
}: {
  groupId: string;
  readEnabled: boolean;
  commandsEnabled: boolean;
  activeTab: GroupWorkspaceTab;
  onTab: (tab: GroupWorkspaceTab) => void;
  onClose: () => void;
  onLeft: () => void;
}) {
  const query = useGroup(groupId, readEnabled);
  const group = query.data?.resource;
  return (
    <Drawer open onClose={onClose} title={group?.subject ?? 'Group details'} subtitle={groupId}>
      {!readEnabled && !group ? (
        <StateNotice kind="empty" title="Group detail unavailable" detail="The groups projection capability is absent and no cached detail is available." />
      ) : query.isPending ? (
        <StateNotice kind="loading" title="Loading group" />
      ) : query.error && !group ? (
        <Fail error={query.error} onRetry={() => query.refetch()} />
      ) : group ? (
        <div className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Status tone={group.status === 'active' ? 'ok' : 'degraded'}>Group {humanizeToken(group.status ?? 'unreported')}</Status>
            <ProjectionLine meta={query.data?.meta} />
          </div>
          {!commandsEnabled ? <StateNotice kind="empty" title="Capability changed" detail="Keeping the last usable group detail visible. Provider commands remain disabled until groups_projection returns." /> : null}
          {query.error ? <Fail error={query.error} stale onRetry={readEnabled ? () => query.refetch() : undefined} /> : null}
          <GroupWorkspaceContent key={group.id} group={group} commandsEnabled={commandsEnabled} activeTab={activeTab} onTab={onTab} onLeft={onLeft} />
        </div>
      ) : (
        <StateNotice kind="empty" title="Not returned" detail="The projected group detail was not returned." />
      )}
    </Drawer>
  );
}

function GroupWorkspaceContent({ group, commandsEnabled, activeTab, onTab, onLeft }: { group: GroupResource; commandsEnabled: boolean; activeTab: GroupWorkspaceTab; onTab: (tab: GroupWorkspaceTab) => void; onLeft: () => void }) {
  const [subject, setSubject] = useState(group.subject ?? '');
  const [description, setDescription] = useState(group.description ?? '');
  const [memberJid, setMemberJid] = useState('');
  const [confirm, setConfirm] = useState<Confirm>();
  const [confirmText, setConfirmText] = useState('');
  const [commandAck, setCommandAck] = useState<string>();
  const updateName = useUpdateGroupName(group.id);
  const updateDescription = useUpdateGroupDescription(group.id);
  const setting = useUpdateGroupSetting(group.id);
  const add = useAddGroupMember(group.id);
  const promote = usePromoteGroupMember(group.id);
  const demote = useDemoteGroupMember(group.id);
  const remove = useRemoveGroupMember(group.id);
  const leave = useLeaveGroup(group.id);
  const invite = useGroupInvite(group.id, commandsEnabled && activeTab === 'settings');
  const resetInvite = useResetInvite(group.id);
  useEffect(() => { setSubject(group.subject ?? ''); }, [group.subject]);
  useEffect(() => { setDescription(group.description ?? ''); }, [group.description]);
  const subjectDirty = subject !== (group.subject ?? '');
  const descriptionDirty = description !== (group.description ?? '');
  const memberPending = add.isPending || promote.isPending || demote.isPending || remove.isPending;
  const memberError = add.error ?? promote.error ?? demote.error ?? remove.error;
  const lastAck = commandAck
    ?? (updateName.data ? 'Subject update'
      : updateDescription.data ? 'Description update'
        : setting.data ? 'Setting update'
          : add.data ? 'Member add'
            : promote.data ? 'Member promotion'
              : demote.data ? 'Member demotion'
                : undefined);
  const closeConfirm = () => { setConfirm(undefined); setConfirmText(''); remove.reset(); leave.reset(); resetInvite.reset(); };
  const submitConfirm = () => {
    if (!confirm || !commandsEnabled) return;
    if (confirm.action === 'remove') {
      const ref = confirm.member.memberRef ?? confirm.member.id;
      if (confirmText !== ref || remove.isPending) return;
      remove.mutate(ref, { onSuccess: () => { setCommandAck('Member removal'); closeConfirm(); } });
    }
    if (confirm.action === 'leave') {
      if (confirmText !== group.id || leave.isPending) return;
      leave.mutate(undefined, { onSuccess: () => { closeConfirm(); onLeft(); } });
    }
    if (confirm.action === 'reset-invite' && !resetInvite.isPending) {
      resetInvite.mutate(undefined, { onSuccess: () => { setCommandAck('Invite-link reset'); closeConfirm(); } });
    }
  };
  const confirmPending = confirm?.action === 'remove' ? remove.isPending : confirm?.action === 'leave' ? leave.isPending : resetInvite.isPending;
  const confirmError = confirm?.action === 'remove' ? remove.error : confirm?.action === 'leave' ? leave.error : resetInvite.error;

  return (
    <div className="grid gap-4">
      {lastAck ? <Ack action={lastAck} /> : null}
      <Tabs
        active={activeTab}
        onChange={(tab) => onTab(tab as GroupWorkspaceTab)}
        tabs={[
          { id: 'overview', label: 'Overview' },
          { id: 'members', label: 'Members', count: group.memberCount },
          { id: 'settings', label: 'Settings' },
        ]}
      />

      <div role="tabpanel" className="grid gap-4">
        {activeTab === 'overview' ? (
          <>
            <Panel title="Group facts" description="Persisted WhatsApp group facts; these values do not infer this account's permissions.">
              <DescriptionList>
                <DescriptionItem label="Group JID" mono>{group.id}</DescriptionItem>
                <DescriptionItem label="Type">{humanizeToken(group.groupType ?? 'unreported')}</DescriptionItem>
                <DescriptionItem label="Group state">{humanizeToken(group.status ?? 'unreported')}</DescriptionItem>
                <DescriptionItem label="Send mode">{group.sendMode ? humanizeToken(group.sendMode) : 'Not reported'}</DescriptionItem>
                <DescriptionItem label="Members">{String(group.memberCount ?? 'Not reported')}</DescriptionItem>
                <DescriptionItem label="Admins">{String(group.adminCount ?? 'Not reported')}</DescriptionItem>
                <DescriptionItem label="Owner" mono>{group.ownerRef ?? 'Not reported'}</DescriptionItem>
                <DescriptionItem label="Created">{relativeTime(group.createdAt) || 'Not reported'}</DescriptionItem>
                <DescriptionItem label="Updated">{relativeTime(group.updatedAt) || 'Not reported'}</DescriptionItem>
                {group.parentGroupId ? <DescriptionItem label="Parent group" mono>{group.parentGroupId}</DescriptionItem> : null}
              </DescriptionList>
            </Panel>
            <Panel title="Continue workflow" description="Messaging and campaign targeting remain in their owning workspaces.">
              <div className="flex flex-wrap gap-2">
                <ButtonLink to={`/chats/${encodeURIComponent(group.id)}`}>Open in Inbox</ButtonLink>
                <ButtonLink to="/groups/lists">Manage campaign targets</ButtonLink>
              </div>
            </Panel>
          </>
        ) : null}

        {activeTab === 'members' ? (
          <Panel title="Members" description="Member commands act on the linked provider; refreshed projection remains authoritative.">
            <div className="grid gap-3">
              <form className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 max-sm:grid-cols-1" onSubmit={(event) => { event.preventDefault(); if (commandsEnabled && memberJid.trim() && !memberPending) add.mutate(memberJid.trim(), { onSuccess: () => setMemberJid('') }); }}>
                <Field label="Phone or JID">{(id) => <Input id={id} value={memberJid} disabled={!commandsEnabled || memberPending} onChange={(event) => setMemberJid(event.target.value)} />}</Field>
                <div className="flex items-end"><Button className="max-sm:w-full" type="submit" disabled={!commandsEnabled || !memberJid.trim() || memberPending} aria-busy={add.isPending || undefined}>{add.isPending ? 'Adding…' : 'Add member'}</Button></div>
              </form>
              {memberError ? <Fail error={memberError} command /> : null}
              {group.members.length ? (
                <ul className="grid">
                  {group.members.map((member) => {
                    const ref = member.memberRef ?? member.id;
                    return (
                      <li key={member.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b border-line py-3 last:border-b-0">
                        <span className="grid min-w-0"><strong className="truncate text-[13px] font-medium text-fg">{member.displayName ?? ref}</strong><small className="truncate font-mono text-xs text-fg-3">{ref}</small></span>
                        <Status tone={member.role === 'member' ? 'neutral' : 'ok'}>{humanizeToken(member.role)}</Status>
                        <div className="col-span-2 flex flex-wrap gap-2">
                          {member.role === 'member' ? <Button disabled={!commandsEnabled || memberPending} onClick={() => promote.mutate(ref)}>Promote</Button> : <Button disabled={!commandsEnabled || memberPending} onClick={() => demote.mutate(ref)}>Demote</Button>}
                          <Button variant="danger" disabled={!commandsEnabled || memberPending} onClick={() => setConfirm({ action: 'remove', member })}>Remove…</Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : <StateNotice kind="empty" title="No members" detail="No members are present in the projected detail." />}
            </div>
          </Panel>
        ) : null}

        {activeTab === 'settings' ? (
          <>
            <Panel title="Metadata" description="Subject and description are independent provider commands with independent outcomes.">
              <div className="grid gap-5">
                <div className="grid gap-2">
                  <Field label="Subject">{(id) => <Input id={id} value={subject} disabled={!commandsEnabled || updateName.isPending} onChange={(event) => setSubject(event.target.value)} />}</Field>
                  <Button className="justify-self-start max-sm:w-full" disabled={!commandsEnabled || !subjectDirty || updateName.isPending} aria-busy={updateName.isPending || undefined} onClick={() => updateName.mutate(subject)}>{updateName.isPending ? 'Submitting…' : 'Update subject'}</Button>
                  {updateName.error ? <Fail error={updateName.error} command /> : null}
                </div>
                <div className="grid gap-2 border-t border-line pt-4">
                  <Field label="Description">{(id) => <Textarea id={id} rows={3} value={description} disabled={!commandsEnabled || updateDescription.isPending} onChange={(event) => setDescription(event.target.value)} />}</Field>
                  <Button className="justify-self-start max-sm:w-full" disabled={!commandsEnabled || !descriptionDirty || updateDescription.isPending} aria-busy={updateDescription.isPending || undefined} onClick={() => updateDescription.mutate(description)}>{updateDescription.isPending ? 'Submitting…' : 'Update description'}</Button>
                  {updateDescription.error ? <Fail error={updateDescription.error} command /> : null}
                </div>
              </div>
            </Panel>

            <Panel title="Group settings" description="Each switch submits one explicit paired group-setting action.">
              <div>
                {settings.map(({ key, label, hint }) => {
                  const reported = typeof group[key] === 'boolean';
                  const checked = Boolean(group[key]);
                  return <Switch key={key} className="border-b border-line last:border-b-0" label={label} description={reported ? hint : `${hint} Current state is not reported, so this command is disabled.`} checked={checked} disabled={!commandsEnabled || setting.isPending || !reported} onChange={() => setting.mutate({ setting: key, enabled: !checked })} />;
                })}
                {setting.error ? <div className="pt-3"><Fail error={setting.error} command /></div> : null}
              </div>
            </Panel>

            <Panel title="Invite link" description="Reading uses the projection/cache path. Reset revokes the previous link and requires confirmation.">
              <div className="grid gap-3">
                {!commandsEnabled && !invite.data ? <StateNotice kind="empty" title="Invite unavailable" detail="The groups projection capability is absent; no invite request was sent." /> : invite.isPending ? <StateNotice kind="loading" title="Loading invite" /> : invite.error && !invite.data ? <Fail error={invite.error} onRetry={commandsEnabled ? () => invite.refetch() : undefined} /> : <code className="block break-all border border-line bg-recessed p-2 font-mono text-xs text-fg">{invite.data ?? 'No invite link reported'}</code>}
                <Button variant="danger" className="justify-self-start max-sm:w-full" disabled={!commandsEnabled} onClick={() => setConfirm({ action: 'reset-invite' })}>Reset invite link…</Button>
              </div>
            </Panel>

            <Panel title="Danger zone" description="Leaving removes the active account from this group and requires the exact group JID.">
              <Button variant="danger" disabled={!commandsEnabled} onClick={() => setConfirm({ action: 'leave' })}>Leave group…</Button>
            </Panel>
          </>
        ) : null}
      </div>

      <Dialog
        open={Boolean(confirm)}
        onClose={closeConfirm}
        closeDisabled={confirmPending}
        title={confirm?.action === 'remove' ? 'Remove member?' : confirm?.action === 'leave' ? 'Leave group?' : 'Reset invite link?'}
        footer={<><Button disabled={confirmPending} onClick={closeConfirm}>Cancel</Button><Button variant="danger" disabled={!commandsEnabled || confirmPending || (confirm?.action !== 'reset-invite' && confirmText !== (confirm?.action === 'leave' ? group.id : confirm?.member.memberRef ?? confirm?.member.id))} onClick={submitConfirm}>{confirmPending ? 'Submitting…' : 'Confirm command'}</Button></>}
      >
        <div className="grid gap-3">
          <p className="text-sm text-fg-2">{confirm?.action === 'reset-invite' ? 'The existing link will be revoked. Server acknowledgement is not refreshed projection state.' : 'Type the exact identifier to confirm. This command is not automatically retried.'}</p>
          {confirm && confirm.action !== 'reset-invite' ? <Field label={confirm.action === 'leave' ? 'Group JID' : 'Member reference'}>{(id) => <Input id={id} value={confirmText} autoComplete="off" autoFocus disabled={!commandsEnabled || confirmPending} onChange={(event) => setConfirmText(event.target.value)} />}</Field> : null}
          {confirmError ? <Fail error={confirmError} command /> : null}
        </div>
      </Dialog>
    </div>
  );
}
