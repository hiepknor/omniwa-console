import { useEffect, useState } from 'react';
import { ApiFailureNotice } from '@/components/ApiFailureNotice';
import type { ActionDecision, GroupActionName, GroupCommandAcknowledgement, GroupMemberResource, GroupMemberRole, GroupResource, GroupSetting, ParticipantCommandResult } from '@/api/groups';
import { ApiFailure, type ProjectionMeta } from '@/api/envelopes';
import { humanizeToken, relativeTime } from '@/lib/format';
import { useInvalidCursorReset } from '@/lib/useInvalidCursorReset';
import { Button, ButtonLink, CursorPagination, DescriptionItem, DescriptionList, Dialog, Drawer, Field, FileUpload, Image, Input, Panel, Select, StateNotice, Status, Switch, Tabs, Textarea, type Tone } from '@/ui';
import {
  useAddGroupMember, useDemoteGroupMember, useGroupAudit, useGroupInvite, useGroup, useGroupMembers,
  useLeaveGroup, useMediaAsset, useMediaAssetContent, usePromoteGroupMember, useRemoveGroupMember,
  useResetInvite, useSetGroupPhoto, useUpdateGroupDescription, useUpdateGroupName, useUpdateGroupSetting, useUploadMediaAsset,
} from './hooks';
import { groupMemberRoles, type GroupWorkspaceTab } from './route-state';
import { groupStatusTone } from './group-status-tone';

type Confirm = { action: 'remove'; member: GroupMemberResource } | { action: 'leave' } | { action: 'reset-invite' };
const settings: Array<{ key: GroupSetting; label: string; hint: string }> = [
  { key: 'announce', label: 'Announcement only', hint: 'Only admins can post.' },
  { key: 'locked', label: 'Locked metadata', hint: 'Only admins can edit group information.' },
  { key: 'joinApproval', label: 'Join approval', hint: 'New members require approval.' },
  { key: 'adminsOnlyAdd', label: 'Admin member add', hint: 'Only admins can add members.' },
];
const actionLabels: Array<[GroupActionName, string]> = [
  ['sendMessage', 'Send message'], ['editName', 'Edit name'], ['editDescription', 'Edit description'],
  ['editSettings', 'Edit settings'], ['addMembers', 'Add members'], ['removeMembers', 'Remove members'],
  ['promoteMembers', 'Promote members'], ['demoteMembers', 'Demote members'], ['readInviteLink', 'Read invite link'],
  ['resetInviteLink', 'Reset invite link'], ['setPhoto', 'Set photo'], ['leaveGroup', 'Leave group'],
];

function Fail({ error, command, stale, onRetry }: { error: unknown; command?: boolean; stale?: boolean; onRetry?: () => void }) {
  const notReady = !command && error instanceof ApiFailure && error.code === 'projection_not_ready';
  return <ApiFailureNotice error={error} kind={notReady ? 'empty' : 'error'} title={notReady ? stale ? 'Showing last known data while projection syncs' : 'Projection not ready' : command ? 'Command failed' : stale ? 'Showing last known data' : 'Read failed'} onRetry={notReady ? undefined : onRetry} />;
}
function ProjectionLine({ meta }: { meta?: ProjectionMeta }) {
  if (!meta?.syncStatus) return null;
  const tone: Tone = meta.syncStatus === 'ready' ? 'ok' : meta.syncStatus === 'failed' ? 'failed' : meta.syncStatus === 'stale' ? 'degraded' : 'pending';
  return <Status tone={tone}>Projection {meta.syncStatus.replace('_', ' ')}</Status>;
}
function allowed(decision: ActionDecision | undefined, normalized: boolean): boolean { return normalized && decision?.state === 'allowed'; }
function decisionText(decision: ActionDecision | undefined): string {
  if (!decision || decision.state === 'unknown') return `Permission unknown${decision?.reason && decision.reason !== 'permission_unknown' ? ` · ${humanizeToken(decision.reason)}` : ''}`;
  if (decision.state === 'denied') return `Permission denied${decision.reason ? ` · ${humanizeToken(decision.reason)}` : ''}`;
  return 'Allowed';
}
function decisionReason(decision: ActionDecision | undefined): string | undefined {
  if (decision?.state === 'allowed') return undefined;
  if (!decision?.reason || decision.reason === 'permission_unknown') return 'Permission was not reported.';
  return humanizeToken(decision.reason);
}

