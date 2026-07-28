import type { ApiClient } from './client';
import {
  unwrap,
  unwrapCommand,
  unwrapProjection,
  type CommandResult,
  type ProjectionMeta,
} from './envelopes';

// omniwa-go's /group/* routes are token-scoped (act on the instance whose token
// is in the header) and return whatsmeow-shaped groups with participants
// embedded. /group/list is untyped in the spec, so the raw shape is modelled
// here from live responses.
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

export type GroupMemberRole = 'superadmin' | 'admin' | 'member';
export type GroupType = 'group' | 'community' | 'subgroup';
export type GroupSendMode = 'admins_only' | 'all_members';

export type GroupMemberResource = {
  id: string;
  memberRef?: string;
  displayName?: string;
  role: GroupMemberRole;
  status?: string;
  joinedAt?: string;
};

export type GroupResource = {
  id: string;
  instanceId?: string;
  subject?: string;
  description?: string;
  groupType?: GroupType;
  sendMode?: GroupSendMode;
  status?: string;
  memberCount?: number;
  adminCount?: number;
  updatedAt?: string;
  createdAt?: string;
  ownerRef?: string;
  parentGroupId?: string;
  defaultSubgroup?: boolean;
  ephemeral?: boolean;
  disappearingTimerSeconds?: number;
  incognito?: boolean;
  addressingMode?: string;
  creatorCountryCode?: string;
  announce?: boolean;
  locked?: boolean;
  joinApproval?: boolean;
  adminsOnlyAdd?: boolean;
  // Chat-local state (mute/pin/archive) is not exposed by omniwa-go.
  muted?: boolean;
  pinned?: boolean;
  archived?: boolean;
  members: GroupMemberResource[];
};

/** A single group setting; each maps to a paired on/off action on /group/settings. */
export type GroupSetting = 'announce' | 'locked' | 'joinApproval' | 'adminsOnlyAdd';
export type GroupSettingAction =
  | 'announcement' | 'not_announcement'
  | 'locked' | 'unlocked'
  | 'approval_on' | 'approval_off'
  | 'admin_add' | 'all_member_add';

const GROUP_SETTING_ACTIONS: Record<GroupSetting, { on: GroupSettingAction; off: GroupSettingAction }> = {
  announce: { on: 'announcement', off: 'not_announcement' },
  locked: { on: 'locked', off: 'unlocked' },
  joinApproval: { on: 'approval_on', off: 'approval_off' },
  adminsOnlyAdd: { on: 'admin_add', off: 'all_member_add' },
};

export type GroupMemberRequest = { jid: string };
export type GroupCreateRequest = { name: string; participants: string[] };

export type GroupPagination = { nextCursor?: string | null; hasMore?: boolean };
export type ReadResult<T> = { resource?: T; meta?: ProjectionMeta };
export type GroupListPage = { items: GroupResource[]; pagination: GroupPagination };

function toMember(raw: GoParticipant): GroupMemberResource {
  return {
    id: raw.JID ?? '',
    memberRef: raw.PhoneNumber || raw.LID || undefined,
    displayName: raw.DisplayName || undefined,
    role: raw.IsSuperAdmin ? 'superadmin' : raw.IsAdmin ? 'admin' : 'member',
  };
}

function latestTimestamp(...values: Array<string | undefined>): string | undefined {
  const reported = values.filter((value): value is string => Boolean(value));
  return reported.reduce<string | undefined>((latest, candidate) => {
    if (!latest) return candidate;
    const latestTime = Date.parse(latest);
    const candidateTime = Date.parse(candidate);
    if (Number.isNaN(candidateTime)) return latest;
    return Number.isNaN(latestTime) || candidateTime > latestTime ? candidate : latest;
  }, undefined);
}

function toGroup(raw: GoGroup): GroupResource {
  const members = (raw.Participants ?? []).map(toMember);
  const groupType: GroupType | undefined = raw.IsParent
    ? 'community'
    : raw.LinkedParentJID || raw.IsDefaultSubGroup
      ? 'subgroup'
      : raw.IsParent === false || raw.IsDefaultSubGroup === false
        ? 'group'
        : undefined;
  return {
    id: raw.JID ?? '',
    subject: raw.Name || undefined,
    description: raw.Topic || undefined,
    groupType,
    sendMode: raw.IsAnnounce === undefined ? undefined : raw.IsAnnounce ? 'admins_only' : 'all_members',
    status: raw.Suspended === undefined ? undefined : raw.Suspended ? 'suspended' : 'active',
    memberCount: raw.ParticipantCount ?? (raw.Participants ? members.length : undefined),
    adminCount: raw.Participants ? members.filter((member) => member.role !== 'member').length : undefined,
    updatedAt: latestTimestamp(raw.TopicSetAt, raw.NameSetAt, raw.GroupCreated),
    createdAt: raw.GroupCreated || undefined,
    ownerRef: raw.OwnerPN || raw.OwnerJID || undefined,
    parentGroupId: raw.LinkedParentJID || undefined,
    defaultSubgroup: raw.IsDefaultSubGroup ?? undefined,
    ephemeral: raw.IsEphemeral ?? undefined,
    disappearingTimerSeconds: raw.DisappearingTimer,
    incognito: raw.IsIncognito ?? undefined,
    addressingMode: raw.AddressingMode || undefined,
    creatorCountryCode: raw.CreatorCountryCode || undefined,
    announce: raw.IsAnnounce ?? undefined,
    locked: raw.IsLocked ?? undefined,
    joinApproval: raw.IsJoinApprovalRequired ?? undefined,
    adminsOnlyAdd: raw.MemberAddMode === undefined ? undefined : raw.MemberAddMode === 'admin_add',
    members,
  };
}

