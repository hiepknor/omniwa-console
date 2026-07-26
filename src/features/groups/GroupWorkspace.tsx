import { useEffect, useState } from 'react';
import { ApiFailure } from '@/api/envelopes';
import type { GroupMemberResource, GroupResource, GroupSetting } from '@/api/groups';
import type { ProjectionMeta } from '@/api/envelopes';
import { humanizeToken, relativeTime } from '@/lib/format';
import { Button, DescriptionItem, DescriptionList, Dialog, Drawer, Field, Input, Panel, StateNotice, Status, Switch, Textarea, type Tone } from '@/ui';
import {
  useAddGroupMember, useDemoteGroupMember, useGroupInvite, useGroup,
  useLeaveGroup, usePromoteGroupMember, useRemoveGroupMember,
  useResetInvite, useSendGroupText, useUpdateGroupSetting, useUpdateGroup,
} from './hooks';

type Confirm = { action: 'remove'; member: GroupMemberResource } | { action: 'leave' } | { action: 'reset-invite' };
const settings: Array<{ key: GroupSetting; label: string; hint: string }> = [
  { key: 'announce', label: 'Announcement only', hint: 'Only admins can post.' },
  { key: 'locked', label: 'Locked metadata', hint: 'Only admins can edit group information.' },
  { key: 'joinApproval', label: 'Join approval', hint: 'New members require approval.' },
  { key: 'adminsOnlyAdd', label: 'Admin member add', hint: 'Only admins can add members.' },
];

function Fail({ error, command, stale, onRetry }: { error: unknown; command?: boolean; stale?: boolean; onRetry?: () => void }) {
  const f = error instanceof ApiFailure ? error : undefined;
  return <StateNotice kind="error" title={command ? 'Command failed' : stale ? 'Showing last known data' : 'Read failed'} detail={f?.message ?? 'An unexpected error occurred.'} requestId={f?.requestId} action={onRetry ? <Button onClick={onRetry}>Retry</Button> : undefined} />;
}
function Ack({ action }: { action: string }) { return <StateNotice kind="info" title={`${action} accepted`} detail="The refreshed group projection remains authoritative; acknowledgement does not prove provider completion." />; }
function ProjectionLine({ meta }: { meta?: ProjectionMeta }) {
  if (!meta?.syncStatus) return null;
  const tone: Tone = meta.syncStatus === 'ready' ? 'ok' : meta.syncStatus === 'failed' ? 'failed' : meta.syncStatus === 'stale' ? 'degraded' : 'pending';
  return <Status tone={tone}>Projection {meta.syncStatus.replace('_', ' ')}</Status>;
}
export function GroupWorkspace({ groupId, enabled, outboundEnabled, onClose, onLeft }: { groupId: string; enabled: boolean; outboundEnabled: boolean; onClose: () => void; onLeft: () => void }) {
  const query = useGroup(groupId, enabled);
  const group = query.data?.resource;
  return (
    <Drawer open onClose={onClose} title={group?.subject ?? 'Group details'} subtitle={groupId}>
      {query.isPending ? (
        <StateNotice kind="loading" title="Loading group" />
      ) : query.error && !group ? (
        <Fail error={query.error} onRetry={() => query.refetch()} />
      ) : group ? (
        <div className="grid gap-4">
          <div className="flex items-center justify-between gap-3">
            <Status tone={group.status === 'active' ? 'ok' : 'degraded'}>{humanizeToken(group.status ?? 'unreported')}</Status>
            <ProjectionLine meta={query.data?.meta} />
          </div>
          {query.error ? <Fail error={query.error} stale onRetry={() => query.refetch()} /> : null}
          <GroupWorkspaceContent group={group} outboundEnabled={outboundEnabled} onLeft={onLeft} />
        </div>
      ) : (
        <StateNotice kind="empty" title="Not returned" detail="The projected group detail was not returned." />
      )}
    </Drawer>
  );
}

