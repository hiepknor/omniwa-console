import type { ApiClient } from './client';
import type { components } from './generated/schema';
import {
  ApiFailure,
  parseUnavailableRead,
  pickResource,
  pickResources,
  unwrap,
  unwrapCommand,
  type CollectionEnvelope,
  type ErrorEnvelope,
  type PublicData,
  type UnavailableRead,
} from './envelopes';

export type ChatResource = components['schemas']['ChatResource'];
export type MessageResource = components['schemas']['MessageResource'];
export type ContactResource = components['schemas']['ContactResource'];
export type LabelResource = components['schemas']['LabelResource'];
export type MediaResource = components['schemas']['MediaResource'];
export type MediaMessageRequest = components['schemas']['MediaMessageRequest'];
export type MediaRegistrationRequest = components['schemas']['MediaRegistrationRequest'];
export type ChatPagination = CollectionEnvelope['meta']['pagination'];
export type ReadResult<T> = { resource?: T; unavailable?: UnavailableRead };

function unavailableOrThrow(result: { error?: unknown; response: Response }): UnavailableRead {
  const unavailable = parseUnavailableRead(result.error);
  if (unavailable !== undefined) return unavailable;
  throw new ApiFailure(result.error as ErrorEnvelope | undefined, result.response.status);
}

function idempotencyKey(action: string, resourceId?: string): string {
  return `console-${action}-${resourceId ?? 'new'}-${crypto.randomUUID()}`;
}

export async function listInstanceChats(
  client: ApiClient,
  instanceId: string,
  params: { cursor?: string; limit?: number } = {},
): Promise<ReadResult<{ items: ChatResource[]; pagination: ChatPagination }>> {
  const result = await client.GET('/v1/instances/{instanceId}/chats', {
    params: {
      path: { instanceId },
      query: { cursor: params.cursor, limit: params.limit ?? 50 },
    },
  });
  if (result.data !== undefined) {
    return {
      resource: {
        items: pickResources(result.data.data, 'chat'),
        pagination: result.data.meta.pagination,
      },
    };
  }
  return { unavailable: unavailableOrThrow(result) };
}

export async function getChat(
  client: ApiClient,
  chatId: string,
): Promise<ReadResult<ChatResource>> {
  const result = await client.GET('/v1/chats/{chatId}', {
    params: { path: { chatId } },
  });
  if (result.data !== undefined) {
    return { resource: pickResource(result.data.data, 'chat') };
  }
  return { unavailable: unavailableOrThrow(result) };
}

export async function listInstanceMessages(
  client: ApiClient,
  instanceId: string,
  params: { cursor?: string; limit?: number; sort?: string } = {},
): Promise<ReadResult<{ items: MessageResource[]; pagination: ChatPagination }>> {
  const result = await client.GET('/v1/instances/{instanceId}/messages', {
    params: {
      path: { instanceId },
      query: { cursor: params.cursor, limit: params.limit ?? 100, sort: params.sort },
    },
  });
  if (result.data !== undefined) {
    return {
      resource: {
        items: pickResources(result.data.data, 'message'),
        pagination: result.data.meta.pagination,
      },
    };
  }
  return { unavailable: unavailableOrThrow(result) };
}

export async function getMessage(
  client: ApiClient,
  messageId: string,
): Promise<ReadResult<MessageResource>> {
  const result = await client.GET('/v1/messages/{messageId}', {
    params: { path: { messageId } },
  });
  if (result.data !== undefined) {
    return { resource: pickResource(result.data.data, 'message') };
  }
  return { unavailable: unavailableOrThrow(result) };
}

export async function getMessageDeliveryHistory(
  client: ApiClient,
  messageId: string,
): Promise<ReadResult<{ data: PublicData; requestId: string }>> {
  const result = await client.GET('/v1/messages/{messageId}/delivery-history', {
    params: { path: { messageId } },
  });
  if (result.data !== undefined) {
    const envelope = unwrap(result);
    return { resource: { data: envelope.data, requestId: envelope.meta.requestId } };
  }
  return { unavailable: unavailableOrThrow(result) };
}

