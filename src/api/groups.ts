import type { ApiClient } from './client';
import type { components } from './generated/schema';
import { unwrap, unwrapCommand, unwrapProjection, type ProjectionMeta } from './envelopes';

type NormalizedSummary = components['schemas']['github_com_evolution-foundation_evolution-go_pkg_group_service.GroupSummary'];
type NormalizedDetail = components['schemas']['github_com_evolution-foundation_evolution-go_pkg_group_service.GroupDetail'];
type NormalizedMember = components['schemas']['github_com_evolution-foundation_evolution-go_pkg_group_service.GroupMember'];
type NormalizedAudit = components['schemas']['github_com_evolution-foundation_evolution-go_pkg_group_service.ManagementAuditEvent'];
type NormalizedDirectorySummary = components['schemas']['github_com_evolution-foundation_evolution-go_pkg_group_service.GroupDirectorySummary'];
type NormalizedAcknowledgement = components['schemas']['github_com_evolution-foundation_evolution-go_pkg_group_service.CommandAcknowledgement'];
type NormalizedParticipantResult = components['schemas']['github_com_evolution-foundation_evolution-go_pkg_group_service.ParticipantCommandResult'];
type NormalizedCreateResult = components['schemas']['github_com_evolution-foundation_evolution-go_pkg_group_service.CreateGroupCommandResult'];
type NormalizedJoinResult = components['schemas']['github_com_evolution-foundation_evolution-go_pkg_group_service.JoinGroupCommandResult'];

// Compatibility-only runtime shape used when group_management_permissions is
// absent. Provider aliases never escape this API adapter into normalized mode.
type GoParticipant = {
  JID?: string;
  PhoneNumber?: string;
  LID?: string;
  IsAdmin?: boolean;
  IsSuperAdmin?: boolean;
  DisplayName?: string;
};
type GoGroup = {
  AddressingMode?: string;
  CreatorCountryCode?: string;
  DisappearingTimer?: number;
  JID?: string;
  Name?: string;
  Topic?: string;
  OwnerJID?: string;
  OwnerPN?: string;
  GroupCreated?: string;
  NameSetAt?: string;
  TopicSetAt?: string;
  IsAnnounce?: boolean;
  IsDefaultSubGroup?: boolean;
  IsEphemeral?: boolean;
  IsIncognito?: boolean;
  IsLocked?: boolean;
  IsJoinApprovalRequired?: boolean;
  IsParent?: boolean;
  LinkedParentJID?: string;
  MemberAddMode?: string;
  ParticipantCount?: number;
  Suspended?: boolean;
  Participants?: GoParticipant[];
};

export type GroupType = 'group' | 'community' | 'subgroup' | 'unknown';
export type GroupSendMode = 'admins_only' | 'all_members' | 'unknown';
export type GroupState = 'active' | 'suspended' | 'dissolved' | 'unavailable' | 'unknown';
export type GroupMembershipState = 'joined' | 'left' | 'removed' | 'unknown';
export type GroupMemberRole = 'owner' | 'superadmin' | 'admin' | 'member';
export type GroupMyRole = GroupMemberRole | 'not_member' | 'unknown';
export type ActionDecisionState = 'allowed' | 'denied' | 'unknown';
export type ActionDecision = { state: ActionDecisionState; reason?: string; checkedAt?: string };
export type GroupActionName = 'sendMessage' | 'editName' | 'editDescription' | 'editSettings' | 'addMembers' | 'removeMembers' | 'promoteMembers' | 'demoteMembers' | 'readInviteLink' | 'resetInviteLink' | 'setPhoto' | 'leaveGroup';
export type GroupActions = Partial<Record<GroupActionName, ActionDecision>>;

export type GroupMemberResource = {
  id: string;
  /** Legacy-only alias; normalized member commands use opaque id. */
  memberRef?: string;
  displayName?: string;
  role: GroupMemberRole;
  membershipState?: 'active' | 'pending' | 'removed' | 'unknown';
  actions?: { promote?: ActionDecision; demote?: ActionDecision; remove?: ActionDecision };
};

