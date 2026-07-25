import { useEffect, useState } from 'react';
import type { GroupMemberResource, GroupResource, GroupSetting } from '@/api/groups';
import { ApiFailureNotice, Button, CommandAck, Dialog, Field, Inspector, ProjectionStatus, StateNotice, Status, Surface } from '@/components/v2';
import { humanizeToken, relativeTime } from '@/lib/format';
import {
  useAddGroupMemberV2, useDemoteGroupMemberV2, useGroupInviteV2, useGroupV2,
  useLeaveGroupV2, usePromoteGroupMemberV2, useRemoveGroupMemberV2,
  useResetInviteV2, useSendGroupTextV2, useUpdateGroupSettingV2, useUpdateGroupV2,
} from './hooks';

type Confirm = { action: 'remove'; member: GroupMemberResource } | { action: 'leave' } | { action: 'reset-invite' };
const settings: Array<{ key: GroupSetting; label: string; hint: string }> = [
  { key: 'announce', label: 'Announcement only', hint: 'Only admins can post.' },
  { key: 'locked', label: 'Locked metadata', hint: 'Only admins can edit group information.' },
  { key: 'joinApproval', label: 'Join approval', hint: 'New members require approval.' },
  { key: 'adminsOnlyAdd', label: 'Admin member add', hint: 'Only admins can add members.' },
];

function Ack({ action }: { action: string }) { return <CommandAck action={action} note="The refreshed group projection remains authoritative; acknowledgement does not prove provider completion." />; }

