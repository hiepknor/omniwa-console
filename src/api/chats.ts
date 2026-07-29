import type { ApiClient } from './client';
import { unwrapProjection, type ProjectionMeta } from './envelopes';
import type { components } from './generated/schema';

type ChatPayload = components['schemas']['github_com_evolution-foundation_evolution-go_pkg_projection_service.ProjectedChat'];

export type ChatType = 'direct' | 'group' | 'newsletter' | 'broadcast' | 'unknown';
export type ChatDisplayNameSource = 'full_name' | 'business_name' | 'push_name' | 'first_name' | 'username' | 'provider_chat' | 'group_subject' | 'newsletter_name' | 'broadcast_name';

export type ChatResource = {
  resourceType: 'chat';
  id: string;
  conversationId?: string;
  contactId?: string;
  chatAliases: string[];
  addressingJid?: string;
  type: ChatType;
  displayName?: string;
  displayNameSource?: ChatDisplayNameSource;
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

export type ChatPage = {
  items: ChatResource[];
  pagination: { nextCursor: string | null; hasMore: boolean };
  total?: number;
};

export type ChatReadResult<T> = { resource: T; meta?: ProjectionMeta };

function nonEmpty(value: string | undefined): string | undefined {
  return value?.trim() || undefined;
}

function chatType(value: string | undefined): ChatType {
  return value === 'direct' || value === 'group' || value === 'newsletter' || value === 'broadcast'
    ? value
    : 'unknown';
}

function toChat(payload: ChatPayload, fallbackId = '', canonicalChatIdentity = false): ChatResource {
  const type = chatType(payload.type);
  const providerChatId = nonEmpty(payload.chatId) ?? fallbackId;
  const conversationId = canonicalChatIdentity && type === 'direct' ? nonEmpty(payload.conversationId) ?? providerChatId : undefined;
  return {
    resourceType: 'chat',
    id: conversationId ?? providerChatId,
    conversationId,
    contactId: nonEmpty(payload.contactId),
    chatAliases: canonicalChatIdentity && type === 'direct'
      ? [...new Set((payload.chatAliases ?? []).map((alias) => alias.trim()).filter(Boolean))]
      : [],
    addressingJid: canonicalChatIdentity && type === 'direct' ? nonEmpty(payload.addressingJid) : undefined,
    type,
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

export async function listChats(
  client: ApiClient,
  params: { cursor?: string; limit?: number; canonicalChatIdentity?: boolean } = {},
): Promise<ChatReadResult<ChatPage>> {
  const projection = unwrapProjection<ChatPayload[]>(await client.GET('/chat/list', {
    params: { query: { cursor: params.cursor, limit: params.limit ?? 50 } },
  }));
  const nextCursor = projection.meta?.nextCursor ?? null;
  return {
    resource: {
      items: (projection.resource ?? []).map((payload) => toChat(payload, '', params.canonicalChatIdentity ?? false)).filter((chat) => chat.id !== ''),
      pagination: { nextCursor, hasMore: nextCursor !== null },
      total: projection.meta?.total,
    },
    meta: projection.meta,
  };
}

export async function getChat(client: ApiClient, chatId: string, canonicalChatIdentity = false): Promise<ChatReadResult<ChatResource>> {
  const projection = unwrapProjection<ChatPayload>(await client.GET('/chat/info/{chatId}', {
    params: { path: { chatId } },
  }));
  return { resource: toChat(projection.resource, chatId, canonicalChatIdentity), meta: projection.meta };
}