export type GroupPhoto = { available?: boolean; mediaAssetId?: string; updatedAt?: string };
export type GroupInviteLinkMetadata = { available?: boolean; updatedAt?: string };

export type GroupResource = {
  id: string;
  normalized: boolean;
  subject?: string;
  description?: string;
  descriptionPreview?: string;
  groupType?: GroupType;
  sendMode?: GroupSendMode;
  status?: GroupState;
  membershipState?: GroupMembershipState;
  myRole?: GroupMyRole;
  memberCount?: number;
  adminCount?: number;
  updatedAt?: string;
  createdAt?: string;
  ownerRef?: string;
  parentGroupId?: string;
  defaultSubgroup?: boolean;
  ephemeral?: boolean;
  disappearingTimerSeconds?: number;
  announce?: boolean;
  locked?: boolean;
  joinApproval?: boolean;
  adminsOnlyAdd?: boolean;
  actions?: GroupActions;
  photo?: GroupPhoto;
  inviteLink?: GroupInviteLinkMetadata;
  /** Populated only by the legacy compatibility detail response. */
  members: GroupMemberResource[];
};

export type GroupDirectoryFilters = {
  search?: string;
  type?: GroupType;
  myRole?: GroupMyRole;
  sendMode?: GroupSendMode;
  state?: GroupState;
  membershipState?: GroupMembershipState;
  cursor?: string;
  limit?: number;
};

export type GroupSetting = 'announce' | 'locked' | 'joinApproval' | 'adminsOnlyAdd';
export type GroupSettingAction = 'announcement' | 'not_announcement' | 'locked' | 'unlocked' | 'approval_on' | 'approval_off' | 'admin_add' | 'all_member_add';
const GROUP_SETTING_ACTIONS: Record<GroupSetting, { on: GroupSettingAction; off: GroupSettingAction }> = {
  announce: { on: 'announcement', off: 'not_announcement' },
  locked: { on: 'locked', off: 'unlocked' },
  joinApproval: { on: 'approval_on', off: 'approval_off' },
  adminsOnlyAdd: { on: 'admin_add', off: 'all_member_add' },
};

export type GroupCreateRequest = { name: string; participants: string[] };
export type GroupPagination = { nextCursor?: string | null; hasMore?: boolean };
export type ReadResult<T> = { resource?: T; meta?: ProjectionMeta };
export type GroupListPage = { items: GroupResource[]; pagination: GroupPagination };
export type GroupDirectorySummary = { total?: number; active?: number; suspended?: number; communities?: number; subgroups?: number; adminsOnlySend?: number; updatedAt?: string };
export type GroupMembersPage = { items: GroupMemberResource[]; pagination: GroupPagination };
export type GroupAuditEvent = { id: string; actorType?: 'instance' | 'system'; commandStatus?: 'completed' | 'partially_completed' | 'failed' | 'unknown'; eventType?: string; occurredAt?: string; summary?: { failureCount?: number; participantCount?: number; reason?: string; setting?: string } };
export type GroupAuditPage = { items: GroupAuditEvent[]; pagination: GroupPagination };

export type GroupCommandStatus = 'accepted' | 'completed' | 'partially_completed' | 'failed' | 'unknown';
export type GroupCommandAcknowledgement = { command?: string; commandId?: string; groupJid?: string; projectionRefreshExpected?: boolean; status: GroupCommandStatus };
export type ParticipantOutcome = { participant?: string; status: 'succeeded' | 'failed' | 'unknown'; code?: string; message?: string };
export type ParticipantCommandResult = GroupCommandAcknowledgement & { action?: 'add' | 'remove' | 'promote' | 'demote'; requestedCount?: number; succeededCount?: number; failedCount?: number; unknownCount?: number; outcomes: ParticipantOutcome[] };
export type CreateGroupResult = GroupCommandAcknowledgement & { name?: string; requestedCount?: number; succeededCount?: number; failedCount?: number; unknownCount?: number; outcomes: ParticipantOutcome[] };
export type JoinGroupResult = GroupCommandAcknowledgement & { joinStatus: 'joined' | 'already_member' | 'approval_required' | 'rejected' | 'unknown'; reason?: string };

