import { useEffect, useMemo, useRef, useState } from 'react';
import type { GroupLocalStateRequest, GroupMemberResource, GroupResource } from '@/api/groups';
import { InlineError } from '@/components/InlineError';
import { TypedConfirmationDialog } from '@/components/TypedConfirmationDialog';
import { DetailDrawer } from '@/components/drawer/DetailDrawer';
import { useModalDialog } from '@/components/useModalDialog';
import { relativeTime } from '@/lib/format';
import { useResilientReadState } from '@/lib/query-state';
import {
  useAddGroupMember,
  useDemoteGroupMember,
  useGroup,
  useGroupMembers,
  usePromoteGroupMember,
  useRefreshGroupInviteLink,
  useRemoveGroupMember,
  useSendGroupText,
  useUpdateGroup,
  useUpdateGroupLocalState,
} from './hooks';

function groupStatusDot(status: string | undefined) {
  switch (status?.toLowerCase()) {
    case 'active':
    case 'synced': return 'dot-ok';
    case 'syncing':
    case 'pending': return 'dot-pending';
    case 'failed': return 'dot-failed';
    case 'archived': return 'dot-muted';
    default: return 'dot-info';
  }
}

function LocalStateSwitch({ label, checked, pending, disabled, onChange }: {
  label: string;
  checked: boolean;
  pending: boolean;
  disabled: boolean;
  onChange: () => void;
}) {
  return (
    <div className={`groups-state-row${pending ? ' is-pending' : ''}`}>
      <span><strong>{label}</strong><small>{pending ? 'Update pending…' : checked ? 'On' : 'Off'}</small></span>
      <button
        className={`btn chip groups-state-switch${checked ? ' is-on' : ''}`}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={`${label}: ${checked ? 'on' : 'off'}`}
        disabled={disabled}
        onClick={onChange}
      >
        <span aria-hidden="true" />
      </button>
    </div>
  );
}

function MemberRecord({ member, busy, onPromote, onDemote, onRemove }: {
  member: GroupMemberResource;
  busy: boolean;
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
        <dt>Role</dt><dd><span className="chip">{member.role ?? '—'}</span></dd>
        <dt>Status</dt><dd><span className="status sm"><span className={`dot ${groupStatusDot(member.status)}`} />{member.status ?? '—'}</span></dd>
        <dt>Joined</dt><dd><span className="ts" title={member.joinedAt}>{relativeTime(member.joinedAt) || '—'}</span></dd>
      </dl>
      <div className="groups-member-actions">
        <button className="btn sm" type="button" disabled={busy} title="Platform authorization is evaluated on submission." onClick={onPromote}>Promote</button>
        <button className="btn sm" type="button" disabled={busy} title="Platform authorization is evaluated on submission." onClick={onDemote}>Demote</button>
        <button className="btn sm danger" type="button" disabled={busy} onClick={onRemove}>Remove</button>
      </div>
    </article>
  );
}

function SendTextDialog({ groupId, onClose }: { groupId: string; onClose: () => void }) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const send = useSendGroupText(groupId);

  const dialogRef = useModalDialog<HTMLDivElement>({ onClose, canClose: !send.isPending, initialFocusRef: textareaRef });

  return (
    <div className="overlay !z-[60]" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !send.isPending) onClose();
    }}>
      <div ref={dialogRef} className="dialog" role="dialog" aria-modal="true" aria-labelledby="group-send-title" tabIndex={-1}>
        <header><b id="group-send-title">Send text to group</b><span className="mono">sendGroupTextMessage</span></header>
        <form onSubmit={(event) => {
          event.preventDefault();
          send.mutate(text.trim(), { onSuccess: onClose });
        }}>
          <div className="body">
            <div className="field">
              <label htmlFor="group-send-text">Text message</label>
              <textarea ref={textareaRef} id="group-send-text" className="input groups-textarea" rows={5} value={text} disabled={send.isPending} onChange={(event) => setText(event.target.value)} />
              <p className="help">Command outcome appears immediately; delivery remains separate and follows the message pipeline.</p>
            </div>
            {send.error && <InlineError error={send.error} announce onRetry={() => send.mutate(text.trim(), { onSuccess: onClose })} />}
          </div>
          <footer>
            <button className="btn" type="button" disabled={send.isPending} onClick={onClose}>Cancel</button>
            <button className="btn primary" type="submit" disabled={send.isPending || !text.trim()}>{send.isPending ? 'Sending…' : 'Send'}</button>
          </footer>
        </form>
      </div>
    </div>
  );
}

