import type { ApiClient } from './client';
import { ApiFailure, unwrapProjection, type ProjectionMeta } from './envelopes';
import type { components } from './generated/schema';

type ConversationPayload = components['schemas']['github_com_evolution-foundation_evolution-go_pkg_projection_service.ProjectedConversation'];

export type ConversationType = 'direct' | 'group' | 'newsletter' | 'broadcast' | 'unknown';
export type ConversationDisplayNameSource = 'full_name' | 'business_name' | 'push_name' | 'first_name' | 'username' | 'provider_chat' | 'group_subject' | 'newsletter_name' | 'broadcast_name';

export type ConversationResource = {
  resourceType: 'conversation';
  conversationId: string;
  contactId?: string;
  aliases: string[];
  aliasesReported: boolean;
  addressingJid?: string;
  type: ConversationType;
  displayName?: string;
  displayNameSource?: ConversationDisplayNameSource;
  displayNameUpdatedAt?: string;
  lastMessageId?: string;
  lastMessageAt?: string;
  lastActivityAt?: string;
  unreadCount: number;
  archived?: boolean;
  pinned?: boolean;
  mutedUntil?: string;
  disappearingTimer?: number;
};

export type ConversationPage = {
  items: ConversationResource[];
  pagination: { nextCursor: string | null; hasMore: boolean };
  total?: number;
};

export type ConversationReadResult<T> = { resource: T; meta?: ProjectionMeta };

function nonEmpty(value: string | undefined): string | undefined {
  return value?.trim() || undefined;
}

function conversationType(value: string | undefined): ConversationType {
  return value === 'direct' || value === 'group' || value === 'newsletter' || value === 'broadcast'
    ? value
    : 'unknown';
}

function toConversation(payload: ConversationPayload): ConversationResource {
  return {
    resourceType: 'conversation',
    conversationId: nonEmpty(payload.conversationId) ?? '',
    contactId: nonEmpty(payload.contactId),
    aliases: [...new Set((payload.aliases ?? []).map((alias) => alias.trim()).filter(Boolean))],
    aliasesReported: payload.aliases !== undefined,
    addressingJid: nonEmpty(payload.addressingJid),
    type: conversationType(payload.type),
    displayName: nonEmpty(payload.displayName),
    displayNameSource: payload.displayNameSource,
    displayNameUpdatedAt: nonEmpty(payload.displayNameUpdatedAt),
    lastMessageId: nonEmpty(payload.lastMessageId),
    lastMessageAt: nonEmpty(payload.lastMessageAt),
    lastActivityAt: nonEmpty(payload.lastActivityAt),
    unreadCount: Math.max(0, payload.unreadCount ?? 0),
    archived: payload.archived,
    pinned: payload.pinned,
    mutedUntil: nonEmpty(payload.mutedUntil),
    disappearingTimer: payload.disappearingTimer,
  };
}

export async function listConversations(
  client: ApiClient,
  params: { cursor?: string; limit?: number } = {},
): Promise<ConversationReadResult<ConversationPage>> {
  const projection = unwrapProjection<ConversationPayload[]>(await client.GET('/conversations', {
    params: { query: { cursor: params.cursor, limit: params.limit ?? 50 } },
  }));
  const nextCursor = projection.meta?.nextCursor ?? null;
  return {
    resource: {
      items: (projection.resource ?? []).map(toConversation).filter((conversation) => conversation.conversationId !== ''),
      pagination: { nextCursor, hasMore: nextCursor !== null },
      total: projection.meta?.total,
    },
    meta: projection.meta,
  };
}

export async function getConversation(client: ApiClient, conversationRef: string): Promise<ConversationReadResult<ConversationResource>> {
  const projection = unwrapProjection<ConversationPayload>(await client.GET('/conversations/{conversationRef}', {
    params: { path: { conversationRef } },
  }));
  const resource = toConversation(projection.resource);
  if (!resource.conversationId) {
    throw new ApiFailure({ code: 'invalid_response', error: 'Conversation response did not include its required canonical conversationId.' }, 500);
  }
  return { resource, meta: projection.meta };
}
