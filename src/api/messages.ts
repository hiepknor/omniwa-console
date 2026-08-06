import type { ApiClient } from './client';
import { invalidResponse, unwrapCommand, unwrapProjection, type CommandResult, type ProjectionMeta } from './envelopes';
import type { components as backendComponents } from './generated/schema';

type ReceiptPayload = backendComponents['schemas']['github_com_evolution-foundation_evolution-go_pkg_projection_service.ProjectedMessageReceipt'];
type MessagePayload = backendComponents['schemas']['github_com_evolution-foundation_evolution-go_pkg_projection_service.ProjectedConversationMessage'];

export type MessageDirection = MessagePayload['direction'] | 'unknown';
export type MessageProvenance = MessagePayload['provenance'] | 'unknown';

export type MessageResource = {
  resourceType: 'message';
  id: string;
  conversationId: string;
  /** Provider Chat ID retained only as backend-reported provenance. */
  providerChatId?: string;
  senderJid?: string;
  senderPhoneNumber?: string;
  recipientJid?: string;
  recipientPhoneNumber?: string;
  participantJid?: string;
  participantPhoneNumber?: string;
  direction: MessageDirection;
  type: string;
  contentText?: string;
  caption?: string;
  contentSummary?: string;
  quotedMessageId?: string;
  mediaType?: string;
  mediaAssetId?: string;
  mediaMimeType?: string;
  mediaFileName?: string;
  mediaSize?: number;
  mediaDurationSeconds?: number;
  mediaWidth?: number;
  mediaHeight?: number;
  status?: string;
  createdAt: string;
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  playedAt?: string;
  provenance: MessageProvenance;
  historySyncId?: string;
  retentionExpiresAt?: string;
};

export type MessageReceiptResource = {
  resourceType: 'messageReceipt';
  messageId: string;
  recipientJid?: string;
  recipientPhoneNumber?: string;
  receiptType: string;
  receiptAt: string;
};

export type MessagePage = {
  items: MessageResource[];
  pagination: { nextCursor: string | null; hasMore: boolean };
};

export type MessageReadResult<T> = { resource: T; meta?: ProjectionMeta };

export type MediaType = 'image' | 'video' | 'audio' | 'document';

export type SendMediaInput =
  | { source: 'url'; url: string; mediaType: MediaType; caption?: string; filename?: string }
  | { source: 'asset'; mediaAssetId: string; caption?: string };

export type MessageSendAcknowledgement = { messageId?: string; acknowledgedAt?: string };
export type MessageCommandResult = Omit<CommandResult, 'data'> & { data: MessageSendAcknowledgement };

function nonEmpty(value: string | undefined): string | undefined {
  return value?.trim() || undefined;
}

function recordOf(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? nonEmpty(value) : undefined;
}

function exactNonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 && value === value.trim()
    ? value
    : undefined;
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function isCanonicalConversationId(value: string | undefined): value is string {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value));
}

function isTimestamp(value: string | undefined): value is string {
  return Boolean(value && !Number.isNaN(Date.parse(value)));
}

function direction(value: unknown): MessageDirection {
  return value === 'incoming' || value === 'outgoing' || value === 'system' ? value : 'unknown';
}

function provenance(value: unknown): MessageProvenance {
  return value === 'live' || value === 'history_sync' || value === 'write_through' ? value : 'unknown';
}

function toMessage(value: unknown, fail: (message: string) => never): MessageResource {
  const payload = recordOf(value);
  if (!payload) fail('Message response contained a row that was not an object.');

  const messageId = exactNonEmptyString(payload.messageId);
  if (!messageId) fail('Message response did not include its required messageId.');
  const conversationId = exactNonEmptyString(payload.conversationId);
  if (!isCanonicalConversationId(conversationId)) {
    fail(`Message ${messageId} did not include a valid canonical conversationId.`);
  }
  const providerTimestamp = exactNonEmptyString(payload.providerTimestamp);
  if (!isTimestamp(providerTimestamp)) {
    fail(`Message ${messageId} did not include a valid authoritative providerTimestamp.`);
  }

  return {
    resourceType: 'message',
    id: messageId,
    conversationId,
    providerChatId: optionalString(payload.providerChatId),
    senderJid: optionalString(payload.senderJid),
    senderPhoneNumber: optionalString(payload.senderPhoneNumber),
    recipientJid: optionalString(payload.recipientJid),
    recipientPhoneNumber: optionalString(payload.recipientPhoneNumber),
    participantJid: optionalString(payload.participantJid),
    participantPhoneNumber: optionalString(payload.participantPhoneNumber),
    direction: direction(payload.direction),
    type: optionalString(payload.messageType) ?? 'unknown',
    contentText: optionalString(payload.contentText),
    caption: optionalString(payload.caption),
    contentSummary: optionalString(payload.contentSummary),
    quotedMessageId: optionalString(payload.quotedMessageId),
    mediaType: optionalString(payload.mediaType),
    mediaAssetId: optionalString(payload.mediaAssetId),
    mediaMimeType: optionalString(payload.mediaMimeType),
    mediaFileName: optionalString(payload.mediaFileName),
    mediaSize: optionalNumber(payload.mediaSize),
    mediaDurationSeconds: optionalNumber(payload.mediaDurationSeconds),
    mediaWidth: optionalNumber(payload.mediaWidth),
    mediaHeight: optionalNumber(payload.mediaHeight),
    status: optionalString(payload.status),
    createdAt: providerTimestamp,
    sentAt: optionalString(payload.sentAt),
    deliveredAt: optionalString(payload.deliveredAt),
    readAt: optionalString(payload.readAt),
    playedAt: optionalString(payload.playedAt),
    provenance: provenance(payload.provenance),
    historySyncId: optionalString(payload.historySyncId),
    retentionExpiresAt: optionalString(payload.retentionExpiresAt),
  };
}

