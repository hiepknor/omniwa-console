import type { ApiClient } from './client';
import type { components } from './generated/platform-schema';
import { notImplemented, type CollectionEnvelope, type CommandResult, type UnavailableRead } from './envelopes';

// omniwa-go backs groups via `/group/*` (flat routes, no cursor). Wiring the
// groups feature to those endpoints is a follow-up; the module is stubbed for now.
export type GroupResource = components['schemas']['GroupResource'];
export type GroupMemberResource = components['schemas']['GroupMemberResource'];
export type GroupMetadataRequest = components['schemas']['GroupMetadataRequest'];
export type GroupLocalStateRequest = components['schemas']['GroupLocalStateRequest'];
export type GroupMemberRequest = components['schemas']['GroupMemberRequest'];
export type GroupTextMessageRequest = components['schemas']['GroupTextMessageRequest'];
export type GroupPagination = CollectionEnvelope['meta']['pagination'];
export type ReadResult<T> = { resource?: T; unavailable?: UnavailableRead };

export type GroupListPage = {
  items: GroupResource[];
  pagination: GroupPagination;
};

export type GroupMemberListPage = {
  items: GroupMemberResource[];
  pagination: GroupPagination;
};

export async function listInstanceGroups(
  _client: ApiClient,
  _instanceId: string,
  _params: { cursor?: string; limit?: number } = {},
): Promise<ReadResult<GroupListPage>> {
  throw notImplemented('Groups');
}

export async function getGroup(_client: ApiClient, _groupId: string): Promise<ReadResult<GroupResource>> {
  throw notImplemented('Group detail');
}

export async function updateGroup(
  _client: ApiClient,
  _groupId: string,
  _body: GroupMetadataRequest,
): Promise<CommandResult> {
  throw notImplemented('Group update');
}

export async function updateGroupLocalState(
  _client: ApiClient,
  _groupId: string,
  _body: GroupLocalStateRequest,
): Promise<CommandResult> {
  throw notImplemented('Group local state');
}

export async function refreshInstanceGroups(_client: ApiClient, _instanceId: string): Promise<CommandResult> {
  throw notImplemented('Group refresh');
}

export async function refreshGroupInviteLink(_client: ApiClient, _groupId: string): Promise<CommandResult> {
  throw notImplemented('Group invite link');
}

export async function listGroupMembers(
  _client: ApiClient,
  _groupId: string,
  _params: { cursor?: string; limit?: number } = {},
): Promise<ReadResult<GroupMemberListPage>> {
  throw notImplemented('Group members');
}

export async function addGroupMember(
  _client: ApiClient,
  _groupId: string,
  _body: GroupMemberRequest,
): Promise<CommandResult> {
  throw notImplemented('Add group member');
}

export async function removeGroupMember(_client: ApiClient, _groupId: string, _memberJid: string): Promise<CommandResult> {
  throw notImplemented('Remove group member');
}

export async function promoteGroupMember(_client: ApiClient, _groupId: string, _memberJid: string): Promise<CommandResult> {
  throw notImplemented('Promote group member');
}

export async function demoteGroupMember(_client: ApiClient, _groupId: string, _memberJid: string): Promise<CommandResult> {
  throw notImplemented('Demote group member');
}

export async function sendGroupTextMessage(
  _client: ApiClient,
  _groupId: string,
  _body: GroupTextMessageRequest,
): Promise<CommandResult> {
  throw notImplemented('Send group message');
}