function toDecision(value: { state?: string; reason?: string; checkedAt?: string } | undefined): ActionDecision | undefined {
  if (!value) return undefined;
  return {
    state: value.state === 'allowed' || value.state === 'denied' ? value.state : 'unknown',
    reason: value.reason || undefined,
    checkedAt: value.checkedAt || undefined,
  };
}

function toActions(raw: NormalizedDetail['actions']): GroupActions | undefined {
  if (!raw) return undefined;
  return {
    sendMessage: toDecision(raw.sendMessage), editName: toDecision(raw.editName), editDescription: toDecision(raw.editDescription),
    editSettings: toDecision(raw.editSettings), addMembers: toDecision(raw.addMembers), removeMembers: toDecision(raw.removeMembers),
    promoteMembers: toDecision(raw.promoteMembers), demoteMembers: toDecision(raw.demoteMembers), readInviteLink: toDecision(raw.readInviteLink),
    resetInviteLink: toDecision(raw.resetInviteLink), setPhoto: toDecision(raw.setPhoto), leaveGroup: toDecision(raw.leaveGroup),
  };
}

function toNormalizedGroup(raw: NormalizedSummary | NormalizedDetail): GroupResource {
  const detail = raw as NormalizedDetail;
  return {
    id: raw.groupJid ?? '', normalized: true, subject: raw.name || undefined,
    description: detail.description || undefined, descriptionPreview: raw.descriptionPreview || undefined,
    groupType: raw.type, sendMode: raw.sendMode, status: raw.state, membershipState: raw.membershipState,
    myRole: raw.myRole, memberCount: raw.memberCount, adminCount: detail.adminCount,
    updatedAt: raw.updatedAt || undefined, createdAt: raw.createdAt || undefined,
    ownerRef: detail.owner?.memberId || undefined, parentGroupId: raw.parentGroupJid || undefined,
    defaultSubgroup: raw.isDefaultSubgroup, ephemeral: detail.ephemeralEnabled,
    disappearingTimerSeconds: detail.ephemeralTimerSeconds, announce: detail.announce,
    locked: detail.locked, joinApproval: detail.joinApproval,
    adminsOnlyAdd: detail.memberAddMode === undefined || detail.memberAddMode === 'unknown' ? undefined : detail.memberAddMode === 'admins_only',
    actions: toActions(detail.actions),
    photo: detail.photo ? { available: detail.photo.available, mediaAssetId: detail.photo.mediaAssetId || undefined, updatedAt: detail.photo.updatedAt || undefined } : undefined,
    inviteLink: detail.inviteLink ? { available: detail.inviteLink.available, updatedAt: detail.inviteLink.updatedAt || undefined } : undefined,
    members: [],
  };
}

function toLegacyMember(raw: GoParticipant): GroupMemberResource {
  return { id: raw.JID ?? '', memberRef: raw.PhoneNumber || raw.LID || undefined, displayName: raw.DisplayName || undefined, role: raw.IsSuperAdmin ? 'superadmin' : raw.IsAdmin ? 'admin' : 'member' };
}

function latestTimestamp(...values: Array<string | undefined>): string | undefined {
  return values.filter((value): value is string => Boolean(value)).reduce<string | undefined>((latest, candidate) => {
    if (!latest) return candidate;
    const a = Date.parse(latest); const b = Date.parse(candidate);
    if (Number.isNaN(b)) return latest;
    return Number.isNaN(a) || b > a ? candidate : latest;
  }, undefined);
}