export function GroupWorkspace({
  groupId, readEnabled, normalized, commandsEnabled, membersEnabled, auditEnabled, photoEnabled,
  activeTab, memberSearch, memberRole, memberCursor, auditCursor, onParam, onTab, onClose, onLeft,
}: {
  groupId: string; readEnabled: boolean; normalized: boolean; commandsEnabled: boolean; membersEnabled: boolean; auditEnabled: boolean; photoEnabled: boolean;
  activeTab: GroupWorkspaceTab; memberSearch: string; memberRole?: GroupMemberRole; memberCursor?: string; auditCursor?: string;
  onParam: (key: string, value?: string, resetKeys?: readonly string[]) => void; onTab: (tab: GroupWorkspaceTab) => void; onClose: () => void; onLeft: () => void;
}) {
  const query = useGroup(groupId, readEnabled, normalized);
  const group = query.data?.resource;
  return <Drawer open onClose={onClose} title={group?.subject ?? 'Group details'} subtitle={groupId}>
    {!readEnabled && !group ? <StateNotice kind="empty" title="Group detail unavailable" detail="The groups projection capability is absent and no cached detail is available." />
      : query.isPending ? <StateNotice kind="loading" title="Loading group" />
        : query.error && !group ? <Fail error={query.error} onRetry={() => query.refetch()} />
          : group ? <div className="grid gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3"><Status tone={groupStatusTone(group.status)}>Group {humanizeToken(group.status ?? 'unknown')}</Status><ProjectionLine meta={query.data?.meta} /></div>
            {!commandsEnabled ? <StateNotice kind="empty" title="Management commands unavailable" detail={normalized ? 'The normalized projection remains readable, but command capability and permission are not currently authoritative.' : 'Keeping the last usable detail visible while provider commands are disabled.'} /> : null}
            {query.error ? <Fail error={query.error} stale onRetry={readEnabled ? () => query.refetch() : undefined} /> : null}
            <GroupWorkspaceContent key={group.id} group={group} normalized={normalized} commandsEnabled={commandsEnabled} membersEnabled={membersEnabled} auditEnabled={auditEnabled} photoEnabled={photoEnabled} activeTab={activeTab} memberSearch={memberSearch} memberRole={memberRole} memberCursor={memberCursor} auditCursor={auditCursor} onParam={onParam} onTab={onTab} onLeft={onLeft} />
          </div> : <StateNotice kind="empty" title="Not returned" detail="The projected group detail was not returned." />}
  </Drawer>;
}

