import type { ApiClient } from './client';
import { notImplemented, unwrap, unwrapCommand, type CommandResult, type UnavailableRead } from './envelopes';

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
  // Chat-local state (mute/pin/archive) is not exposed by omniwa-go.
  muted?: boolean;
  pinned?: boolean;
  archived?: boolean;
  members: GroupMemberResource[];
};

export type GroupMetadataRequest = { subject?: string; description?: string };
export type GroupLocalStateRequest = { muted?: boolean; pinned?: boolean; archived?: boolean };
export type GroupMemberRequest = { jid: string };
export type GroupTextMessageRequest = { text: string };

export type GroupPagination = { nextCursor?: string | null; hasMore?: boolean };
export type ReadResult<T> = { resource?: T; unavailable?: UnavailableRead };
export type GroupListPage = { items: GroupResource[]; pagination: GroupPagination };
export type GroupMemberListPage = { items: GroupMemberResource[]; pagination: GroupPagination };

const NO_PAGINATION: GroupPagination = { nextCursor: null, hasMore: false };

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
    members,
  };
}

export async function listInstanceGroups(
  client: ApiClient,
  _instanceId?: string,
  _params: { cursor?: string; limit?: number } = {},
): Promise<ReadResult<GroupListPage>> {
  const data = unwrap<GoGroup[]>(await client.GET('/group/list'));
  return { resource: { items: (data ?? []).map(toGroup), pagination: NO_PAGINATION } };
}

export async function getGroup(client: ApiClient, groupJid: string): Promise<ReadResult<GroupResource>> {
  const data = unwrap<GoGroup>(await client.POST('/group/info', { body: { groupJid } }));
  return { resource: data ? toGroup(data) : undefined };
}

export async function listGroupMembers(
  client: ApiClient,
  groupJid: string,
  _params: { cursor?: string; limit?: number } = {},
): Promise<ReadResult<GroupMemberListPage>> {
  const data = unwrap<GoGroup>(await client.POST('/group/info', { body: { groupJid } }));
  return { resource: { items: (data?.Participants ?? []).map(toMember), pagination: NO_PAGINATION } };
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

export async function refreshGroupInviteLink(client: ApiClient, groupJid: string): Promise<CommandResult> {
  return unwrapCommand(await client.POST('/group/invitelink', { body: { groupJid, reset: true } }));
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