function toLegacyGroup(raw: GoGroup): GroupResource {
  const members = (raw.Participants ?? []).map(toLegacyMember);
  const groupType: GroupType | undefined = raw.IsParent ? 'community' : raw.LinkedParentJID || raw.IsDefaultSubGroup ? 'subgroup' : raw.IsParent === false || raw.IsDefaultSubGroup === false ? 'group' : undefined;
  return {
    id: raw.JID ?? '', normalized: false, subject: raw.Name || undefined, description: raw.Topic || undefined, groupType,
    sendMode: raw.IsAnnounce === undefined ? undefined : raw.IsAnnounce ? 'admins_only' : 'all_members',
    status: raw.Suspended === undefined ? undefined : raw.Suspended ? 'suspended' : 'active',
    memberCount: raw.ParticipantCount ?? (raw.Participants ? members.length : undefined),
    adminCount: raw.Participants ? members.filter((member) => member.role !== 'member').length : undefined,
    updatedAt: latestTimestamp(raw.TopicSetAt, raw.NameSetAt, raw.GroupCreated), createdAt: raw.GroupCreated || undefined,
    ownerRef: raw.OwnerPN || raw.OwnerJID || undefined, parentGroupId: raw.LinkedParentJID || undefined,
    defaultSubgroup: raw.IsDefaultSubGroup, ephemeral: raw.IsEphemeral,
    disappearingTimerSeconds: raw.DisappearingTimer, announce: raw.IsAnnounce,
    locked: raw.IsLocked, joinApproval: raw.IsJoinApprovalRequired,
    adminsOnlyAdd: raw.MemberAddMode === undefined ? undefined : raw.MemberAddMode === 'admin_add', members,
  };
}

export async function listInstanceGroups(client: ApiClient, params: GroupDirectoryFilters, normalized: boolean): Promise<ReadResult<GroupListPage>> {
  const search = params.search?.trim() ?? '';
  const filtered = Boolean(search || params.type || params.myRole || params.sendMode || params.state || params.membershipState);
  const result = normalized && !filtered
    ? await client.GET('/group/list', { params: { query: { limit: params.limit ?? 50, cursor: params.cursor } } })
    : await client.GET('/group/search', {
      params: { query: {
        q: search, type: normalized ? params.type : undefined, myRole: normalized ? params.myRole : undefined,
        sendMode: normalized ? params.sendMode : undefined, state: normalized ? params.state : undefined,
        membershipState: normalized ? params.membershipState : undefined, limit: params.limit ?? 50, cursor: params.cursor,
      } },
    });
  const projection = unwrapProjection<Array<NormalizedSummary | GoGroup>>(result);
  const nextCursor = projection.meta?.nextCursor ?? null;
  const items = (projection.resource ?? []).map((row) => normalized ? toNormalizedGroup(row as NormalizedSummary) : toLegacyGroup(row as GoGroup)).filter((group) => group.id !== '');
  return { resource: { items, pagination: { nextCursor, hasMore: nextCursor !== null } }, meta: projection.meta };
}

export async function getGroup(client: ApiClient, groupJid: string, normalized: boolean): Promise<ReadResult<GroupResource>> {
  const projection = unwrapProjection<NormalizedDetail | GoGroup>(await client.POST('/group/info', { body: { groupJid } }));
  return { resource: projection.resource ? normalized ? toNormalizedGroup(projection.resource as NormalizedDetail) : toLegacyGroup(projection.resource as GoGroup) : undefined, meta: projection.meta };
}

export async function getGroupSummary(client: ApiClient): Promise<ReadResult<GroupDirectorySummary>> {
  const projection = unwrapProjection<NormalizedDirectorySummary>(await client.GET('/group/summary'));
  return { resource: projection.resource ? { ...projection.resource } : undefined, meta: projection.meta };
}

