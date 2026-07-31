import type { ApiClient } from './client';
import { invalidResponse, unwrapProjection, type ProjectionMeta } from './envelopes';
import type { components } from './generated/schema';

type ConversationPayload = components['schemas']['github_com_evolution-foundation_evolution-go_pkg_projection_service.ProjectedConversation'];

export type ConversationType = ConversationPayload['type'];
export type ConversationDisplayNameSource = NonNullable<ConversationPayload['displayNameSource']>;

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
  unreadAuthoritative: boolean;
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

function recordOf(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? nonEmpty(value) : undefined;
}

function optionalBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function isCanonicalConversationId(value: string | undefined): value is string {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value));
}

function conversationType(value: unknown): ConversationType | undefined {
  return value === 'direct' || value === 'group' || value === 'newsletter' || value === 'broadcast' || value === 'unknown'
    ? value
    : undefined;
}

function displayNameSource(value: unknown): ConversationDisplayNameSource | undefined {
  return value === 'full_name' || value === 'business_name' || value === 'push_name' || value === 'first_name'
    || value === 'username' || value === 'provider_chat' || value === 'group_subject'
    || value === 'newsletter_name' || value === 'broadcast_name'
    ? value
    : undefined;
}

function toConversation(value: unknown, fail: (message: string) => never): ConversationResource {
  const payload = recordOf(value);
  if (!payload) fail('Conversation response contained a row that was not an object.');

  const conversationId = optionalString(payload.conversationId);
  if (!isCanonicalConversationId(conversationId)) {
    fail('Conversation response did not include a valid canonical conversationId.');
  }
  const type = conversationType(payload.type);
  if (!type) fail(`Conversation ${conversationId} did not include a valid required type.`);
  if (typeof payload.unreadCount !== 'number' || !Number.isInteger(payload.unreadCount) || payload.unreadCount < 0) {
    fail(`Conversation ${conversationId} did not include a valid non-negative unreadCount.`);
  }
  if (typeof payload.unreadAuthoritative !== 'boolean') {
    fail(`Conversation ${conversationId} did not include its required unreadAuthoritative flag.`);
  }

  let aliases: string[] = [];
  const aliasesReported = payload.aliases !== undefined;
  if (aliasesReported) {
    if (!Array.isArray(payload.aliases)) fail(`Conversation ${conversationId} included invalid aliases.`);
    aliases = payload.aliases.map((alias) => {
      const normalized = optionalString(alias);
      if (!normalized) fail(`Conversation ${conversationId} included an invalid alias.`);
      return normalized;
    });
  }

  return {
    resourceType: 'conversation',
    conversationId,
    contactId: optionalString(payload.contactId),
    aliases,
    aliasesReported,
    addressingJid: optionalString(payload.addressingJid),
    type,
    displayName: optionalString(payload.displayName),
    displayNameSource: displayNameSource(payload.displayNameSource),
    displayNameUpdatedAt: optionalString(payload.displayNameUpdatedAt),
    lastMessageId: optionalString(payload.lastMessageId),
    lastMessageAt: optionalString(payload.lastMessageAt),
    lastActivityAt: optionalString(payload.lastActivityAt),
    unreadCount: payload.unreadCount,
    unreadAuthoritative: payload.unreadAuthoritative,
    archived: optionalBoolean(payload.archived),
    pinned: optionalBoolean(payload.pinned),
    mutedUntil: optionalString(payload.mutedUntil),
    disappearingTimer: optionalNumber(payload.disappearingTimer),
  };
}

export async function listConversations(
  client: ApiClient,
  params: { cursor?: string; limit?: number } = {},
): Promise<ConversationReadResult<ConversationPage>> {
  const response = await client.GET('/conversations', {
    params: { query: { cursor: params.cursor, limit: params.limit ?? 50 } },
  });
  const projection = unwrapProjection<unknown>(response);
  const fail = (message: string): never => { throw invalidResponse(response, message); };
  const payloads = projection.resource;
  if (!Array.isArray(payloads)) throw invalidResponse(response, 'Conversation list response data was not an array.');
  const nextCursor = projection.meta?.nextCursor ?? null;
  const items = payloads.map((payload) => toConversation(payload, fail));
  const conversationIds = new Set<string>();
  for (const conversation of items) {
    if (conversationIds.has(conversation.conversationId)) {
      fail(`Conversation list response repeated canonical conversationId ${conversation.conversationId}.`);
    }
    conversationIds.add(conversation.conversationId);
  }
  return {
    resource: {
      items,
      pagination: { nextCursor, hasMore: nextCursor !== null },
      total: projection.meta?.total,
    },
    meta: projection.meta,
  };
}

export async function getConversation(client: ApiClient, conversationRef: string): Promise<ConversationReadResult<ConversationResource>> {
  const response = await client.GET('/conversations/{conversationRef}', {
    params: { path: { conversationRef } },
  });
  const projection = unwrapProjection<unknown>(response);
  const resource = toConversation(projection.resource, (message) => { throw invalidResponse(response, message); });
  return { resource, meta: projection.meta };
}