export async function listInstanceContacts(
  client: ApiClient,
  instanceId: string,
  params: { cursor?: string; limit?: number } = {},
): Promise<ReadResult<{ items: ContactResource[]; pagination: ChatPagination }>> {
  const result = await client.GET('/v1/instances/{instanceId}/contacts', {
    params: {
      path: { instanceId },
      query: { cursor: params.cursor, limit: params.limit ?? 50 },
    },
  });
  if (result.data !== undefined) {
    return {
      resource: {
        items: pickResources(result.data.data, 'contact'),
        pagination: result.data.meta.pagination,
      },
    };
  }
  return { unavailable: unavailableOrThrow(result) };
}

export async function getContact(
  client: ApiClient,
  contactId: string,
): Promise<ReadResult<ContactResource>> {
  const result = await client.GET('/v1/contacts/{contactId}', {
    params: { path: { contactId } },
  });
  if (result.data !== undefined) {
    return { resource: pickResource(result.data.data, 'contact') };
  }
  return { unavailable: unavailableOrThrow(result) };
}

export async function listInstanceLabels(
  client: ApiClient,
  instanceId: string,
  params: { cursor?: string; limit?: number } = {},
): Promise<ReadResult<{ items: LabelResource[]; pagination: ChatPagination }>> {
  const result = await client.GET('/v1/instances/{instanceId}/labels', {
    params: {
      path: { instanceId },
      query: { cursor: params.cursor, limit: params.limit ?? 100 },
    },
  });
  if (result.data !== undefined) {
    return {
      resource: {
        items: pickResources(result.data.data, 'label'),
        pagination: result.data.meta.pagination,
      },
    };
  }
  return { unavailable: unavailableOrThrow(result) };
}

export async function getMedia(
  client: ApiClient,
  mediaId: string,
): Promise<ReadResult<MediaResource>> {
  const result = await client.GET('/v1/media/{mediaId}', {
    params: { path: { mediaId } },
  });
  if (result.data !== undefined) {
    return { resource: pickResource(result.data.data, 'media') };
  }
  return { unavailable: unavailableOrThrow(result) };
}

export async function sendInstanceTextMessage(
  client: ApiClient,
  instanceId: string,
  body: { to: string; text: string },
) {
  const result = await client.POST('/v1/instances/{instanceId}/messages/text', {
    params: {
      path: { instanceId },
      header: { 'idempotency-key': idempotencyKey('send-text', instanceId) },
    },
    body,
  });
  return unwrapCommand(result);
}

export async function sendInstanceMediaMessage(
  client: ApiClient,
  instanceId: string,
  body: MediaMessageRequest,
) {
  const result = await client.POST('/v1/instances/{instanceId}/messages/media', {
    params: {
      path: { instanceId },
      header: { 'idempotency-key': idempotencyKey('send-media', instanceId) },
    },
    body,
  });
  return unwrapCommand(result);
}

export async function retryMessage(client: ApiClient, messageId: string) {
  const result = await client.POST('/v1/messages/{messageId}/retry', {
    params: {
      path: { messageId },
      header: { 'idempotency-key': idempotencyKey('retry', messageId) },
    },
  });
  return unwrapCommand(result);
}

export async function cancelMessage(client: ApiClient, messageId: string) {
  const result = await client.POST('/v1/messages/{messageId}/cancel', {
    params: {
      path: { messageId },
      header: { 'idempotency-key': idempotencyKey('cancel', messageId) },
    },
  });
  return unwrapCommand(result);
}

export async function registerMedia(client: ApiClient, body: MediaRegistrationRequest) {
  const result = await client.POST('/v1/media', {
    params: { header: { 'idempotency-key': idempotencyKey('register-media') } },
    body,
  });
  return unwrapCommand(result);
}