export async function listGroupMembers(client: ApiClient, groupJid: string, params: { search?: string; role?: GroupMemberRole; cursor?: string; limit?: number }): Promise<ReadResult<GroupMembersPage>> {
  const projection = unwrapProjection<NormalizedMember[]>(await client.GET('/group/{groupJid}/members', { params: { path: { groupJid }, query: { q: params.search?.trim() || undefined, role: params.role, cursor: params.cursor, limit: params.limit ?? 50 } } }));
  const items = (projection.resource ?? []).map((member): GroupMemberResource => ({
    id: member.memberId ?? '', displayName: member.displayName || undefined, role: member.role ?? 'member', membershipState: member.membershipState,
    actions: member.actions ? { promote: toDecision(member.actions.promote), demote: toDecision(member.actions.demote), remove: toDecision(member.actions.remove) } : undefined,
  })).filter((member) => member.id !== '');
  const nextCursor = projection.meta?.nextCursor ?? null;
  return { resource: { items, pagination: { nextCursor, hasMore: nextCursor !== null } }, meta: projection.meta };
}

export async function listGroupAudit(client: ApiClient, groupJid: string, cursor?: string): Promise<ReadResult<GroupAuditPage>> {
  const projection = unwrapProjection<NormalizedAudit[]>(await client.GET('/group/{groupJid}/audit', { params: { path: { groupJid }, query: { limit: 50, cursor } } }));
  const items = (projection.resource ?? []).map((event): GroupAuditEvent => ({ id: event.id ?? '', actorType: event.actorType, commandStatus: event.commandStatus, eventType: event.eventType || undefined, occurredAt: event.occurredAt || undefined, summary: event.summary ? { ...event.summary } : undefined })).filter((event) => event.id !== '');
  const nextCursor = projection.meta?.nextCursor ?? null;
  return { resource: { items, pagination: { nextCursor, hasMore: nextCursor !== null } }, meta: projection.meta };
}

function commandOptions<T>(body: T, idempotencyKey?: string) {
  // Swaggo omits Idempotency-Key from several mutation parameter blocks even
  // though the public handoff defines it. Keep the compatibility cast here.
  return { body, ...(idempotencyKey ? { headers: { 'Idempotency-Key': idempotencyKey } } : {}) } as never;
}

function toAcknowledgement(raw: NormalizedAcknowledgement | undefined, fallback: string): GroupCommandAcknowledgement {
  return { command: raw?.command || fallback, commandId: raw?.commandId, groupJid: raw?.groupJid, projectionRefreshExpected: raw?.projectionRefreshExpected, status: raw?.status ?? 'accepted' };
}

async function acknowledgement(result: Awaited<ReturnType<ApiClient['POST']>>, fallback: string, normalized: boolean): Promise<GroupCommandAcknowledgement> {
  if (!normalized) { unwrapCommand(result); return { command: fallback, status: 'accepted' }; }
  return toAcknowledgement(unwrap<NormalizedAcknowledgement>(result), fallback);
}

export async function updateGroupName(client: ApiClient, groupJid: string, name: string, normalized: boolean, key?: string) { return acknowledgement(await client.POST('/group/name', commandOptions({ groupJid, name }, key)), 'group_name_updated', normalized); }
export async function updateGroupDescription(client: ApiClient, groupJid: string, description: string, normalized: boolean, key?: string) { return acknowledgement(await client.POST('/group/description', commandOptions({ groupJid, description }, key)), 'group_description_updated', normalized); }
export async function getGroupInviteLink(client: ApiClient, groupJid: string): Promise<ReadResult<string>> {
  const projection = unwrapProjection<string>(await client.POST('/group/invitelink', { body: { groupJid, reset: false } }));
  return { resource: typeof projection.resource === 'string' && projection.resource ? projection.resource : undefined, meta: projection.meta };
}
export async function refreshGroupInviteLink(client: ApiClient, groupJid: string, normalized: boolean, key?: string) { return acknowledgement(await client.POST('/group/invitelink', commandOptions({ groupJid, reset: true }, key)), 'group_invite_reset', normalized); }
export async function leaveGroup(client: ApiClient, groupJid: string, normalized: boolean, key?: string) { return acknowledgement(await client.POST('/group/leave', commandOptions({ groupJid }, key)), 'group_left', normalized); }
export async function updateGroupSetting(client: ApiClient, groupJid: string, setting: GroupSetting, enabled: boolean, normalized: boolean, key?: string) { const action = enabled ? GROUP_SETTING_ACTIONS[setting].on : GROUP_SETTING_ACTIONS[setting].off; return acknowledgement(await client.POST('/group/settings', commandOptions({ action, groupJid }, key)), 'group_setting_updated', normalized); }
export async function setGroupPhoto(client: ApiClient, groupJid: string, mediaAssetId: string, key?: string) { return acknowledgement(await client.POST('/group/photo', commandOptions({ groupJid, mediaAssetId }, key)), 'group_photo_updated', true); }

