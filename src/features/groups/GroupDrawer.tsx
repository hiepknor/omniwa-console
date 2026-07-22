import { useEffect, useId, useRef, useState } from 'react';
import type { GroupMemberResource, GroupResource, GroupSetting } from '@/api/groups';
import { CategoryPill, StatusIndicator } from '@/components/badges';
import { InlineError } from '@/components/InlineError';
import { ProjectionNotice } from '@/components/ProjectionNotice';
import { SettingToggle } from '@/components/SettingToggle';
import { TypedConfirmationDialog } from '@/components/TypedConfirmationDialog';
import { ModalDialog } from '@/components/dialog/ModalDialog';
import { DetailDrawer, DetailDrawerState, DrawerIdentifier } from '@/components/drawer/DetailDrawer';
import { relativeTime } from '@/lib/format';
import { useResilientReadState } from '@/lib/query-state';
import {
  useAddGroupMember,
  useDemoteGroupMember,
  useGroup,
  useGroupInviteLink,
  useLeaveGroup,
  usePromoteGroupMember,
  useRefreshGroupInviteLink,
  useRemoveGroupMember,
  useSendGroupText,
  useUpdateGroup,
  useUpdateGroupSetting,
} from './hooks';

const GROUP_SETTINGS: { key: GroupSetting; label: string; hint: string }[] = [
  { key: 'announce', label: 'Announce only', hint: 'Only admins can send messages' },
  { key: 'locked', label: 'Locked info', hint: 'Only admins can edit group info' },
  { key: 'joinApproval', label: 'Approve new members', hint: 'Admins approve join requests' },
  { key: 'adminsOnlyAdd', label: 'Admins add members', hint: 'Only admins can add participants' },
];

function groupStatusDot(status: string | undefined) {
  switch (status?.toLowerCase()) {
    case 'active': return 'dot-ok';
    case 'suspended': return 'dot-failed';
    case 'loading': return 'dot-pending';
    default: return 'dot-info';
  }
}

function MemberRecord({ member, busy, canManage, onPromote, onDemote, onRemove }: {
  member: GroupMemberResource;
  busy: boolean;
  canManage: boolean;
  onPromote: () => void;
  onDemote: () => void;
  onRemove: () => void;
}) {
  const memberRef = member.memberRef ?? member.id;
  return (
    <article className="groups-member-record">
      <dl>
        <dt>Member</dt><dd>{member.displayName ? member.displayName : <span className="mono">{memberRef}</span>}</dd>
        <dt>Reference</dt><dd><span className="mono" title={memberRef}>{memberRef}</span></dd>
        <dt>Role</dt><dd><CategoryPill compact>{member.role}</CategoryPill></dd>
      </dl>
      {canManage && (
        <div className="groups-member-actions">
          {member.role === 'member'
            ? <button className="btn sm" type="button" disabled={busy} onClick={onPromote}>Promote</button>
            : <button className="btn sm" type="button" disabled={busy} onClick={onDemote}>Demote</button>}
          <button className="btn sm danger" type="button" disabled={busy} onClick={onRemove}>Remove</button>
        </div>
      )}
    </article>
  );
}

function SendTextDialog({ groupId, token, onClose }: { groupId: string; token: string | undefined; onClose: () => void }) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const descriptionId = useId();
  const send = useSendGroupText(groupId, token);

  return (
    <ModalDialog titleId="group-send-title" eyebrow="Message command" title="Send text to group" context={groupId} onClose={onClose} canClose={!send.isPending} busy={send.isPending} initialFocusRef={textareaRef} onSubmit={(event) => { event.preventDefault(); send.mutate(text.trim(), { onSuccess: onClose }); }} closeLabel="Close send group text dialog" describedBy={descriptionId} secondaryAction={<button className="btn" type="button" disabled={send.isPending} onClick={onClose}>Cancel</button>} primaryAction={<button className="btn primary" type="submit" disabled={send.isPending || !text.trim()}>{send.isPending ? 'Submitting…' : 'Send'}</button>}>
      <div className="field">
        <label htmlFor="group-send-text">Text message</label>
        <textarea ref={textareaRef} id="group-send-text" className="input groups-textarea" rows={5} value={text} disabled={send.isPending} onChange={(event) => setText(event.target.value)} />
        <p className="help" id={descriptionId}>Command outcome appears immediately; delivery remains separate and follows the message pipeline.</p>
      </div>
      {send.error && <InlineError error={send.error} announce onRetry={() => send.mutate(text.trim(), { onSuccess: onClose })} />}
    </ModalDialog>
  );
}

