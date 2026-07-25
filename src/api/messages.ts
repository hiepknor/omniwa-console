import type { ApiClient } from './client';
import { unwrapCommand, unwrapProjection, type CommandResult, type ProjectionMeta } from './envelopes';
import type { components as backendComponents } from './generated/schema';

type MessagePayload = backendComponents['schemas']['github_com_evolution-foundation_evolution-go_pkg_projection_service.ProjectedMessage'];
type ReceiptPayload = backendComponents['schemas']['github_com_evolution-foundation_evolution-go_pkg_projection_service.ProjectedMessageReceipt'];

export type MessageDirection = 'incoming' | 'outgoing' | 'system' | 'unknown';
export type MessageProvenance = 'live' | 'history_sync' | 'write_through' | 'unknown';

export type MessageResource = {
  resourceType: 'message';
  id: string;
  chatId: string;
  senderJid?: string;
  recipientJid?: string;
  participantJid?: string;
  direction: MessageDirection;
  type: string;
  contentText?: string;
  caption?: string;
  contentSummary?: string;
  quotedMessageId?: string;
  mediaType?: string;
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
  recipientJid: string;
  receiptType: string;
  receiptAt: string;
};

export type MessagePage = {
  items: MessageResource[];
  pagination: { nextCursor: string | null; hasMore: boolean };
};

export type MessageReadResult<T> = { resource: T; meta?: ProjectionMeta };

export type MediaType = 'image' | 'video' | 'audio' | 'document';

export type SendMediaInput = {
  url: string;
  mediaType: MediaType;
  caption?: string;
  filename?: string;
};

function nonEmpty(value: string | undefined): string | undefined {
  return value?.trim() || undefined;
}

function direction(value: string | undefined): MessageDirection {
  return value === 'incoming' || value === 'outgoing' || value === 'system' ? value : 'unknown';
}

function provenance(value: string | undefined): MessageProvenance {
  return value === 'live' || value === 'history_sync' || value === 'write_through' ? value : 'unknown';
}

function toMessage(payload: MessagePayload, fallbackId = ''): MessageResource {
  return {
    resourceType: 'message',
    id: nonEmpty(payload.messageId) ?? fallbackId,
    chatId: nonEmpty(payload.chatId) ?? '',
    senderJid: nonEmpty(payload.senderJid),
    recipientJid: nonEmpty(payload.recipientJid),
    participantJid: nonEmpty(payload.participantJid),
    direction: direction(payload.direction),
    type: nonEmpty(payload.messageType) ?? 'unknown',
    contentText: nonEmpty(payload.contentText),
    caption: nonEmpty(payload.caption),
    contentSummary: nonEmpty(payload.contentSummary),
    quotedMessageId: nonEmpty(payload.quotedMessageId),
    mediaType: nonEmpty(payload.mediaType),
    mediaMimeType: nonEmpty(payload.mediaMimeType),
    mediaFileName: nonEmpty(payload.mediaFileName),
    mediaSize: payload.mediaSize,
    mediaDurationSeconds: payload.mediaDurationSeconds,
    mediaWidth: payload.mediaWidth,
    mediaHeight: payload.mediaHeight,
    status: nonEmpty(payload.status),
    createdAt: nonEmpty(payload.providerTimestamp) ?? '',
    sentAt: nonEmpty(payload.sentAt),
    deliveredAt: nonEmpty(payload.deliveredAt),
    readAt: nonEmpty(payload.readAt),
    playedAt: nonEmpty(payload.playedAt),
    provenance: provenance(payload.provenance),
    historySyncId: nonEmpty(payload.historySyncId),
    retentionExpiresAt: nonEmpty(payload.retentionExpiresAt),
  };
}

export async function listMessages(
  client: ApiClient,
  chatId: string,
  params: { cursor?: string; limit?: number } = {},
): Promise<MessageReadResult<MessagePage>> {
  const projection = unwrapProjection<MessagePayload[]>(await client.GET('/chat/{chatId}/messages', {
    params: { path: { chatId }, query: { cursor: params.cursor, limit: params.limit ?? 50 } },
  }));
  const nextCursor = projection.meta?.nextCursor ?? null;
  return {
    resource: {
      items: (projection.resource ?? [])
        .map((payload) => toMessage(payload))
        .filter((message) => message.id !== '' && message.chatId !== '' && message.createdAt !== ''),
      pagination: { nextCursor, hasMore: nextCursor !== null },
    },
    meta: projection.meta,
  };
}

export async function getMessage(client: ApiClient, messageId: string): Promise<MessageReadResult<MessageResource>> {
  const projection = unwrapProjection<MessagePayload>(await client.GET('/message/{messageId}', {
    params: { path: { messageId } },
  }));
  return { resource: toMessage(projection.resource, messageId), meta: projection.meta };
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
        recipientJid: nonEmpty(payload.recipientJid) ?? '',
        receiptType: nonEmpty(payload.receiptType) ?? '',
        receiptAt: nonEmpty(payload.receiptAt) ?? '',
      };
      return receipt.recipientJid && receipt.receiptType && receipt.receiptAt ? [receipt] : [];
    }),
    meta: projection.meta,
  };
}

function safeSendAcknowledgement(result: CommandResult): CommandResult {
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
      messageId: typeof payload?.ID === 'string' ? payload.ID : typeof info?.ID === 'string' ? info.ID : undefined,
      acknowledgedAt: typeof payload?.Timestamp === 'string' ? payload.Timestamp : typeof info?.Timestamp === 'string' ? info.Timestamp : undefined,
    },
  };
}

export async function sendTextMessage(client: ApiClient, chatId: string, text: string): Promise<CommandResult> {
  // Swaggo marks all request fields optional; the handler requires number/text.
  return safeSendAcknowledgement(unwrapCommand(await client.POST('/send/text', {
    body: { number: chatId, text } as never,
  })));
}

export async function sendMediaMessage(
  client: ApiClient,
  chatId: string,
  input: SendMediaInput,
): Promise<CommandResult> {
  // The JSON branch requires number/url/type at runtime. Keep binary and
  // base64 media outside browser state; this adapter accepts HTTP(S) URLs only.
  return safeSendAcknowledgement(unwrapCommand(await client.POST('/send/media', {
    body: {
      number: chatId,
      url: input.url,
      type: input.mediaType,
      ...(input.caption ? { caption: input.caption } : {}),
      ...(input.filename ? { filename: input.filename } : {}),
    } as never,
  })));
}
