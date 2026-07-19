import type { ApiClient } from './client';
import type { components } from './generated/schema';
import {
  ApiFailure,
  parseUnavailableRead,
  pickResource,
  pickResources,
  unwrapCommand,
  type CollectionEnvelope,
  type ErrorEnvelope,
  type UnavailableRead,
} from './envelopes';

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

function unavailableOrThrow(result: { error?: unknown; response: Response }): UnavailableRead {
  const unavailable = parseUnavailableRead(result.error);
  if (unavailable !== undefined) return unavailable;
  throw new ApiFailure(result.error as ErrorEnvelope | undefined, result.response.status);
}

function idempotencyKey(action: string, resourceId?: string): string {
  return `console-${action}-${resourceId ?? 'new'}-${crypto.randomUUID()}`;
}

export async function listInstanceGroups(
  client: ApiClient,
  instanceId: string,
  params: { cursor?: string; limit?: number } = {},
): Promise<ReadResult<GroupListPage>> {
  const result = await client.GET('/v1/instances/{instanceId}/groups', {
    params: {
      path: { instanceId },
      query: { cursor: params.cursor, limit: params.limit ?? 50 },
    },
  });
  if (result.data !== undefined) {
    return {
      resource: {
        items: pickResources(result.data.data, 'group'),
        pagination: result.data.meta.pagination,
      },
    };
  }
  return { unavailable: unavailableOrThrow(result) };
}

export async function getGroup(
  client: ApiClient,
  groupId: string,
): Promise<ReadResult<GroupResource>> {
  const result = await client.GET('/v1/groups/{groupId}', {
    params: { path: { groupId } },
  });
  if (result.data !== undefined) {
    return { resource: pickResource(result.data.data, 'group') };
  }
  return { unavailable: unavailableOrThrow(result) };
}

export async function updateGroup(
  client: ApiClient,
  groupId: string,
  body: GroupMetadataRequest,
) {
  const result = await client.PATCH('/v1/groups/{groupId}', {
    params: {
      path: { groupId },
      header: { 'idempotency-key': idempotencyKey('update-group', groupId) },
    },
    body,
  });
  return unwrapCommand(result);
}

export async function updateGroupLocalState(
  client: ApiClient,
  groupId: string,
  body: GroupLocalStateRequest,
) {
  const result = await client.PATCH('/v1/groups/{groupId}/local-state', {
    params: {
      path: { groupId },
      header: { 'idempotency-key': idempotencyKey('update-group-local-state', groupId) },
    },
    body,
  });
  return unwrapCommand(result);
}

export async function refreshInstanceGroups(client: ApiClient, instanceId: string) {
  const result = await client.POST('/v1/instances/{instanceId}/groups/refresh', {
    params: {
      path: { instanceId },
      header: { 'idempotency-key': idempotencyKey('refresh-groups', instanceId) },
    },
    body: {},
  });
  return unwrapCommand(result);
}

export async function refreshGroupInviteLink(client: ApiClient, groupId: string) {
  const result = await client.POST('/v1/groups/{groupId}/invite-link/refresh', {
    params: {
      path: { groupId },
      header: { 'idempotency-key': idempotencyKey('refresh-group-invite-link', groupId) },
    },
    body: {},
  });
  return unwrapCommand(result);
}

export async function listGroupMembers(
  client: ApiClient,
  groupId: string,
  params: { cursor?: string; limit?: number } = {},
): Promise<ReadResult<GroupMemberListPage>> {
  const result = await client.GET('/v1/groups/{groupId}/members', {
    params: {
      path: { groupId },
      query: { cursor: params.cursor, limit: params.limit ?? 50 },
    },
  });
  if (result.data !== undefined) {
    return {
      resource: {
        items: pickResources(result.data.data, 'groupMember'),
        pagination: result.data.meta.pagination,
      },
    };
  }
  return { unavailable: unavailableOrThrow(result) };
}

export async function addGroupMember(
  client: ApiClient,
  groupId: string,
  body: GroupMemberRequest,
) {
  const result = await client.POST('/v1/groups/{groupId}/members', {
    params: {
      path: { groupId },
      header: { 'idempotency-key': idempotencyKey('add-group-member', groupId) },
    },
    body,
  });
  return unwrapCommand(result);
}

export async function removeGroupMember(client: ApiClient, groupId: string, memberJid: string) {
  const result = await client.DELETE('/v1/groups/{groupId}/members/{memberJid}', {
    params: {
      path: { groupId, memberJid },
      header: { 'idempotency-key': idempotencyKey('remove-group-member', groupId) },
    },
    body: {},
  });
  return unwrapCommand(result);
}

export async function promoteGroupMember(client: ApiClient, groupId: string, memberJid: string) {
  const result = await client.POST('/v1/groups/{groupId}/members/{memberJid}/promote', {
    params: {
      path: { groupId, memberJid },
      header: { 'idempotency-key': idempotencyKey('promote-group-member', groupId) },
    },
    body: {},
  });
  return unwrapCommand(result);
}

export async function demoteGroupMember(client: ApiClient, groupId: string, memberJid: string) {
  const result = await client.POST('/v1/groups/{groupId}/members/{memberJid}/demote', {
    params: {
      path: { groupId, memberJid },
      header: { 'idempotency-key': idempotencyKey('demote-group-member', groupId) },
    },
    body: {},
  });
  return unwrapCommand(result);
}

export async function sendGroupTextMessage(
  client: ApiClient,
  groupId: string,
  body: GroupTextMessageRequest,
) {
  const result = await client.POST('/v1/groups/{groupId}/messages/text', {
    params: {
      path: { groupId },
      header: { 'idempotency-key': idempotencyKey('send-group-text', groupId) },
    },
    body,
  });
  return unwrapCommand(result);
}