function GroupDrawerContent({ group }: { group: GroupResource }) {
  const [subject, setSubject] = useState(group.subject ?? '');
  const [description, setDescription] = useState(group.description ?? '');
  const [memberJid, setMemberJid] = useState('');
  const [removeTarget, setRemoveTarget] = useState<GroupMemberResource>();
  const invite = useRefreshGroupInviteLink(group.id);
  const localState = useUpdateGroupLocalState(group.id, group.instanceId);
  const update = useUpdateGroup(group.id, group.instanceId);
  const membersQuery = useGroupMembers(group.id);
  const addMember = useAddGroupMember(group.id);
  const promote = usePromoteGroupMember(group.id);
  const demote = useDemoteGroupMember(group.id);
  const remove = useRemoveGroupMember(group.id);
  const pages = membersQuery.data?.pages ?? [];
  const members = useMemo(() => pages.flatMap((page) => page.resource?.items ?? []), [pages]);
  const membersReadState = useResilientReadState(membersQuery, pages.some((page) => page.resource !== undefined));
  const membersUnavailable = pages.some((page) => page.unavailable !== undefined);
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
  const toggle = (field: 'muted' | 'archived' | 'pinned', current: boolean) => {
    const body: GroupLocalStateRequest = field === 'muted'
      ? { muted: !current }
      : field === 'archived'
        ? { archived: !current }
        : { pinned: !current };
    localState.mutate(body);
  };
  const pendingField = localState.isPending ? Object.keys(localState.variables ?? {})[0] : undefined;

  return (
    <>
      <section aria-labelledby="group-facts-title">
        <h3 id="group-facts-title">Facts</h3>
        <dl className="kv">
          <dt>ID</dt><dd><span className="mono">{group.id}</span></dd>
          <dt>Instance</dt><dd><span className="mono">{group.instanceId ?? '—'}</span></dd>
          <dt>Members</dt><dd className="num">{group.memberCount ?? '—'}</dd>
          <dt>Admins</dt><dd className="num">{group.adminCount ?? '—'}</dd>
          <dt>Description</dt><dd>{group.description || '—'}</dd>
          <dt>Updated</dt><dd><span className="ts" title={group.updatedAt}>{relativeTime(group.updatedAt) || '—'}</span></dd>
        </dl>
      </section>

      <section aria-labelledby="group-invite-title">
        <div className="drawer-section-head"><h3 id="group-invite-title">Invite link</h3><button className="btn" type="button" disabled={invite.isPending} onClick={() => invite.mutate()}>{invite.isPending ? 'Refreshing…' : 'Refresh invite link'}</button></div>
        <p className="help">The platform reports whether the refresh completed or continues asynchronously; link material is not projected back through the public API.</p>
        {invite.error && <InlineError error={invite.error} announce onRetry={() => invite.mutate()} />}
      </section>

      <section aria-labelledby="group-local-state-title">
        <h3 id="group-local-state-title">Local state</h3>
        <div className="groups-state-stack">
          <LocalStateSwitch label="Muted" checked={group.muted ?? false} pending={pendingField === 'muted'} disabled={localState.isPending} onChange={() => toggle('muted', group.muted ?? false)} />
          <LocalStateSwitch label="Archived" checked={group.archived ?? false} pending={pendingField === 'archived'} disabled={localState.isPending} onChange={() => toggle('archived', group.archived ?? false)} />
          <LocalStateSwitch label="Pinned" checked={group.pinned ?? false} pending={pendingField === 'pinned'} disabled={localState.isPending} onChange={() => toggle('pinned', group.pinned ?? false)} />
        </div>
        {localState.error && <InlineError error={localState.error} announce onRetry={() => localState.mutate(localState.variables ?? {})} />}
      </section>

      <section aria-labelledby="group-metadata-title">
        <h3 id="group-metadata-title">Metadata</h3>
        <form className="groups-metadata-form" onSubmit={(event) => {
          event.preventDefault();
          update.mutate({ subject, description });
        }}>
          <div className="field"><label htmlFor="group-subject">Subject</label><input id="group-subject" className="input" value={subject} disabled={update.isPending} onChange={(event) => setSubject(event.target.value)} /></div>
          <div className="field"><label htmlFor="group-description">Description</label><textarea id="group-description" className="input groups-description" rows={3} value={description} disabled={update.isPending} onChange={(event) => setDescription(event.target.value)} /></div>
          <button className="btn" type="submit" disabled={update.isPending || !metadataChanged}>{update.isPending ? 'Updating…' : 'Update metadata'}</button>
          {update.error && <InlineError error={update.error} announce onRetry={() => update.mutate({ subject, description })} />}
        </form>
      </section>

      <section aria-labelledby="group-members-title">
        <div className="drawer-section-head"><div><h3 id="group-members-title">Members</h3><span className="drawer-note">Actions submit commands; membership projections refresh independently.</span></div><span className="num groups-member-count">{members.length}</span></div>
        <form className="groups-add-member" onSubmit={(event) => {
          event.preventDefault();
          addMember.mutate(memberJid.trim(), { onSuccess: () => setMemberJid('') });
        }}>
          <label className="visually-hidden" htmlFor="group-member-jid">Member JID</label>
          <input id="group-member-jid" className="input" placeholder="Member JID" value={memberJid} disabled={memberBusy} onChange={(event) => setMemberJid(event.target.value)} />
          <button className="btn" type="submit" disabled={memberBusy || !memberJid.trim()}>{addMember.isPending ? 'Adding…' : 'Add member'}</button>
        </form>
        {memberCommandError && <InlineError error={memberCommandError} announce onRetry={retryMemberCommand} />}
        {membersReadState.isStaleError && <InlineError error={membersReadState.error} onRetry={membersQuery.refetch} />}
        {membersReadState.isInitialLoading ? (
          <div className="empty groups-members-state">Loading members…</div>
        ) : membersReadState.isInitialError ? (
          <InlineError error={membersReadState.error} onRetry={membersQuery.refetch} />
        ) : membersUnavailable && members.length === 0 ? (
          <div className="empty groups-members-state">Member data is not available yet.</div>
        ) : members.length === 0 ? (
          <div className="empty groups-members-state">No members projected for this group.</div>
        ) : (
          <div className="groups-member-list" role="region" aria-label="Group members">
            {members.map((member) => {
              const memberRef = member.memberRef ?? member.id;
              return <MemberRecord key={member.id} member={member} busy={memberBusy} onPromote={() => promote.mutate(memberRef)} onDemote={() => demote.mutate(memberRef)} onRemove={() => setRemoveTarget(member)} />;
            })}
          </div>
        )}
        {membersQuery.hasNextPage && <button className="btn groups-members-load-more" type="button" disabled={membersQuery.isFetchingNextPage} onClick={() => void membersQuery.fetchNextPage()}>{membersQuery.isFetchingNextPage ? 'Loading…' : 'Load more'}</button>}
      </section>
      {removeTarget && (() => {
        const memberRef = removeTarget.memberRef ?? removeTarget.id;
        return <TypedConfirmationDialog title="Remove group member" description={<p>This submits a membership removal command. Platform authorization and command disposition are evaluated on submission.</p>} resourceId={memberRef} confirmValue={memberRef} confirmLabel="Remove member" pendingLabel="Removing…" error={remove.error} isPending={remove.isPending} onCancel={() => setRemoveTarget(undefined)} onConfirm={() => remove.mutate(memberRef, { onSuccess: () => setRemoveTarget(undefined) })} />;
      })()}
    </>
  );
}

