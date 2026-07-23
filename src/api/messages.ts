import type { ApiClient } from './client';
import type { components } from './generated/platform-schema';
import { notImplemented, NOT_IMPLEMENTED_READ, type CollectionEnvelope, type CommandResult, type PublicData, type UnavailableRead } from './envelopes';

export type MessageResource = components['schemas']['MessageResource'];
export type MediaResource = components['schemas']['MediaResource'];
export type MediaMessageRequest = components['schemas']['MediaMessageRequest'];
export type MediaRegistrationRequest = components['schemas']['MediaRegistrationRequest'];
export type MessagePagination = CollectionEnvelope['meta']['pagination'];
export type MessageReadResult<T> = { resource?: T; unavailable?: UnavailableRead };

export async function listInstanceMessages(
  _client: ApiClient,
  _instanceId: string,
  _params: { cursor?: string; limit?: number; sort?: string } = {},
): Promise<MessageReadResult<{ items: MessageResource[]; pagination: MessagePagination }>> {
  return { unavailable: NOT_IMPLEMENTED_READ };
}

export async function getMessage(_client: ApiClient, _messageId: string): Promise<MessageReadResult<MessageResource>> {
  return { unavailable: NOT_IMPLEMENTED_READ };
}

export async function getMessageDeliveryHistory(
  _client: ApiClient,
  _messageId: string,
): Promise<MessageReadResult<{ data: PublicData; requestId: string }>> {
  return { unavailable: NOT_IMPLEMENTED_READ };
}

export async function getMedia(_client: ApiClient, _mediaId: string): Promise<MessageReadResult<MediaResource>> {
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