function outcomes(raw: NormalizedParticipantResult['outcomes'] | NormalizedCreateResult['participantOutcomes']): ParticipantOutcome[] {
  return (raw ?? []).map((item) => ({ participant: item.participant, status: item.status ?? 'unknown', code: item.code, message: item.message }));
}

async function participantAction(client: ApiClient, groupJid: string, action: 'add' | 'remove' | 'promote' | 'demote', participants: string[], normalized: boolean, key?: string): Promise<ParticipantCommandResult> {
  const result = await client.POST('/group/participant', commandOptions({ action, groupJid, participants }, key));
  if (!normalized) { unwrapCommand(result); return { command: `group_member_${action}`, status: 'accepted', action, outcomes: [] }; }
  const raw = unwrap<NormalizedParticipantResult>(result);
  return { command: `group_member_${action}`, commandId: raw.commandId, groupJid: raw.groupJid, projectionRefreshExpected: raw.projectionRefreshExpected, status: raw.status ?? 'unknown', action: raw.action, requestedCount: raw.requestedCount, succeededCount: raw.succeededCount, failedCount: raw.failedCount, unknownCount: raw.unknownCount, outcomes: outcomes(raw.outcomes) };
}

export async function addGroupMember(client: ApiClient, groupJid: string, jid: string, normalized: boolean, key?: string) { return participantAction(client, groupJid, 'add', [jid], normalized, key); }
export async function removeGroupMember(client: ApiClient, groupJid: string, memberId: string, normalized: boolean, key?: string) { return participantAction(client, groupJid, 'remove', [memberId], normalized, key); }
export async function promoteGroupMember(client: ApiClient, groupJid: string, memberId: string, normalized: boolean, key?: string) { return participantAction(client, groupJid, 'promote', [memberId], normalized, key); }
export async function demoteGroupMember(client: ApiClient, groupJid: string, memberId: string, normalized: boolean, key?: string) { return participantAction(client, groupJid, 'demote', [memberId], normalized, key); }

export async function createGroup(client: ApiClient, body: GroupCreateRequest, normalized: boolean, key?: string): Promise<CreateGroupResult> {
  const result = await client.POST('/group/create', commandOptions({ groupName: body.name, participants: body.participants }, key));
  if (!normalized) { unwrapCommand(result); return { command: 'group_created', status: 'accepted', name: body.name, outcomes: [] }; }
  const raw = unwrap<NormalizedCreateResult>(result);
  return { command: 'group_created', commandId: raw.commandId, groupJid: raw.groupJid, projectionRefreshExpected: raw.projectionRefreshExpected, status: raw.acknowledgementStatus ?? 'unknown', name: raw.name, requestedCount: raw.requestedCount, succeededCount: raw.succeededCount, failedCount: raw.failedCount, unknownCount: raw.unknownCount, outcomes: outcomes(raw.participantOutcomes) };
}

export async function joinGroup(client: ApiClient, code: string, key?: string): Promise<JoinGroupResult> {
  const raw = unwrap<NormalizedJoinResult>(await client.POST('/group/join', commandOptions({ code }, key)));
  return { command: 'group_joined', commandId: raw.commandId, groupJid: raw.groupJid, projectionRefreshExpected: raw.projectionRefreshExpected, status: raw.status === 'joined' || raw.status === 'already_member' ? 'completed' : raw.status === 'rejected' ? 'failed' : 'unknown', joinStatus: raw.status ?? 'unknown', reason: raw.reason || undefined };
}