function GroupDrawerContent({ group, instanceId, token, onClose }: { group: GroupResource; instanceId: string | undefined; token: string | undefined; onClose: () => void }) {
  const [subject, setSubject] = useState(group.subject ?? '');
  const [description, setDescription] = useState(group.description ?? '');
  const [memberJid, setMemberJid] = useState('');
  const [removeTarget, setRemoveTarget] = useState<GroupMemberResource>();
  const [confirmLeave, setConfirmLeave] = useState(false);
  const invite = useRefreshGroupInviteLink(instanceId, group.id, token);
  const inviteLink = useGroupInviteLink(instanceId, group.id, token);
  const settingMutation = useUpdateGroupSetting(group.id, instanceId, token);
  const leave = useLeaveGroup(group.id, instanceId, token);
  const update = useUpdateGroup(group.id, instanceId, token);
  const addMember = useAddGroupMember(instanceId, group.id, token);
  const promote = usePromoteGroupMember(instanceId, group.id, token);
  const demote = useDemoteGroupMember(instanceId, group.id, token);
  const remove = useRemoveGroupMember(instanceId, group.id, token);
  const members = group.members;
  const memberCommandError = addMember.error ?? promote.error ?? demote.error ?? remove.error;
  const memberBusy = addMember.isPending || promote.isPending || demote.isPending || remove.isPending;
  const metadataChanged = subject !== (group.subject ?? '') || description !== (group.description ?? '');

  useEffect(() => {
    setSubject(group.subject ?? '');
    setDescription(group.description ?? '');
  }, [group.description, group.subject]);

  const retryMemberCommand = () => {
    if (addMember.error && addMember.variables) addMember.mutate(addMember.variables);
    else if (promote.error && promote.variables) promote.mutate(promote.variables);
    else if (demote.error && demote.variables) demote.mutate(demote.variables);
    else if (remove.error && remove.variables) remove.mutate(remove.variables);
  };
  // Only send fields that actually changed, so a rename never overwrites the
  // group's description (and vice versa).
  const submitMetadata = () => {
    const changed: { subject?: string; description?: string } = {};
    if (subject !== (group.subject ?? '')) changed.subject = subject;
    if (description !== (group.description ?? '')) changed.description = description;
    update.mutate(changed);
  };

  return (
    <>
      <section aria-labelledby="group-facts-title">
        <h3 id="group-facts-title">Facts</h3>
        <dl className="kv">
          <dt>Group JID</dt><dd><span className="mono" title={group.id}>{group.id}</span></dd>
          <dt>Members</dt><dd className="num">{group.memberCount ?? '—'}</dd>
          <dt>Admins</dt><dd className="num">{group.adminCount ?? '—'}</dd>
          <dt>Announce only</dt><dd>{group.announce ? 'yes' : 'no'}</dd>
          <dt>Created</dt><dd><span className="ts" title={group.updatedAt}>{relativeTime(group.updatedAt) || '—'}</span></dd>
        </dl>
      </section>

      <section aria-labelledby="group-metadata-title">
        <h3 id="group-metadata-title">Metadata</h3>
        <form className="groups-metadata-form" onSubmit={(event) => { event.preventDefault(); submitMetadata(); }}>
          <div className="field"><label htmlFor="group-subject">Subject</label><input id="group-subject" className="input" value={subject} disabled={update.isPending} onChange={(event) => setSubject(event.target.value)} /></div>
          <div className="field"><label htmlFor="group-description">Description</label><textarea id="group-description" className="input groups-description" rows={3} value={description} disabled={update.isPending} onChange={(event) => setDescription(event.target.value)} /></div>
          <button className="btn" type="submit" disabled={update.isPending || !metadataChanged}>{update.isPending ? 'Updating…' : 'Update metadata'}</button>
          {update.error && <InlineError error={update.error} announce onRetry={submitMetadata} />}
        </form>
      </section>

      <section aria-labelledby="group-settings-title">
        <span className="eyebrow">Configuration</span>
        <h3 id="group-settings-title">Group settings</h3>
        <div className="toggle-list">
          {GROUP_SETTINGS.map(({ key, label, hint }) => {
            const checked = Boolean(group[key]);
            const pending = settingMutation.isPending && settingMutation.variables?.setting === key;
            return (
              <SettingToggle
                key={key}
                label={label}
                hint={hint}
                checked={checked}
                pending={pending}
                onChange={() => settingMutation.mutate({ setting: key, enabled: !checked })}
              />
            );
          })}
        </div>
        {settingMutation.error && <InlineError error={settingMutation.error} announce onRetry={() => settingMutation.variables && settingMutation.mutate(settingMutation.variables)} />}
      </section>

      <section aria-labelledby="group-invite-title">
        <div className="drawer-section-head"><h3 id="group-invite-title">Invite link</h3><button className="btn" type="button" disabled={invite.isPending} onClick={() => invite.mutate()}>{invite.isPending ? 'Resetting…' : 'Reset link'}</button></div>
        {inviteLink.data ? (
          <DrawerIdentifier value={inviteLink.data} label="Copy group invite link" />
        ) : inviteLink.isError ? (
          <InlineError error={inviteLink.error} onRetry={inviteLink.refetch} />
        ) : (
          <p className="help">{inviteLink.isLoading ? 'Loading invite link…' : 'No invite link.'}</p>
        )}
        <p className="help">Resetting revokes the previous link and issues a new one.</p>
        {invite.error && <InlineError error={invite.error} announce onRetry={() => invite.mutate()} />}
      </section>

      <section aria-labelledby="group-members-title">
        <div className="drawer-section-head"><div><h3 id="group-members-title">Members</h3></div><span className="num groups-member-count">{members.length}</span></div>
        <form className="groups-add-member" onSubmit={(event) => {
          event.preventDefault();
          addMember.mutate(memberJid.trim(), { onSuccess: () => setMemberJid('') });
        }}>
          <label className="visually-hidden" htmlFor="group-member-jid">Member phone or JID</label>
          <input id="group-member-jid" className="input" placeholder="Member phone number" value={memberJid} disabled={memberBusy} onChange={(event) => setMemberJid(event.target.value)} />
          <button className="btn" type="submit" disabled={memberBusy || !memberJid.trim()}>{addMember.isPending ? 'Adding…' : 'Add member'}</button>
        </form>
        {memberCommandError && <InlineError error={memberCommandError} announce onRetry={retryMemberCommand} />}
        {members.length === 0 ? (
          <div className="empty groups-members-state">No members in this group.</div>
        ) : (
          <div className="groups-member-list" role="region" aria-label="Group members">
            {members.map((member) => {
              const memberRef = member.memberRef ?? member.id;
              return <MemberRecord key={member.id} member={member} busy={memberBusy} canManage onPromote={() => promote.mutate(memberRef)} onDemote={() => demote.mutate(memberRef)} onRemove={() => setRemoveTarget(member)} />;
            })}
          </div>
        )}
      </section>

      <section aria-labelledby="group-danger-title">
        <span className="eyebrow">Danger zone</span>
        <h3 id="group-danger-title">Leave group</h3>
        <div className="action-group destructive">
          <span>Leaving removes this account from the group. Requires typed confirmation.</span>
          <div className="actions">
            <button className="btn danger" type="button" onClick={() => setConfirmLeave(true)}>Leave group…</button>
          </div>
        </div>
      </section>
      {removeTarget && (() => {
        const memberRef = removeTarget.memberRef ?? removeTarget.id;
        return <TypedConfirmationDialog title="Remove group member" description={<p>This removes the member from the group. It takes effect on the linked WhatsApp account.</p>} resourceId={memberRef} confirmValue={memberRef} confirmLabel="Remove member" pendingLabel="Removing…" error={remove.error} isPending={remove.isPending} onCancel={() => setRemoveTarget(undefined)} onConfirm={() => remove.mutate(memberRef, { onSuccess: () => setRemoveTarget(undefined) })} />;
      })()}
      {confirmLeave && (
        <TypedConfirmationDialog
          title="Leave group"
          description={<p>This removes {group.subject || 'this group'} from the linked WhatsApp account. You can only rejoin with a new invite.</p>}
          resourceId={group.id}
          confirmValue={group.id}
          confirmLabel="Leave group"
          pendingLabel="Leaving…"
          error={leave.error}
          isPending={leave.isPending}
          onCancel={() => { leave.reset(); setConfirmLeave(false); }}
          onConfirm={() => leave.mutate(undefined, { onSuccess: () => { setConfirmLeave(false); onClose(); } })}
        />
      )}
    </>
  );
}