function GroupWorkspaceContent({ group, outboundEnabled, onLeft }: { group: GroupResource; outboundEnabled: boolean; onLeft: () => void }) {
  const [subject, setSubject] = useState(group.subject ?? '');
  const [description, setDescription] = useState(group.description ?? '');
  const [memberJid, setMemberJid] = useState('');
  const [confirm, setConfirm] = useState<Confirm>();
  const [confirmText, setConfirmText] = useState('');
  const [sendOpen, setSendOpen] = useState(false);
  const [sendText, setSendText] = useState('');
  const [commandAck, setCommandAck] = useState<string>();
  const update = useUpdateGroup(group.id);
  const setting = useUpdateGroupSetting(group.id);
  const add = useAddGroupMember(group.id);
  const promote = usePromoteGroupMember(group.id);
  const demote = useDemoteGroupMember(group.id);
  const remove = useRemoveGroupMember(group.id);
  const leave = useLeaveGroup(group.id);
  const invite = useGroupInvite(group.id, true);
  const resetInvite = useResetInvite(group.id);
  const send = useSendGroupText(group.id);
  useEffect(() => { setSubject(group.subject ?? ''); setDescription(group.description ?? ''); }, [group.description, group.subject]);
  const metadataDirty = subject !== (group.subject ?? '') || description !== (group.description ?? '');
  const memberPending = add.isPending || promote.isPending || demote.isPending || remove.isPending;
  const memberError = add.error ?? promote.error ?? demote.error ?? remove.error;
  const lastAck = commandAck ?? (update.data ? 'Metadata update' : setting.data ? 'Setting update' : add.data ? 'Member add' : promote.data ? 'Member promotion' : demote.data ? 'Member demotion' : undefined);
  const closeConfirm = () => { setConfirm(undefined); setConfirmText(''); remove.reset(); leave.reset(); resetInvite.reset(); };
  const submitConfirm = () => {
    if (!confirm) return;
    if (confirm.action === 'remove') { const ref = confirm.member.memberRef ?? confirm.member.id; if (confirmText !== ref || remove.isPending) return; remove.mutate(ref, { onSuccess: () => { setCommandAck('Member removal'); closeConfirm(); } }); }
    if (confirm.action === 'leave') { if (confirmText !== group.id || leave.isPending) return; leave.mutate(undefined, { onSuccess: () => { closeConfirm(); onLeft(); } }); }
    if (confirm.action === 'reset-invite' && !resetInvite.isPending) resetInvite.mutate(undefined, { onSuccess: () => { setCommandAck('Invite-link reset'); closeConfirm(); } });
  };
  const confirmPending = confirm?.action === 'remove' ? remove.isPending : confirm?.action === 'leave' ? leave.isPending : resetInvite.isPending;
  const confirmError = confirm?.action === 'remove' ? remove.error : confirm?.action === 'leave' ? leave.error : resetInvite.error;

  return (
    <div className="grid gap-4">
      {lastAck ? <Ack action={lastAck} /> : null}

      <Panel title="Group facts" description="Persisted group and membership facts." bodyClassName="pt-2">
        <DescriptionList>
          <DescriptionItem label="Group JID" mono>{group.id}</DescriptionItem>
          <DescriptionItem label="Status">{humanizeToken(group.status ?? 'unreported')}</DescriptionItem>
          <DescriptionItem label="Members">{String(group.memberCount ?? 'Not reported')}</DescriptionItem>
          <DescriptionItem label="Admins">{String(group.adminCount ?? 'Not reported')}</DescriptionItem>
          <DescriptionItem label="Updated">{relativeTime(group.updatedAt) || 'Not reported'}</DescriptionItem>
        </DescriptionList>
      </Panel>

      <Panel title="Metadata" description="Only changed fields are submitted; a partial failure is not automatically retried.">
        <div className="grid gap-3">
          <Field label="Subject">{(id) => <Input id={id} value={subject} disabled={update.isPending} onChange={(e) => setSubject(e.target.value)} />}</Field>
          <Field label="Description">{(id) => <Textarea id={id} rows={3} value={description} disabled={update.isPending} onChange={(e) => setDescription(e.target.value)} />}</Field>
          <Button disabled={!metadataDirty || update.isPending} onClick={() => update.mutate({ ...(subject !== (group.subject ?? '') ? { subject } : {}), ...(description !== (group.description ?? '') ? { description } : {}) })}>{update.isPending ? 'Submitting…' : 'Update metadata'}</Button>
          {update.error ? <Fail error={update.error} command /> : null}
        </div>
      </Panel>

      <Panel title="Group settings" description="Each switch submits one explicit paired group-setting action.">
        <div>
          {settings.map(({ key, label, hint }) => {
            const checked = Boolean(group[key]);
            return (
              <Switch key={key} className="border-b border-line last:border-b-0" label={label} description={hint} checked={checked} disabled={setting.isPending} onChange={() => setting.mutate({ setting: key, enabled: !checked })} />
            );
          })}
          {setting.error ? <div className="pt-3"><Fail error={setting.error} command /></div> : null}
        </div>
      </Panel>

      <Panel title="Invite link" description="Reading uses the projection/cache path. Reset revokes the previous link and requires confirmation.">
        <div className="grid gap-3">
          {invite.isPending ? <StateNotice kind="loading" title="Loading invite" /> : invite.error && !invite.data ? <Fail error={invite.error} onRetry={() => invite.refetch()} /> : <code className="block p-2 font-mono text-xs text-fg bg-recessed border border-line break-all">{invite.data ?? 'No invite link reported'}</code>}
          <Button variant="danger" onClick={() => setConfirm({ action: 'reset-invite' })}>Reset invite link…</Button>
        </div>
      </Panel>

      <Panel title="Members" description="Member commands act on the linked provider; refreshed projection remains authoritative.">
        <div className="grid gap-3">
          <form className="grid grid-cols-[minmax(0,1fr)_auto] gap-2" onSubmit={(e) => { e.preventDefault(); if (memberJid.trim() && !memberPending) add.mutate(memberJid.trim(), { onSuccess: () => setMemberJid('') }); }}>
            <Field label="Phone or JID">{(id) => <Input id={id} value={memberJid} disabled={memberPending} onChange={(e) => setMemberJid(e.target.value)} />}</Field>
            <div className="flex items-end"><Button type="submit" disabled={!memberJid.trim() || memberPending}>{add.isPending ? 'Adding…' : 'Add member'}</Button></div>
          </form>
          {memberError ? <Fail error={memberError} command /> : null}
          {group.members.length ? (
            <ul className="grid">
              {group.members.map((member) => {
                const ref = member.memberRef ?? member.id;
                return (
                  <li key={member.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 py-2 border-b border-line last:border-b-0">
                    <span className="grid min-w-0"><strong className="truncate text-[13px] font-medium text-fg">{member.displayName ?? ref}</strong><small className="truncate font-mono text-xs text-fg-3">{ref}</small></span>
                    <Status tone={member.role === 'member' ? 'neutral' : 'ok'}>{humanizeToken(member.role)}</Status>
                    <div className="col-span-2 flex gap-2">
                      {member.role === 'member' ? <Button disabled={memberPending} onClick={() => promote.mutate(ref)}>Promote</Button> : <Button disabled={memberPending} onClick={() => demote.mutate(ref)}>Demote</Button>}
                      <Button variant="danger" disabled={memberPending} onClick={() => setConfirm({ action: 'remove', member })}>Remove…</Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : <StateNotice kind="empty" title="No members" detail="No members are present in the projected detail." />}
        </div>
      </Panel>

      <Panel title="Send text" description="Requires outbound-rate-limit support; acknowledgement is not delivery.">
        <div className="grid gap-3">
          <Button disabled={!outboundEnabled} onClick={() => { send.reset(); setSendText(''); setSendOpen(true); }}>Send group text…</Button>
          {!outboundEnabled ? <StateNotice kind="empty" title="Sending unavailable" detail="The backend does not advertise outbound_rate_limit; group sends remain disabled." /> : null}
        </div>
      </Panel>

      <Panel title="Danger zone" description="Leaving removes the active account from this group and requires the exact group JID.">
        <Button variant="danger" onClick={() => setConfirm({ action: 'leave' })}>Leave group…</Button>
      </Panel>

      <Dialog
        open={Boolean(confirm)}
        onClose={closeConfirm}
        closeDisabled={confirmPending}
        title={confirm?.action === 'remove' ? 'Remove member?' : confirm?.action === 'leave' ? 'Leave group?' : 'Reset invite link?'}
        footer={<><Button disabled={confirmPending} onClick={closeConfirm}>Cancel</Button><Button variant="danger" disabled={confirmPending || (confirm?.action !== 'reset-invite' && confirmText !== (confirm?.action === 'leave' ? group.id : confirm?.member.memberRef ?? confirm?.member.id))} onClick={submitConfirm}>{confirmPending ? 'Submitting…' : 'Confirm command'}</Button></>}
      >
        <div className="grid gap-3">
          <p className="text-sm text-fg-2">{confirm?.action === 'reset-invite' ? 'The existing link will be revoked. Server acknowledgement is not refreshed projection state.' : 'Type the exact identifier to confirm. This command is not automatically retried.'}</p>
          {confirm && confirm.action !== 'reset-invite' ? <Field label={confirm.action === 'leave' ? 'Group JID' : 'Member reference'}>{(id) => <Input id={id} value={confirmText} autoComplete="off" autoFocus disabled={confirmPending} onChange={(e) => setConfirmText(e.target.value)} />}</Field> : null}
          {confirmError ? <Fail error={confirmError} command /> : null}
        </div>
      </Dialog>

      <Dialog
        open={sendOpen}
        onClose={() => setSendOpen(false)}
        closeDisabled={send.isPending}
        title="Send text to group"
        footer={send.data ? <Button variant="primary" onClick={() => setSendOpen(false)}>Close acknowledgement</Button> : <><Button disabled={send.isPending} onClick={() => setSendOpen(false)}>Cancel</Button><Button variant="primary" disabled={!sendText.trim() || send.isPending} onClick={() => send.mutate(sendText.trim())}>{send.isPending ? 'Submitting…' : 'Send text'}</Button></>}
      >
        <div className="grid gap-3">
          <p className="text-sm text-fg-2">Acknowledgement does not prove WhatsApp delivery. Inspect projected conversation history before retrying an uncertain outcome.</p>
          <Field label="Message">{(id) => <Textarea id={id} rows={4} value={sendText} maxLength={10_000} disabled={send.isPending || Boolean(send.data)} onChange={(e) => setSendText(e.target.value)} />}</Field>
          {send.data ? <Ack action="Group text send" /> : null}
          {send.error ? <Fail error={send.error} command /> : null}
        </div>
      </Dialog>
    </div>
  );
}