export async function listMessages(
  client: ApiClient,
  conversationRef: string,
  params: { cursor?: string; limit?: number } = {},
): Promise<MessageReadResult<MessagePage>> {
  const response = await client.GET('/conversations/{conversationRef}/messages', {
    params: { path: { conversationRef }, query: { cursor: params.cursor, limit: params.limit ?? 50 } },
  });
  const projection = unwrapProjection<unknown>(response);
  const fail = (message: string): never => { throw invalidResponse(response, message); };
  const payloads = projection.resource;
  if (!Array.isArray(payloads)) throw invalidResponse(response, 'Message list response data was not an array.');
  const nextCursor = projection.meta?.nextCursor ?? null;
  return {
    resource: {
      items: payloads.map((payload) => toMessage(payload, fail)),
      pagination: { nextCursor, hasMore: nextCursor !== null },
    },
    meta: projection.meta,
  };
}

export async function getMessage(client: ApiClient, conversationRef: string, messageId: string): Promise<MessageReadResult<MessageResource>> {
  const response = await client.GET('/conversations/{conversationRef}/messages/{messageId}', {
    params: { path: { conversationRef, messageId } },
  });
  const projection = unwrapProjection<unknown>(response);
  const resource = toMessage(projection.resource, (message) => { throw invalidResponse(response, message); });
  return { resource, meta: projection.meta };
}

export async function listMessageReceipts(client: ApiClient, messageId: string): Promise<MessageReadResult<MessageReceiptResource[]>> {
  const projection = unwrapProjection<ReceiptPayload[]>(await client.GET('/message/{messageId}/delivery', {
    params: { path: { messageId } },
  }));
  return {
    resource: (projection.resource ?? []).flatMap((payload) => {
      const receipt = {
        resourceType: 'messageReceipt' as const,
        messageId: nonEmpty(payload.messageId) ?? messageId,
        recipientJid: nonEmpty(payload.recipientJid),
        recipientPhoneNumber: nonEmpty(payload.recipientPhoneNumber),
        receiptType: nonEmpty(payload.receiptType) ?? '',
        receiptAt: nonEmpty(payload.receiptAt) ?? '',
      };
      return (receipt.recipientJid || receipt.recipientPhoneNumber) && receipt.receiptType && receipt.receiptAt ? [receipt] : [];
    }),
    meta: projection.meta,
  };
}

function safeSendAcknowledgement(result: CommandResult): MessageCommandResult {
  const payload = result.data !== null && typeof result.data === 'object' && !Array.isArray(result.data)
    ? result.data as Record<string, unknown>
    : undefined;
  const info = payload?.Info !== null && typeof payload?.Info === 'object' && !Array.isArray(payload.Info)
    ? payload.Info as Record<string, unknown>
    : undefined;
  // The runtime can include a provider-native message object. Keep only the
  // documented acknowledgement fields in the mutation cache/UI boundary.
  return {
    disposition: result.disposition,
    message: result.message,
    data: {
      messageId: typeof payload?.messageId === 'string' ? payload.messageId : typeof payload?.ID === 'string' ? payload.ID : typeof info?.ID === 'string' ? info.ID : undefined,
      acknowledgedAt: typeof payload?.timestamp === 'string' ? payload.timestamp : typeof payload?.Timestamp === 'string' ? payload.Timestamp : typeof info?.Timestamp === 'string' ? info.Timestamp : undefined,
    },
  };
}

export async function sendTextMessage(client: ApiClient, addressingJid: string, text: string): Promise<MessageCommandResult> {
  // Swaggo marks all request fields optional; the handler requires number/text.
  return safeSendAcknowledgement(unwrapCommand(await client.POST('/send/text', {
    body: { number: addressingJid, text } as never,
  })));
}

export async function sendMediaMessage(
  client: ApiClient,
  addressingJid: string,
  input: SendMediaInput,
): Promise<MessageCommandResult> {
  const source = input.source === 'asset'
    ? { type: 'image', mediaAssetId: input.mediaAssetId }
    : { url: input.url, type: input.mediaType, ...(input.filename ? { filename: input.filename } : {}) };
  return safeSendAcknowledgement(unwrapCommand(await client.POST('/send/media', {
    body: {
      number: addressingJid,
      ...source,
      ...(input.caption ? { caption: input.caption } : {}),
    } as never,
  })));
}
