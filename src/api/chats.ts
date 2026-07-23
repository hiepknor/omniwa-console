import type { ApiClient } from './client';
import { unwrapProjection, type ProjectionMeta } from './envelopes';
import type { components } from './generated/schema';

type ChatPayload = components['schemas']['github_com_evolution-foundation_evolution-go_pkg_projection_service.ProjectedChat'];

export type ChatType = 'direct' | 'group' | 'newsletter' | 'broadcast' | 'unknown';

export type ChatResource = {
  resourceType: 'chat';
  id: string;
  contactId?: string;
  type: ChatType;
  displayName?: string;
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

function toChat(payload: ChatPayload, fallbackId = ''): ChatResource {
  return {
    resourceType: 'chat',
    id: nonEmpty(payload.chatId) ?? fallbackId,
    contactId: nonEmpty(payload.contactId),
    type: chatType(payload.type),
    displayName: nonEmpty(payload.displayName),
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
  params: { cursor?: string; limit?: number } = {},
): Promise<ChatReadResult<ChatPage>> {
  const projection = unwrapProjection<ChatPayload[]>(await client.GET('/chat/list', {
    params: { query: { cursor: params.cursor, limit: params.limit ?? 50 } },
  }));
  const nextCursor = projection.meta?.nextCursor ?? null;
  return {
    resource: {
      items: (projection.resource ?? []).map((payload) => toChat(payload)).filter((chat) => chat.id !== ''),
      pagination: { nextCursor, hasMore: nextCursor !== null },
    },
    meta: projection.meta,
  };
}

export async function getChat(client: ApiClient, chatId: string): Promise<ChatReadResult<ChatResource>> {
  const projection = unwrapProjection<ChatPayload>(await client.GET('/chat/info/{chatId}', {
    params: { path: { chatId } },
  }));
  return { resource: toChat(projection.resource, chatId), meta: projection.meta };
}