export async function listInstanceGroups(
  client: ApiClient,
  _instanceId?: string,
  params: { search?: string; cursor?: string; limit?: number; paged?: boolean } = {},
): Promise<ReadResult<GroupListPage>> {
  const search = params.search?.trim() ?? '';
  const result = params.paged || search || params.cursor
    ? await client.GET('/group/search', {
      params: { query: { q: search, limit: params.limit ?? 50, cursor: params.cursor } },
    })
    : await client.GET('/group/list');
  const projection = unwrapProjection<GoGroup[]>(result);
  const nextCursor = projection.meta?.nextCursor ?? null;
  return {
    resource: {
      items: (projection.resource ?? []).map(toGroup).filter((group) => group.id !== ''),
      pagination: { nextCursor, hasMore: nextCursor !== null },
    },
    meta: projection.meta,
  };
}

export async function getGroup(client: ApiClient, groupJid: string): Promise<ReadResult<GroupResource>> {
  const projection = unwrapProjection<GoGroup>(await client.POST('/group/info', { body: { groupJid } }));
  return { resource: projection.resource ? toGroup(projection.resource) : undefined, meta: projection.meta };
}

export async function updateGroupName(client: ApiClient, groupJid: string, name: string): Promise<CommandResult> {
  return unwrapCommand(await client.POST('/group/name', { body: { groupJid, name } }));
}

export async function updateGroupDescription(client: ApiClient, groupJid: string, description: string): Promise<CommandResult> {
  return unwrapCommand(await client.POST('/group/description', { body: { groupJid, description } }));
}

export async function getGroupInviteLink(client: ApiClient, groupJid: string): Promise<string | undefined> {
  const link = unwrap<string>(await client.POST('/group/invitelink', { body: { groupJid, reset: false } }));
  return typeof link === 'string' && link ? link : undefined;
}

export async function refreshGroupInviteLink(client: ApiClient, groupJid: string): Promise<CommandResult> {
  return unwrapCommand(await client.POST('/group/invitelink', { body: { groupJid, reset: true } }));
}

export async function createGroup(client: ApiClient, body: GroupCreateRequest): Promise<CommandResult> {
  return unwrapCommand(await client.POST('/group/create', { body: { groupName: body.name, participants: body.participants } }));
}

export async function leaveGroup(client: ApiClient, groupJid: string): Promise<CommandResult> {
  // swaggo mis-types groupJid as an object; the API accepts a string.
  return unwrapCommand(await client.POST('/group/leave', { body: { groupJid } as never }));
}

export async function updateGroupSetting(
  client: ApiClient,
  groupJid: string,
  setting: GroupSetting,
  enabled: boolean,
): Promise<CommandResult> {
  const action = enabled ? GROUP_SETTING_ACTIONS[setting].on : GROUP_SETTING_ACTIONS[setting].off;
  return unwrapCommand(await client.POST('/group/settings', { body: { action, groupJid } }));
}

function participantAction(
  client: ApiClient,
  groupJid: string,
  action: 'add' | 'remove' | 'promote' | 'demote',
  participants: string[],
): Promise<CommandResult> {
  // swaggo mis-types the participant JID fields as objects; the API accepts strings.
  return client
    .POST('/group/participant', { body: { action, groupJid, participants } as never })
    .then(unwrapCommand);
}

export async function addGroupMember(client: ApiClient, groupJid: string, body: GroupMemberRequest): Promise<CommandResult> {
  return participantAction(client, groupJid, 'add', [body.jid]);
}

export async function removeGroupMember(client: ApiClient, groupJid: string, memberJid: string): Promise<CommandResult> {
  return participantAction(client, groupJid, 'remove', [memberJid]);
}

export async function promoteGroupMember(client: ApiClient, groupJid: string, memberJid: string): Promise<CommandResult> {
  return participantAction(client, groupJid, 'promote', [memberJid]);
}

export async function demoteGroupMember(client: ApiClient, groupJid: string, memberJid: string): Promise<CommandResult> {
  return participantAction(client, groupJid, 'demote', [memberJid]);
}
