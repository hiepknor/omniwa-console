import type { ApiClient } from './client';
import {
  notImplemented,
  unwrap,
  unwrapCommand,
  unwrapProjection,
  type CommandResult,
  type ProjectionMeta,
  type UnavailableRead,
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
  JID?: string;
  Name?: string;
  Topic?: string;
  OwnerJID?: string;
  OwnerPN?: string;
  GroupCreated?: string;
  NameSetAt?: string;
  IsAnnounce?: boolean;
  IsLocked?: boolean;
  IsJoinApprovalRequired?: boolean;
  MemberAddMode?: string;
  Suspended?: boolean;
  Participants?: GoParticipant[];
};

export type GroupMemberRole = 'superadmin' | 'admin' | 'member';

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
  status?: string;
  memberCount?: number;
  adminCount?: number;
  updatedAt?: string;
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

export type GroupMetadataRequest = { subject?: string; description?: string };
export type GroupLocalStateRequest = { muted?: boolean; pinned?: boolean; archived?: boolean };
export type GroupMemberRequest = { jid: string };
export type GroupTextMessageRequest = { text: string };
export type GroupCreateRequest = { name: string; participants: string[] };

export type GroupPagination = { nextCursor?: string | null; hasMore?: boolean };
export type ReadResult<T> = { resource?: T; meta?: ProjectionMeta; unavailable?: UnavailableRead };
export type GroupListPage = { items: GroupResource[]; pagination: GroupPagination };

function toMember(raw: GoParticipant): GroupMemberResource {
  return {
    id: raw.JID ?? '',
    memberRef: raw.PhoneNumber || raw.LID || undefined,
    displayName: raw.DisplayName || undefined,
    role: raw.IsSuperAdmin ? 'superadmin' : raw.IsAdmin ? 'admin' : 'member',
  };
}

function toGroup(raw: GoGroup): GroupResource {
  const members = (raw.Participants ?? []).map(toMember);
  return {
    id: raw.JID ?? '',
    subject: raw.Name || undefined,
    description: raw.Topic || undefined,
    status: raw.Suspended ? 'suspended' : 'active',
    memberCount: members.length,
    adminCount: members.filter((member) => member.role !== 'member').length,
    updatedAt: raw.NameSetAt || raw.GroupCreated || undefined,
    announce: raw.IsAnnounce ?? undefined,
    locked: raw.IsLocked ?? undefined,
    joinApproval: raw.IsJoinApprovalRequired ?? undefined,
    adminsOnlyAdd: raw.MemberAddMode === 'admin_add',
    members,
  };
}

export async function listInstanceGroups(
  client: ApiClient,
  _instanceId?: string,
  params: { search?: string; cursor?: string; limit?: number } = {},
): Promise<ReadResult<GroupListPage>> {
  const search = params.search?.trim() ?? '';
  const result = search || params.cursor
    ? await client.GET('/group/search', {
      params: { query: { q: search, limit: params.limit ?? 50, cursor: params.cursor } },
    })
    : await client.GET('/group/list');
  const projection = unwrapProjection<GoGroup[]>(result);
  const nextCursor = projection.meta?.nextCursor ?? null;
  return {
    resource: {
      items: (projection.resource ?? []).map(toGroup),
      pagination: { nextCursor, hasMore: nextCursor !== null },
    },
    meta: projection.meta,
  };
}

export async function getGroup(client: ApiClient, groupJid: string): Promise<ReadResult<GroupResource>> {
  const projection = unwrapProjection<GoGroup>(await client.POST('/group/info', { body: { groupJid } }));
  return { resource: projection.resource ? toGroup(projection.resource) : undefined, meta: projection.meta };
}

export async function updateGroup(
  client: ApiClient,
  groupJid: string,
  body: GroupMetadataRequest,
): Promise<CommandResult> {
  let result: CommandResult = { disposition: 'completed', data: null };
  if (body.subject !== undefined) {
    result = unwrapCommand(await client.POST('/group/name', { body: { groupJid, name: body.subject } }));
  }
  if (body.description !== undefined) {
    result = unwrapCommand(await client.POST('/group/description', { body: { groupJid, description: body.description } }));
  }
  return result;
}

export async function updateGroupLocalState(
  _client: ApiClient,
  _groupJid: string,
  _body: GroupLocalStateRequest,
): Promise<CommandResult> {
  // omniwa-go does not expose chat-local mute/pin/archive state.
  throw notImplemented('Group local state');
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

export async function sendGroupTextMessage(
  client: ApiClient,
  groupJid: string,
  body: GroupTextMessageRequest,
): Promise<CommandResult> {
  // swaggo mis-types /send/text `number`; the API accepts a plain-string recipient.
  return unwrapCommand(await client.POST('/send/text', { body: { number: groupJid, text: body.text } as never }));
}