function GroupWorkspaceContent({ group, normalized, commandsEnabled, membersEnabled, auditEnabled, photoEnabled, activeTab, memberSearch, memberRole, memberCursor, auditCursor, onParam, onTab, onLeft }: {
  group: GroupResource; normalized: boolean; commandsEnabled: boolean; membersEnabled: boolean; auditEnabled: boolean; photoEnabled: boolean; activeTab: GroupWorkspaceTab;
  memberSearch: string; memberRole?: GroupMemberRole; memberCursor?: string; auditCursor?: string; onParam: (key: string, value?: string, resetKeys?: readonly string[]) => void; onTab: (tab: GroupWorkspaceTab) => void; onLeft: () => void;
}) {
  const [subject, setSubject] = useState(group.subject ?? '');
  const [description, setDescription] = useState(group.description ?? '');
  const [memberJid, setMemberJid] = useState('');
  const [memberSearchDraft, setMemberSearchDraft] = useState(memberSearch);
  const [confirm, setConfirm] = useState<Confirm>();
  const [confirmText, setConfirmText] = useState('');
  const [lastCommand, setLastCommand] = useState<GroupCommandAcknowledgement | ParticipantCommandResult>();
  const updateName = useUpdateGroupName(group.id, normalized);
  const updateDescription = useUpdateGroupDescription(group.id, normalized);
  const setting = useUpdateGroupSetting(group.id, normalized);
  const add = useAddGroupMember(group.id, normalized);
  const promote = usePromoteGroupMember(group.id, normalized);
  const demote = useDemoteGroupMember(group.id, normalized);
  const remove = useRemoveGroupMember(group.id, normalized);
  const leave = useLeaveGroup(group.id, normalized);
  const canReadInvite = allowed(group.actions?.readInviteLink, normalized);
  const inviteAvailable = group.inviteLink?.available;
  const invite = useGroupInvite(group.id, activeTab === 'settings' && canReadInvite && inviteAvailable !== false);
  const resetInvite = useResetInvite(group.id, normalized);
  const members = useGroupMembers(group.id, memberSearch, memberRole, memberCursor, normalized && membersEnabled && activeTab === 'members');
  const audit = useGroupAudit(group.id, auditCursor, normalized && auditEnabled && activeTab === 'activity');
  useInvalidCursorReset(members.error, memberCursor, () => onParam('memberCursor'));
  useInvalidCursorReset(audit.error, auditCursor, () => onParam('auditCursor'));
  useEffect(() => { setSubject(group.subject ?? ''); }, [group.subject]);
  useEffect(() => { setDescription(group.description ?? ''); }, [group.description]);
  useEffect(() => { setMemberSearchDraft(memberSearch); }, [memberSearch]);
  const memberPending = add.isPending || promote.isPending || demote.isPending || remove.isPending;
  const memberError = add.error ?? promote.error ?? demote.error ?? remove.error;
  const closeConfirm = () => { setConfirm(undefined); setConfirmText(''); remove.reset(); leave.reset(); resetInvite.reset(); };
  const submitConfirm = () => {
    if (!confirm || !commandsEnabled) return;
    if (confirm.action === 'remove' && confirmText === confirm.member.id && !remove.isPending) remove.mutate(confirm.member.id, { onSuccess: (result) => { setLastCommand(result); closeConfirm(); } });
    if (confirm.action === 'leave' && confirmText === group.id && !leave.isPending) leave.mutate(undefined, { onSuccess: (result) => { setLastCommand(result); closeConfirm(); if (result.status === 'completed' || result.status === 'accepted') onLeft(); } });
    if (confirm.action === 'reset-invite' && !resetInvite.isPending) resetInvite.mutate(undefined, { onSuccess: (result) => { setLastCommand(result); closeConfirm(); } });
  };
  const confirmPending = confirm?.action === 'remove' ? remove.isPending : confirm?.action === 'leave' ? leave.isPending : resetInvite.isPending;
  const confirmError = confirm?.action === 'remove' ? remove.error : confirm?.action === 'leave' ? leave.error : resetInvite.error;
  const pageMembers = normalized ? members.data?.resource?.items ?? [] : group.members;

  return <div className="grid gap-4">
    {lastCommand ? <CommandOutcome result={lastCommand} /> : null}
    <Tabs active={activeTab} onChange={(tab) => onTab(tab as GroupWorkspaceTab)} tabs={[{ id: 'overview', label: 'Overview' }, { id: 'members', label: 'Members', count: group.memberCount }, { id: 'settings', label: 'Settings' }, { id: 'activity', label: 'Activity' }]} />
    <div role="tabpanel" className="grid gap-4">
      {activeTab === 'overview' ? <GroupOverview group={group} normalized={normalized} /> : null}
      {activeTab === 'members' ? <MembersPanel group={group} normalized={normalized} enabled={membersEnabled} commandsEnabled={commandsEnabled} query={members} items={pageMembers} searchDraft={memberSearchDraft} search={memberSearch} role={memberRole} cursor={memberCursor} memberJid={memberJid} pending={memberPending} error={memberError} onSearchDraft={setMemberSearchDraft} onParam={onParam} onMemberJid={setMemberJid} onAdd={() => add.mutate(memberJid.trim(), { onSuccess: (result) => { setLastCommand(result); setMemberJid(''); } })} onPromote={(id) => promote.mutate(id, { onSuccess: setLastCommand })} onDemote={(id) => demote.mutate(id, { onSuccess: setLastCommand })} onRemove={(member) => { setConfirmText(''); setConfirm({ action: 'remove', member }); }} /> : null}
      {activeTab === 'settings' ? <SettingsPanels group={group} normalized={normalized} commandsEnabled={commandsEnabled} photoEnabled={photoEnabled} subject={subject} description={description} invite={invite} updateName={updateName} updateDescription={updateDescription} setting={setting} onSubject={setSubject} onDescription={setDescription} onCommand={setLastCommand} onResetInvite={() => setConfirm({ action: 'reset-invite' })} onLeave={() => setConfirm({ action: 'leave' })} /> : null}
      {activeTab === 'activity' ? <ActivityPanel enabled={auditEnabled} query={audit} cursor={auditCursor} onCursor={(value) => onParam('auditCursor', value)} /> : null}
    </div>
    <Dialog open={Boolean(confirm)} onClose={closeConfirm} closeDisabled={confirmPending} title={confirm?.action === 'remove' ? 'Remove member?' : confirm?.action === 'leave' ? 'Leave group?' : 'Reset invite link?'} footer={<><Button disabled={confirmPending} onClick={closeConfirm}>Cancel</Button><Button variant="danger" disabled={!commandsEnabled || confirmPending || (confirm?.action !== 'reset-invite' && confirmText !== (confirm?.action === 'leave' ? group.id : confirm?.member.id))} onClick={submitConfirm}>{confirmPending ? 'Submitting…' : 'Confirm command'}</Button></>}>
      <div className="grid gap-3"><p className="text-sm text-fg-2">{confirm?.action === 'reset-invite' ? 'The existing link will be revoked. The command outcome does not establish projection convergence.' : 'Type the exact opaque identifier to confirm. This command is not automatically retried.'}</p>{confirm && confirm.action !== 'reset-invite' ? <Field label={confirm.action === 'leave' ? 'Group JID' : 'Member ID'}>{(id) => <Input id={id} value={confirmText} autoComplete="off" autoFocus disabled={confirmPending} onChange={(event) => setConfirmText(event.target.value)} />}</Field> : null}{confirmError ? <Fail error={confirmError} command /> : null}</div>
    </Dialog>
  </div>;
}