export function GroupWorkspaceV2({ groupId, enabled, outboundEnabled, onClose, onLeft }: { groupId: string; enabled: boolean; outboundEnabled: boolean; onClose: () => void; onLeft: () => void }) {
  const query = useGroupV2(groupId, enabled);
  const group = query.data?.resource;
  return <Inspector titleId="group-v2-details" eyebrow="Group workspace" title={group?.subject ?? 'Group details'} subtitle={<span className="ui-v2-mono">{groupId}</span>} status={group ? <Status tone={group.status === 'active' ? 'healthy' : 'degraded'}>{humanizeToken(group.status ?? 'unreported')}</Status> : undefined} modal onClose={onClose}>
    {query.isPending ? <StateNotice value={{ axis: 'resource', state: 'initial-loading' }} /> : query.error && !group ? <ApiFailureNotice error={query.error} onRetry={() => query.refetch()} /> : group ? <><ProjectionStatus meta={query.data?.meta} />{query.error ? <ApiFailureNotice error={query.error} stale onRetry={() => query.refetch()} /> : null}<GroupWorkspaceContent group={group} outboundEnabled={outboundEnabled} onLeft={onLeft} /></> : <StateNotice value={{ axis: 'resource', state: 'empty' }} detail="The projected group detail was not returned." />}
  </Inspector>;
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
  const update = useUpdateGroupV2(group.id);
  const setting = useUpdateGroupSettingV2(group.id);
  const add = useAddGroupMemberV2(group.id);
  const promote = usePromoteGroupMemberV2(group.id);
  const demote = useDemoteGroupMemberV2(group.id);
  const remove = useRemoveGroupMemberV2(group.id);
  const leave = useLeaveGroupV2(group.id);
  const invite = useGroupInviteV2(group.id, true);
  const resetInvite = useResetInviteV2(group.id);
  const send = useSendGroupTextV2(group.id);
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

  return <div className="ui-v2-stack">
    {lastAck ? <Ack action={lastAck} /> : null}
    <Surface title="Group facts" description="Persisted group and membership facts."><dl className="ui-v2-detail-list"><div><dt>Group JID</dt><dd className="ui-v2-mono">{group.id}</dd></div><div><dt>Status</dt><dd>{humanizeToken(group.status ?? 'unreported')}</dd></div><div><dt>Members</dt><dd>{group.memberCount ?? 'Not reported'}</dd></div><div><dt>Admins</dt><dd>{group.adminCount ?? 'Not reported'}</dd></div><div><dt>Updated</dt><dd title={group.updatedAt}>{relativeTime(group.updatedAt) || 'Not reported'}</dd></div></dl></Surface>
    <Surface title="Metadata" description="Only changed fields are submitted; a partial failure is not automatically retried."><div className="ui-v2-stack"><Field label="Subject" value={subject} disabled={update.isPending} onChange={(event) => setSubject(event.target.value)} /><label className="ui-v2-field"><span className="ui-v2-field__label">Description</span><textarea className="ui-v2-input ui-v2-textarea" rows={3} value={description} disabled={update.isPending} onChange={(event) => setDescription(event.target.value)} /></label><Button disabled={!metadataDirty || update.isPending} onClick={() => update.mutate({ ...(subject !== (group.subject ?? '') ? { subject } : {}), ...(description !== (group.description ?? '') ? { description } : {}) })}>{update.isPending ? 'Submitting…' : 'Update metadata'}</Button>{update.error ? <><ApiFailureNotice error={update.error} command /><p className="ui-v2-generated-note">If both fields changed, one command may have completed before the failure. Inspect the refreshed projection before another submission.</p></> : null}</div></Surface>
    <Surface title="Group settings" description="Each switch submits one explicit paired group-setting action."><div className="ui-v2-settings-list">{settings.map(({ key, label, hint }) => { const checked = Boolean(group[key]); return <label className="ui-v2-setting" key={key}><span><strong>{label}</strong><small>{hint}</small></span><input type="checkbox" checked={checked} disabled={setting.isPending} onChange={() => setting.mutate({ setting: key, enabled: !checked })} /></label>; })}{setting.error ? <ApiFailureNotice error={setting.error} command /> : null}</div></Surface>
    <Surface title="Invite link" description="Reading uses the projection/cache path. Reset revokes the previous link and requires confirmation."><div className="ui-v2-stack">{invite.isPending ? <StateNotice value={{ axis: 'resource', state: 'initial-loading' }} /> : invite.error && !invite.data ? <ApiFailureNotice error={invite.error} onRetry={() => invite.refetch()} /> : <><code className="ui-v2-code-block">{invite.data ?? 'No invite link reported'}</code>{invite.error ? <ApiFailureNotice error={invite.error} stale onRetry={() => invite.refetch()} /> : null}</>}<Button variant="danger" onClick={() => setConfirm({ action: 'reset-invite' })}>Reset invite link…</Button></div></Surface>
    <Surface title="Members" description="Member commands act on the linked provider; refreshed projection remains authoritative."><form className="ui-v2-inline-form" onSubmit={(event) => { event.preventDefault(); if (memberJid.trim() && !memberPending) add.mutate(memberJid.trim(), { onSuccess: () => setMemberJid('') }); }}><Field label="Phone or JID" value={memberJid} disabled={memberPending} onChange={(event) => setMemberJid(event.target.value)} /><Button type="submit" disabled={!memberJid.trim() || memberPending}>{add.isPending ? 'Adding…' : 'Add member'}</Button></form>{memberError ? <ApiFailureNotice error={memberError} command /> : null}{group.members.length ? <ul className="ui-v2-member-list">{group.members.map((member) => { const ref = member.memberRef ?? member.id; return <li key={member.id}><span><strong>{member.displayName ?? ref}</strong><small className="ui-v2-mono">{ref}</small></span><Status tone={member.role === 'member' ? 'neutral' : 'healthy'}>{humanizeToken(member.role)}</Status><div>{member.role === 'member' ? <Button disabled={memberPending} onClick={() => promote.mutate(ref)}>Promote</Button> : <Button disabled={memberPending} onClick={() => demote.mutate(ref)}>Demote</Button>}<Button variant="danger" disabled={memberPending} onClick={() => setConfirm({ action: 'remove', member })}>Remove…</Button></div></li>; })}</ul> : <StateNotice value={{ axis: 'resource', state: 'empty' }} detail="No members are present in the projected detail." />}</Surface>
    <Surface title="Send text" description="Requires outbound-rate-limit support; acknowledgement is not delivery."><Button disabled={!outboundEnabled} onClick={() => { send.reset(); setSendText(''); setSendOpen(true); }}>Send group text…</Button>{!outboundEnabled ? <StateNotice value={{ axis: 'capability', state: 'unsupported' }} detail="The backend does not advertise outbound_rate_limit; group sends remain disabled." /> : null}</Surface>
    <Surface title="Danger zone" description="Leaving removes the active account from this group and requires the exact group JID."><Button variant="danger" onClick={() => setConfirm({ action: 'leave' })}>Leave group…</Button></Surface>

    {confirm ? <Dialog titleId="group-v2-confirm" eyebrow="Group command" title={confirm.action === 'remove' ? 'Remove member?' : confirm.action === 'leave' ? 'Leave group?' : 'Reset invite link?'} description={confirm.action === 'reset-invite' ? 'The existing link will be revoked. Server acknowledgement is not refreshed projection state.' : 'Type the exact identifier to confirm. This command is not automatically retried.'} canClose={!confirmPending} onClose={closeConfirm} actions={<><Button disabled={confirmPending} onClick={closeConfirm}>Cancel</Button><Button variant="danger" disabled={confirmPending || (confirm.action !== 'reset-invite' && confirmText !== (confirm.action === 'leave' ? group.id : confirm.member.memberRef ?? confirm.member.id))} onClick={submitConfirm}>{confirmPending ? 'Submitting…' : 'Confirm command'}</Button></>}>{confirm.action !== 'reset-invite' ? <Field label={confirm.action === 'leave' ? 'Group JID' : 'Member reference'} value={confirmText} autoComplete="off" autoFocus disabled={confirmPending} onChange={(event) => setConfirmText(event.target.value)} /> : null}{confirmError ? <ApiFailureNotice error={confirmError} command /> : null}</Dialog> : null}
    {sendOpen ? <Dialog titleId="group-v2-send" eyebrow="Bounded send" title="Send text to group" description="Acknowledgement does not prove WhatsApp delivery. Inspect projected conversation history before retrying an uncertain outcome." canClose={!send.isPending} onClose={() => setSendOpen(false)} actions={send.data ? <Button variant="primary" onClick={() => setSendOpen(false)}>Close acknowledgement</Button> : <><Button disabled={send.isPending} onClick={() => setSendOpen(false)}>Cancel</Button><Button variant="primary" disabled={!sendText.trim() || send.isPending} onClick={() => send.mutate(sendText.trim())}>{send.isPending ? 'Submitting…' : 'Send text'}</Button></>}><label className="ui-v2-field"><span className="ui-v2-field__label">Message</span><textarea className="ui-v2-input ui-v2-textarea" rows={4} value={sendText} maxLength={10_000} disabled={send.isPending || Boolean(send.data)} onChange={(event) => setSendText(event.target.value)} /></label>{send.data ? <Ack action="Group text send" /> : null}{send.error ? <><ApiFailureNotice error={send.error} command /><p className="ui-v2-generated-note">Outcome may be uncertain. No one-click retry is offered.</p></> : null}</Dialog> : null}
  </div>;
}