export function GroupDrawer({ groupId, subject: initialSubject, onClose }: {
  groupId: string;
  subject: string | undefined;
  onClose: () => void;
}) {
  const [sendOpen, setSendOpen] = useState(false);
  const groupQuery = useGroup(groupId);
  const readState = useResilientReadState(groupQuery, groupQuery.data?.resource !== undefined);
  const group = groupQuery.data?.resource;
  const title = group?.subject || initialSubject || groupId;
  const headerStatus = group?.status ?? (readState.isInitialError ? 'error' : groupQuery.data?.unavailable ? 'unavailable' : readState.isInitialLoading ? 'loading' : '—');

  return (
    <>
      <DetailDrawer titleId="group-detail-title" eyebrow="Group management" title={title} titleClassName={group?.subject || initialSubject ? undefined : 'mono'} status={<span className="status"><span className={`dot ${groupStatusDot(headerStatus)}`} />{headerStatus}</span>} subtitle={<span className="mono" title={groupId}>{groupId}</span>} className="groups-drawer" closeLabel="Close group details" suppressEscape={sendOpen} onClose={onClose}>
          {readState.isInitialLoading ? (
            <div className="empty groups-drawer-state" aria-live="polite">Loading group details…</div>
          ) : readState.isInitialError ? (
            <section><InlineError error={readState.error} onRetry={groupQuery.refetch} /></section>
          ) : groupQuery.data?.unavailable || !group ? (
            <div className="empty groups-drawer-state">Group details are not available yet.</div>
          ) : (
            <>
              {readState.isStaleError && <section><InlineError error={readState.error} onRetry={groupQuery.refetch} /></section>}
              <GroupDrawerContent group={group} />
              <section aria-labelledby="group-send-command-title"><div className="drawer-section-head"><div><h3 id="group-send-command-title">Send text</h3><span className="drawer-note">One-off command only; recurring sends belong to campaigns.</span></div><button className="btn" type="button" onClick={() => setSendOpen(true)}>Send text…</button></div></section>
            </>
          )}
      </DetailDrawer>
      {sendOpen && <SendTextDialog groupId={groupId} onClose={() => setSendOpen(false)} />}
    </>
  );
}