export function GroupOverview({ group, normalized }: { group: GroupResource; normalized: boolean }) {
  const sendAllowed = allowed(group.actions?.sendMessage, normalized);
  return <><Panel title="Group facts" description="Persisted facts and advisory role; permissions are never inferred from this role."><DescriptionList>
    <DescriptionItem label="Group JID" mono>{group.id}</DescriptionItem><DescriptionItem label="Type">{humanizeToken(group.groupType ?? 'unknown')}</DescriptionItem><DescriptionItem label="Group state">{humanizeToken(group.status ?? 'unknown')}</DescriptionItem><DescriptionItem label="Membership">{humanizeToken(group.membershipState ?? 'unknown')}</DescriptionItem><DescriptionItem label="My role">{humanizeToken(group.myRole ?? 'unknown')}</DescriptionItem><DescriptionItem label="Send mode">{humanizeToken(group.sendMode ?? 'unknown')}</DescriptionItem><DescriptionItem label="Members">{String(group.memberCount ?? 'Not reported')}</DescriptionItem><DescriptionItem label="Admins">{String(group.adminCount ?? 'Not reported')}</DescriptionItem><DescriptionItem label="Owner" mono>{group.ownerRef ?? 'Not reported'}</DescriptionItem><DescriptionItem label="Created">{relativeTime(group.createdAt) || 'Not reported'}</DescriptionItem><DescriptionItem label="Updated">{relativeTime(group.updatedAt) || 'Not reported'}</DescriptionItem>{group.parentGroupId ? <DescriptionItem label="Parent group" mono>{group.parentGroupId}</DescriptionItem> : null}
  </DescriptionList></Panel>
  {normalized ? <Panel title="Action preflight" description="Advisory permissions; every command is revalidated by the backend."><div className="grid">{actionLabels.map(([name, label]) => { const decision = group.actions?.[name]; const reason = decisionReason(decision); return <div key={name} className="grid min-h-11 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 border-b border-line py-2 last:border-b-0"><span className="grid min-w-0 gap-0.5"><span className="text-sm text-fg">{label}</span>{reason ? <small className="text-xs text-fg-3">{reason}</small> : null}</span><Status tone={decision?.state === 'allowed' ? 'ok' : decision?.state === 'denied' ? 'failed' : 'degraded'}>{humanizeToken(decision?.state ?? 'unknown')}</Status></div>; })}</div></Panel> : null}
  <Panel title="Continue workflow" description="Messaging and campaign targeting remain in their owning workspaces."><div className="grid gap-3"><div className="flex flex-wrap gap-2">{sendAllowed ? <ButtonLink to={`/chats/${encodeURIComponent(group.id)}`}>Open in Inbox</ButtonLink> : <Button disabled title={decisionText(group.actions?.sendMessage)}>Open in Inbox</Button>}<ButtonLink to="/groups/lists">Manage campaign targets</ButtonLink></div>{!sendAllowed ? <StateNotice kind="empty" title="Messaging unavailable" detail={group.groupType === 'community' ? 'Community containers are not proven sendable. Select a supported subgroup.' : decisionText(group.actions?.sendMessage)} /> : null}</div></Panel></>;
}