export function GroupDrawer({ groupId, subject: initialSubject, instanceId, token, onClose }: {
  groupId: string;
  subject: string | undefined;
  instanceId: string | undefined;
  token: string | undefined;
  onClose: () => void;
}) {
  const [sendOpen, setSendOpen] = useState(false);
  const groupQuery = useGroup(instanceId, groupId, token);
  const readState = useResilientReadState(groupQuery, groupQuery.data?.resource !== undefined);
  const group = groupQuery.data?.resource;
  const title = group?.subject || initialSubject || 'Unnamed group';
  const headerStatus = group?.status ?? (readState.isInitialError ? 'error' : readState.isInitialLoading ? 'loading' : '—');

  return (
    <>
      <DetailDrawer titleId="group-detail-title" eyebrow="Group management" title={title} status={<StatusIndicator dotClass={groupStatusDot(headerStatus)}>{headerStatus}</StatusIndicator>} subtitle={<DrawerIdentifier value={groupId} label="Copy group identifier" />} className="groups-drawer" closeLabel="Close group details" suppressEscape={sendOpen} onClose={onClose}>
          {readState.isInitialLoading ? (
            <DetailDrawerState announce>Loading group details…</DetailDrawerState>
          ) : readState.isInitialError ? (
            <DetailDrawerState><InlineError error={readState.error} onRetry={groupQuery.refetch} /></DetailDrawerState>
          ) : !group ? (
            <DetailDrawerState>Group details are not available yet.</DetailDrawerState>
          ) : (
            <>
              <ProjectionNotice meta={groupQuery.data?.meta} />
              {readState.isStaleError && <section><InlineError error={readState.error} onRetry={groupQuery.refetch} /></section>}
              <GroupDrawerContent group={group} instanceId={instanceId} token={token} onClose={onClose} />
              <section aria-labelledby="group-send-command-title"><div className="drawer-section-head"><div><h3 id="group-send-command-title">Send text</h3><span className="drawer-note">One-off command to this group.</span></div><button className="btn" type="button" onClick={() => setSendOpen(true)}>Send text…</button></div></section>
            </>
          )}
      </DetailDrawer>
      {sendOpen && <SendTextDialog groupId={groupId} token={token} onClose={() => setSendOpen(false)} />}
    </>
  );
}
