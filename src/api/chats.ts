import type { ApiClient } from './client';
import type { components } from './generated/platform-schema';
import { notImplemented, type CollectionEnvelope, type CommandResult, type PublicData, type UnavailableRead } from './envelopes';

// omniwa-go has no list-chats / list-messages / message-history REST surface, and
// realtime (its only message source) is WebSocket-only and disabled here. The
// chats workspace is stubbed until omniwa-go grows chat/history endpoints.
export type ChatResource = components['schemas']['ChatResource'];
export type MessageResource = components['schemas']['MessageResource'];
export type ContactResource = components['schemas']['ContactResource'];
export type LabelResource = components['schemas']['LabelResource'];
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
  throw notImplemented('Chats');
}

export async function getChat(_client: ApiClient, _chatId: string): Promise<ReadResult<ChatResource>> {
  throw notImplemented('Chat detail');
}

export async function listInstanceMessages(
  _client: ApiClient,
  _instanceId: string,
  _params: { cursor?: string; limit?: number; sort?: string } = {},
): Promise<ReadResult<{ items: MessageResource[]; pagination: ChatPagination }>> {
  throw notImplemented('Messages');
}

export async function getMessage(_client: ApiClient, _messageId: string): Promise<ReadResult<MessageResource>> {
  throw notImplemented('Message detail');
}

export async function getMessageDeliveryHistory(
  _client: ApiClient,
  _messageId: string,
): Promise<ReadResult<{ data: PublicData; requestId: string }>> {
  throw notImplemented('Message delivery history');
}

export async function listInstanceContacts(
  _client: ApiClient,
  _instanceId: string,
  _params: { cursor?: string; limit?: number } = {},
): Promise<ReadResult<{ items: ContactResource[]; pagination: ChatPagination }>> {
  throw notImplemented('Contacts');
}

export async function getContact(_client: ApiClient, _contactId: string): Promise<ReadResult<ContactResource>> {
  throw notImplemented('Contact detail');
}

export async function listInstanceLabels(
  _client: ApiClient,
  _instanceId: string,
  _params: { cursor?: string; limit?: number } = {},
): Promise<ReadResult<{ items: LabelResource[]; pagination: ChatPagination }>> {
  throw notImplemented('Labels');
}

export async function getMedia(_client: ApiClient, _mediaId: string): Promise<ReadResult<MediaResource>> {
  throw notImplemented('Media');
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