type MemberQuery = ReturnType<typeof useGroupMembers>;
function MembersPanel({ group, normalized, enabled, commandsEnabled, query, items, searchDraft, search, role, cursor, memberJid, pending, error, onSearchDraft, onParam, onMemberJid, onAdd, onPromote, onDemote, onRemove }: { group: GroupResource; normalized: boolean; enabled: boolean; commandsEnabled: boolean; query: MemberQuery; items: GroupMemberResource[]; searchDraft: string; search: string; role?: GroupMemberRole; cursor?: string; memberJid: string; pending: boolean; error: unknown; onSearchDraft: (v: string) => void; onParam: (key: string, value?: string, resetKeys?: readonly string[]) => void; onMemberJid: (v: string) => void; onAdd: () => void; onPromote: (id: string) => void; onDemote: (id: string) => void; onRemove: (member: GroupMemberResource) => void }) {
  if (normalized && !enabled) return <StateNotice kind="empty" title="Members directory unavailable" detail="group_members_projection is not advertised for this instance. No legacy participant aliases are shown." />;
  const canAdd = commandsEnabled && allowed(group.actions?.addMembers, normalized);
  return <Panel title="Members" description={normalized ? 'Projection-backed directory with opaque member IDs and advisory per-member actions.' : 'Legacy-compatible embedded members; normalized permissions are unavailable.'}>
    <div className="grid gap-3">
      {normalized ? <div className="grid grid-cols-[minmax(0,1fr)_minmax(10rem,0.4fr)_auto] gap-2 max-sm:grid-cols-1"><Field label="Member search">{(id) => <Input id={id} type="search" value={searchDraft} onChange={(event) => onSearchDraft(event.target.value)} />}</Field><Field label="Role">{(id, labelId) => <Select id={id} aria-labelledby={labelId} value={role ?? ''} onValueChange={(value) => onParam('memberRole', value || undefined, ['memberCursor'])}><option value="">All roles</option>{groupMemberRoles.map((item) => <option key={item} value={item}>{humanizeToken(item)}</option>)}</Select>}</Field><div className="flex items-end"><Button className="max-sm:w-full" disabled={query.isFetching || searchDraft.trim() === search} onClick={() => onParam('memberSearch', searchDraft.trim(), ['memberCursor'])}>Search</Button></div></div> : null}
      <form className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 max-sm:grid-cols-1" onSubmit={(event) => { event.preventDefault(); if (canAdd && memberJid.trim() && !pending) onAdd(); }}><Field label={normalized ? 'Canonical user JID' : 'Phone or JID'}>{(id) => <Input id={id} value={memberJid} disabled={!canAdd || pending} placeholder={normalized ? '15551230000@s.whatsapp.net' : undefined} onChange={(event) => onMemberJid(event.target.value)} />}</Field><div className="flex items-end"><Button className="max-sm:w-full" type="submit" disabled={!canAdd || !memberJid.trim() || pending}>Add member</Button></div></form>
      {!canAdd ? <StateNotice kind="empty" title="Add member unavailable" detail={normalized ? decisionText(group.actions?.addMembers) : 'Group commands are unavailable.'} /> : null}
      {error ? <Fail error={error} command /> : null}{query.isPending && normalized ? <StateNotice kind="loading" title="Loading members" /> : query.error && !query.data ? <Fail error={query.error} onRetry={() => query.refetch()} /> : null}
      {normalized && query.data ? <div className="flex flex-wrap items-center gap-2"><ProjectionLine meta={query.data.meta} /></div> : null}
      {query.error && query.data ? <Fail error={query.error} stale onRetry={() => query.refetch()} /> : null}
      {items.length ? <ul className="grid">{items.map((member) => <li key={member.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b border-line py-3 last:border-b-0"><span className="grid min-w-0"><strong className="truncate text-[13px] font-medium">{member.displayName ?? member.id}</strong><small className="truncate font-mono text-xs text-fg-3">{normalized ? member.id : member.memberRef ?? member.id}</small></span><Status tone={member.role === 'member' ? 'neutral' : 'ok'}>{humanizeToken(member.role)}</Status><div className="col-span-2 flex flex-wrap gap-2">{member.role === 'member' ? <Button disabled={!commandsEnabled || pending || !allowed(member.actions?.promote, normalized)} title={normalized ? decisionText(member.actions?.promote) : undefined} onClick={() => onPromote(member.id)}>Promote</Button> : <Button disabled={!commandsEnabled || pending || !allowed(member.actions?.demote, normalized)} title={normalized ? decisionText(member.actions?.demote) : undefined} onClick={() => onDemote(member.id)}>Demote</Button>}<Button variant="danger" disabled={!commandsEnabled || pending || !allowed(member.actions?.remove, normalized)} title={normalized ? decisionText(member.actions?.remove) : undefined} onClick={() => onRemove(member)}>Remove…</Button></div></li>)}</ul> : !query.isPending ? query.data?.meta?.syncStatus && query.data.meta.syncStatus !== 'ready' ? <StateNotice kind={query.data.meta.syncStatus === 'failed' ? 'error' : query.data.meta.syncStatus === 'syncing' ? 'loading' : 'empty'} title={`Members projection ${query.data.meta.syncStatus.replace('_', ' ')}`} detail="This empty snapshot is not authoritative; no live participant fallback was used." /> : <StateNotice kind="empty" title="No members" detail={search || role ? 'No projected member matches the applied filters.' : 'No members are present in the ready projected directory.'} /> : null}
      {normalized ? <CursorPagination cursor={cursor} nextCursor={query.data?.resource?.pagination.nextCursor ?? undefined} onCursor={(value) => onParam('memberCursor', value)} /> : null}
    </div>
  </Panel>;
}

type MutationLike<T> = { isPending: boolean; error: unknown; mutate: (value: T, options?: { onSuccess?: (result: GroupCommandAcknowledgement) => void }) => void };
function SettingsPanels({ group, normalized, commandsEnabled, photoEnabled, subject, description, invite, updateName, updateDescription, setting, onSubject, onDescription, onCommand, onResetInvite, onLeave }: { group: GroupResource; normalized: boolean; commandsEnabled: boolean; photoEnabled: boolean; subject: string; description: string; invite: ReturnType<typeof useGroupInvite>; updateName: MutationLike<string>; updateDescription: MutationLike<string>; setting: ReturnType<typeof useUpdateGroupSetting>; onSubject: (v: string) => void; onDescription: (v: string) => void; onCommand: (result: GroupCommandAcknowledgement) => void; onResetInvite: () => void; onLeave: () => void }) {
  const canEditName = commandsEnabled && allowed(group.actions?.editName, normalized); const canEditDescription = commandsEnabled && allowed(group.actions?.editDescription, normalized); const canEditSettings = commandsEnabled && allowed(group.actions?.editSettings, normalized); const canResetInvite = commandsEnabled && allowed(group.actions?.resetInviteLink, normalized); const canLeave = commandsEnabled && allowed(group.actions?.leaveGroup, normalized);
  const inviteAvailable = group.inviteLink?.available;
  return <><Panel title="Metadata" description="Subject and description are independent commands with independently revalidated permission."><div className="grid gap-5"><div className="grid gap-2"><Field label="Subject">{(id) => <Input id={id} value={subject} disabled={!canEditName || updateName.isPending} onChange={(event) => onSubject(event.target.value)} />}</Field><Button className="justify-self-start max-sm:w-full" disabled={!canEditName || subject === (group.subject ?? '') || updateName.isPending} onClick={() => updateName.mutate(subject, { onSuccess: onCommand })}>Update subject</Button>{!canEditName ? <small className="text-xs text-fg-3">{decisionText(group.actions?.editName)}</small> : null}{updateName.error ? <Fail error={updateName.error} command /> : null}</div><div className="grid gap-2 border-t border-line pt-4"><Field label="Description">{(id) => <Textarea id={id} rows={3} value={description} disabled={!canEditDescription || updateDescription.isPending} onChange={(event) => onDescription(event.target.value)} />}</Field><Button className="justify-self-start max-sm:w-full" disabled={!canEditDescription || description === (group.description ?? '') || updateDescription.isPending} onClick={() => updateDescription.mutate(description, { onSuccess: onCommand })}>Update description</Button>{!canEditDescription ? <small className="text-xs text-fg-3">{decisionText(group.actions?.editDescription)}</small> : null}{updateDescription.error ? <Fail error={updateDescription.error} command /> : null}</div></div></Panel>
  <Panel title="Group settings" description="Unknown settings and denied permissions stay disabled."><div>{settings.map(({ key, label, hint }) => { const reported = typeof group[key] === 'boolean'; const checked = Boolean(group[key]); return <Switch key={key} className="border-b border-line last:border-b-0" label={label} description={!reported ? `${hint} Current state is not reported.` : !canEditSettings ? `${hint} ${decisionText(group.actions?.editSettings)}.` : hint} checked={checked} disabled={!canEditSettings || setting.isPending || !reported} onChange={() => setting.mutate({ setting: key, enabled: !checked }, { onSuccess: onCommand })} />; })}{setting.error ? <div className="pt-3"><Fail error={setting.error} command /></div> : null}</div></Panel>
  <Panel title="Invite link" description="Read permission and cached-link availability are separate projected facts."><div className="grid gap-3">{!allowed(group.actions?.readInviteLink, normalized) ? <StateNotice kind="empty" title="Invite link unavailable" detail={decisionText(group.actions?.readInviteLink)} /> : inviteAvailable === false ? <StateNotice kind="empty" title="Invite link not available" detail="No cached invite link is currently available. Generate a new link if reset permission is allowed." /> : invite.isPending ? <StateNotice kind="loading" title="Loading invite link" /> : invite.error instanceof ApiFailure && invite.error.code === 'group_invite_link_not_found' ? <StateNotice kind="empty" title="Invite link not available" detail="The projected cached link is no longer available. Generate a new link if reset permission is allowed." /> : invite.error && !invite.data ? <Fail error={invite.error} onRetry={() => invite.refetch()} /> : <code className="block break-all border border-line bg-recessed p-2 font-mono text-xs">{invite.data?.resource ?? 'No invite link reported'}</code>}<Button variant="danger" className="justify-self-start max-sm:w-full" disabled={!canResetInvite} title={!canResetInvite ? decisionText(group.actions?.resetInviteLink) : undefined} onClick={onResetInvite}>Reset invite link…</Button></div></Panel>
  <PhotoPanel group={group} enabled={photoEnabled} allowed={commandsEnabled && allowed(group.actions?.setPhoto, normalized)} onCommand={onCommand} />
  <Panel title="Danger zone" description="Leaving removes the active account from this group and requires the exact Group JID."><div className="grid gap-2"><Button variant="danger" className="justify-self-start" disabled={!canLeave} onClick={onLeave}>Leave group…</Button>{!canLeave ? <small className="text-xs text-fg-3">{decisionText(group.actions?.leaveGroup)}</small> : null}</div></Panel></>;
}

function PhotoPanel({ group, enabled, allowed: canSet, onCommand }: { group: GroupResource; enabled: boolean; allowed: boolean; onCommand: (result: GroupCommandAcknowledgement) => void }) {
  const [file, setFile] = useState<File>(); const upload = useUploadMediaAsset(); const setPhoto = useSetGroupPhoto(group.id);
  const asset = useMediaAsset(upload.data?.id, Boolean(upload.data?.id && !['ready', 'failed', 'deleted'].includes(upload.data.status)));
  const currentContent = useMediaAssetContent(group.photo?.mediaAssetId, enabled && Boolean(group.photo?.mediaAssetId));
  const currentUrl = useBlobUrl(currentContent.data); const previewUrl = useFileUrl(file); const uploaded = asset.data ?? upload.data;
  if (!enabled) return <Panel title="Group photo" description="Shared-media photo commands are capability-gated."><StateNotice kind="empty" title="Photo management unavailable" detail="group_photo_assets is not advertised for this instance." /></Panel>;
  return <Panel title="Group photo" description="Upload a private JPEG/PNG asset, wait for ready, then submit its opaque asset ID."><div className="grid gap-3"><div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1"><Image alt="Current Group photo" aspect="square" src={currentUrl} caption={group.photo?.available ? group.photo.mediaAssetId ? 'Current managed asset' : 'Provider photo exists without a managed asset.' : 'No provider photo reported.'} /><Image alt="Selected Group photo preview" aspect="square" src={previewUrl} caption={file ? `${file.name} · ${file.type}` : 'Choose a JPEG or PNG.'} /></div><FileUpload label="Image file" description="JPEG or PNG. The file stays local until Upload asset is selected." accept="image/jpeg,image/png" file={file} disabled={!canSet || upload.isPending || setPhoto.isPending} onFileChange={(selected) => { setFile(selected); upload.reset(); setPhoto.reset(); }} />{!canSet ? <StateNotice kind="empty" title="Set photo unavailable" detail="The backend did not allow this action." /> : null}<div className="flex flex-wrap gap-2"><Button disabled={!canSet || !file || upload.isPending || Boolean(uploaded)} onClick={() => { if (file) upload.mutate(file); }}>{upload.isPending ? 'Uploading…' : 'Upload asset'}</Button><Button variant="primary" disabled={!canSet || uploaded?.status !== 'ready' || setPhoto.isPending} onClick={() => { if (uploaded?.id) setPhoto.mutate(uploaded.id, { onSuccess: onCommand }); }}>{setPhoto.isPending ? 'Applying…' : 'Apply Group photo'}</Button></div>{uploaded ? <Status tone={uploaded.status === 'ready' ? 'ok' : uploaded.status === 'failed' ? 'failed' : 'pending'}>Asset {humanizeToken(uploaded.status)}</Status> : null}{upload.error ? <Fail error={upload.error} command /> : asset.error ? <Fail error={asset.error} onRetry={() => asset.refetch()} /> : setPhoto.error ? <Fail error={setPhoto.error} command /> : null}</div></Panel>;
}

function useBlobUrl(blob: Blob | undefined): string | undefined { const [url, setUrl] = useState<string>(); useEffect(() => { if (!blob) { setUrl(undefined); return; } const next = URL.createObjectURL(blob); setUrl(next); return () => URL.revokeObjectURL(next); }, [blob]); return url; }
function useFileUrl(file: File | undefined): string | undefined { return useBlobUrl(file); }

function ActivityPanel({ enabled, query, cursor, onCursor }: { enabled: boolean; query: ReturnType<typeof useGroupAudit>; cursor?: string; onCursor: (value?: string) => void }) {
  if (!enabled) return <StateNotice kind="empty" title="Activity unavailable" detail="group_management_audit is not advertised for this instance." />;
  if (query.isPending) return <StateNotice kind="loading" title="Loading management activity" />;
  if (query.error && !query.data) return <Fail error={query.error} onRetry={() => query.refetch()} />;
  const events = query.data?.resource?.items ?? [];
  return <Panel title="Management activity" description="Newest-first terminal command outcomes; current Group state remains authoritative."><div className="grid gap-3">{query.error ? <Fail error={query.error} stale onRetry={() => query.refetch()} /> : null}{events.length ? <ol className="grid">{events.map((event) => <li key={event.id} className="grid gap-1 border-b border-line py-3 last:border-b-0"><div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-sm">{humanizeToken(event.eventType ?? 'management event')}</strong><Status tone={event.commandStatus === 'completed' ? 'ok' : event.commandStatus === 'failed' ? 'failed' : 'degraded'}>{humanizeToken(event.commandStatus ?? 'unknown')}</Status></div><small className="text-xs text-fg-3">{relativeTime(event.occurredAt) || 'Time unreported'} · {humanizeToken(event.actorType ?? 'unknown actor')}</small>{event.summary?.reason || event.summary?.setting ? <small className="text-xs text-fg-3">{humanizeToken(event.summary.setting ?? event.summary.reason ?? '')}</small> : null}</li>)}</ol> : <StateNotice kind="empty" title="No management activity" detail="No terminal public-safe events were returned." />}<CursorPagination cursor={cursor} nextCursor={query.data?.resource?.pagination.nextCursor ?? undefined} onCursor={onCursor} /></div></Panel>;
}

function CommandOutcome({ result }: { result: GroupCommandAcknowledgement | ParticipantCommandResult }) {
  const participant = 'outcomes' in result ? result : undefined;
  return <div className="grid gap-3"><StateNotice kind={result.status === 'completed' ? 'info' : result.status === 'failed' ? 'error' : 'empty'} title={`${humanizeToken(result.command ?? 'Command')} ${humanizeToken(result.status)}`} detail={result.status === 'unknown' ? 'The final provider outcome is unknown. Inspect projection and audit before another command.' : result.status === 'partially_completed' ? 'Inspect every participant outcome; no failed or unknown item was retried.' : 'The refreshed projection remains authoritative.'} />{participant?.outcomes.length ? <ul className="grid border border-line">{participant.outcomes.map((outcome, index) => <li key={`${outcome.participant ?? 'participant'}-${index}`} className="flex items-start justify-between gap-3 border-b border-line p-3 last:border-b-0"><span className="grid min-w-0"><strong className="truncate font-mono text-xs">{outcome.participant ?? `Participant ${index + 1}`}</strong>{outcome.code || outcome.message ? <small className="text-xs text-fg-3">{humanizeToken(outcome.code ?? outcome.message ?? '')}</small> : null}</span><Status tone={outcome.status === 'succeeded' ? 'ok' : outcome.status === 'failed' ? 'failed' : 'degraded'}>{humanizeToken(outcome.status)}</Status></li>)}</ul> : null}</div>;
}
