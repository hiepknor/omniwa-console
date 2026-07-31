import { describe, expect, it, vi } from 'vitest';
import type { ApiClient } from './client';
import { getConversation, listConversations } from './conversations';

function ok(data: unknown, headers?: HeadersInit) {
  return { data, response: new Response(null, { status: 200, headers }) };
}

const conversation = {
  conversationId: '4c2a5707-95f6-4565-87db-20d983bbd555',
  contactId: '9c37e2c7-875c-48ff-a298-00b853409cb1',
  aliases: ['100@s.whatsapp.net', '123@lid', '100@s.whatsapp.net'],
  addressingJid: '123@lid',
  type: 'direct',
  displayName: 'Ada',
  displayNameSource: 'full_name',
  displayNameUpdatedAt: '2026-07-22T07:59:00Z',
  lastMessageId: 'message-1',
  lastMessageAt: '2026-07-22T08:00:00Z',
  lastActivityAt: '2026-07-22T08:00:01Z',
  unreadCount: 2,
  unreadAuthoritative: true,
  archived: false,
  pinned: true,
};

describe('canonical conversations projection adapter', () => {
  it('uses the canonical list endpoint and preserves opaque pagination and authoritative total', async () => {
    const GET = vi.fn().mockResolvedValue(ok({
      message: 'success',
      data: [conversation],
      meta: { source: 'projection', syncStatus: 'stale', nextCursor: 'opaque/next', total: 217 },
    }));

    const result = await listConversations({ GET } as unknown as ApiClient, { cursor: 'opaque/current', limit: 25 });

    expect(GET).toHaveBeenCalledWith('/conversations', { params: { query: { cursor: 'opaque/current', limit: 25 } } });
    expect(result.resource.items).toEqual([expect.objectContaining({
      resourceType: 'conversation',
      conversationId: conversation.conversationId,
      contactId: conversation.contactId,
      aliases: ['100@s.whatsapp.net', '123@lid', '100@s.whatsapp.net'],
      aliasesReported: true,
      addressingJid: conversation.addressingJid,
      type: 'direct',
      unreadCount: 2,
      unreadAuthoritative: true,
    })]);
    expect(result.resource.pagination).toEqual({ nextCursor: 'opaque/next', hasMore: true });
    expect(result.resource.total).toBe(217);
    expect(result.meta?.syncStatus).toBe('stale');
  });

  it('preserves whether provider aliases were reported instead of turning absence into zero', async () => {
    const GET = vi.fn().mockResolvedValue(ok({
      message: 'success',
      data: { ...conversation, aliases: undefined },
      meta: { syncStatus: 'ready' },
    }));

    const result = await getConversation({ GET } as unknown as ApiClient, conversation.conversationId);

    expect(result.resource.aliases).toEqual([]);
    expect(result.resource.aliasesReported).toBe(false);
  });

  it('normalizes an absorbed provider Chat alias to the returned canonical conversation ID', async () => {
    const GET = vi.fn().mockResolvedValue(ok({ message: 'success', data: conversation, meta: { syncStatus: 'ready' } }));
    const result = await getConversation({ GET } as unknown as ApiClient, '123@lid');
    expect(GET).toHaveBeenCalledWith('/conversations/{conversationRef}', { params: { path: { conversationRef: '123@lid' } } });
    expect(result.resource.conversationId).toBe(conversation.conversationId);
  });

  it('does not group repeated display names in the browser adapter', async () => {
    const second = { ...conversation, conversationId: '71e75e2c-77a8-48f0-9fc8-99bc3e5c9694', contactId: 'b1277eeb-fccb-4909-a514-d4a3ca5f2a26' };
    const GET = vi.fn().mockResolvedValue(ok({ message: 'success', data: [conversation, second], meta: { total: 2 } }));
    const result = await listConversations({ GET } as unknown as ApiClient);
    expect(result.resource.items.map((item) => item.conversationId)).toEqual([conversation.conversationId, second.conversationId]);
    expect(result.resource.total).toBe(2);
  });

  it('keeps group, newsletter, and broadcast identities distinct even when provider targets match', async () => {
    const group = { ...conversation, conversationId: '71e75e2c-77a8-48f0-9fc8-99bc3e5c9694', type: 'group', addressingJid: 'shared@broadcast' };
    const newsletter = { ...conversation, conversationId: 'dc5ba585-7325-4a91-9ac7-cfab4d5c2226', type: 'newsletter', addressingJid: 'shared@broadcast' };
    const broadcast = { ...conversation, conversationId: 'f1e45f7b-e1cd-4fc3-bf70-12eeb58637e6', type: 'broadcast', addressingJid: 'shared@broadcast' };
    const GET = vi.fn().mockResolvedValue(ok({ message: 'success', data: [conversation, group, newsletter, broadcast], meta: { total: 4 } }));

    const result = await listConversations({ GET } as unknown as ApiClient);

    expect(result.resource.items.map(({ conversationId, type }) => [conversationId, type])).toEqual([
      [conversation.conversationId, 'direct'],
      [group.conversationId, 'group'],
      [newsletter.conversationId, 'newsletter'],
      [broadcast.conversationId, 'broadcast'],
    ]);
  });

  it('fails closed instead of hiding a duplicate canonical conversationId', async () => {
    const GET = vi.fn().mockResolvedValue(ok({
      message: 'success',
      data: [conversation, { ...conversation, aliases: ['another@lid'], addressingJid: 'another@lid' }],
      meta: { total: 2 },
    }));

    await expect(listConversations({ GET } as unknown as ApiClient)).rejects.toMatchObject({
      code: 'invalid_response',
      message: expect.stringContaining('repeated canonical conversationId'),
    });
  });

  it('preserves a non-authoritative unread count as best-known data instead of coercing it to zero', async () => {
    const GET = vi.fn().mockResolvedValue(ok({ message: 'success', data: { ...conversation, unreadCount: 7, unreadAuthoritative: false } }));
    const result = await getConversation({ GET } as unknown as ApiClient, conversation.conversationId);
    expect(result.resource).toMatchObject({ unreadCount: 7, unreadAuthoritative: false });
  });

  it('fails closed when required unread data is negative instead of coercing it to zero', async () => {
    const GET = vi.fn().mockResolvedValue(ok({
      message: 'success',
      data: { ...conversation, type: 'provider-new-type', unreadCount: -2, SourceEventKey: 'secret' },
      meta: { source: 'projection', syncStatus: 'ready' },
    }));
    await expect(getConversation({ GET } as unknown as ApiClient, conversation.conversationId)).rejects.toMatchObject({ code: 'invalid_response' });
  });

  it('fails the whole list when a row lacks conversationId instead of dropping it or falling back', async () => {
    const GET = vi.fn().mockResolvedValue(ok({
      message: 'success',
      data: [{ ...conversation, conversationId: undefined, aliases: ['fallback@lid'], addressingJid: 'fallback@lid', providerChatId: 'provider-id' }, conversation],
      meta: { syncStatus: 'ready', total: 2 },
    }));
    await expect(listConversations({ GET } as unknown as ApiClient)).rejects.toMatchObject({ code: 'invalid_response' });
  });

  it('fails closed when canonical detail omits its required conversationId', async () => {
    const GET = vi.fn().mockResolvedValue(ok({ message: 'success', data: { ...conversation, conversationId: undefined, addressingJid: '123@lid' } }));
    await expect(getConversation({ GET } as unknown as ApiClient, '123@lid')).rejects.toMatchObject({ code: 'invalid_response' });
  });

  it('requires unreadAuthoritative and preserves the successful envelope request ID on failure', async () => {
    const GET = vi.fn().mockResolvedValue(ok({
      message: 'success',
      requestId: 'body-request-id',
      data: { ...conversation, unreadAuthoritative: undefined },
    }));

    await expect(getConversation({ GET } as unknown as ApiClient, conversation.conversationId)).rejects.toMatchObject({
      code: 'invalid_response',
      requestId: 'body-request-id',
    });
  });
});
