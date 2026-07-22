import type { ApiClient } from './client';
import type { components } from './generated/platform-schema';
import { notImplemented, NOT_IMPLEMENTED_READ, type CollectionEnvelope, type CommandResult, type PublicData, type UnavailableRead } from './envelopes';

// omniwa-go has no list-chats / list-messages / message-history REST surface, and
// realtime (its only message source) is WebSocket-only and disabled here. The
// chats workspace is stubbed until omniwa-go grows chat/history endpoints.
export type ChatResource = components['schemas']['ChatResource'];
export type MessageResource = components['schemas']['MessageResource'];
export type MediaResource = components['schemas']['MediaResource'];
export type MediaMessageRequest = components['schemas']['MediaMessageRequest'];
export type MediaRegistrationRequest = components['schemas']['MediaRegistrationRequest'];
export type ChatPagination = CollectionEnvelope['meta']['pagination'];
export type ReadResult<T> = { resource?: T; unavailable?: UnavailableRead };

export async function listInstanceChats(
  _client: ApiClient,
  _instanceId: string,
  _params: { cursor?: string; limit?: number } = {},
): Promise<ReadResult<{ items: ChatResource[]; pagination: ChatPagination }>> {
  return { unavailable: NOT_IMPLEMENTED_READ };
}

export async function getChat(_client: ApiClient, _chatId: string): Promise<ReadResult<ChatResource>> {
  return { unavailable: NOT_IMPLEMENTED_READ };
}

export async function listInstanceMessages(
  _client: ApiClient,
  _instanceId: string,
  _params: { cursor?: string; limit?: number; sort?: string } = {},
): Promise<ReadResult<{ items: MessageResource[]; pagination: ChatPagination }>> {
  return { unavailable: NOT_IMPLEMENTED_READ };
}

export async function getMessage(_client: ApiClient, _messageId: string): Promise<ReadResult<MessageResource>> {
  return { unavailable: NOT_IMPLEMENTED_READ };
}

export async function getMessageDeliveryHistory(
  _client: ApiClient,
  _messageId: string,
): Promise<ReadResult<{ data: PublicData; requestId: string }>> {
  return { unavailable: NOT_IMPLEMENTED_READ };
}

export async function getMedia(_client: ApiClient, _mediaId: string): Promise<ReadResult<MediaResource>> {
  return { unavailable: NOT_IMPLEMENTED_READ };
}

export async function sendInstanceTextMessage(
  _client: ApiClient,
  _instanceId: string,
  _body: { to: string; text: string },
): Promise<CommandResult> {
  throw notImplemented('Send text message');
}

export async function sendInstanceMediaMessage(
  _client: ApiClient,
  _instanceId: string,
  _body: MediaMessageRequest,
): Promise<CommandResult> {
  throw notImplemented('Send media message');
}

export async function retryMessage(_client: ApiClient, _messageId: string): Promise<CommandResult> {
  throw notImplemented('Retry message');
}

export async function cancelMessage(_client: ApiClient, _messageId: string): Promise<CommandResult> {
  throw notImplemented('Cancel message');
}

export async function registerMedia(_client: ApiClient, _body: MediaRegistrationRequest): Promise<CommandResult> {
  throw notImplemented('Register media');
}
