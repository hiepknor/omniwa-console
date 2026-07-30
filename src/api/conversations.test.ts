import { describe, expect, it, vi } from 'vitest';
import type { ApiClient } from './client';
import { getConversation, listConversations } from './conversations';

function ok(data: unknown) {
  return { data, response: new Response(null, { status: 200 }) };
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
      aliases: ['100@s.whatsapp.net', '123@lid'],
      aliasesReported: true,
      addressingJid: conversation.addressingJid,
      type: 'direct',
      unreadCount: 2,
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

  it('uses safe presentation defaults without exposing unknown provider fields', async () => {
    const GET = vi.fn().mockResolvedValue(ok({
      message: 'success',
      data: { ...conversation, type: 'provider-new-type', unreadCount: -2, SourceEventKey: 'secret' },
      meta: { source: 'projection', syncStatus: 'ready' },
    }));
    const result = await getConversation({ GET } as unknown as ApiClient, conversation.conversationId);
    expect(result.resource).toEqual(expect.objectContaining({ conversationId: conversation.conversationId, type: 'unknown', unreadCount: 0 }));
    expect(result.resource).not.toHaveProperty('SourceEventKey');
  });

  it('drops malformed list rows instead of using an alias or requested ref as identity', async () => {
    const GET = vi.fn().mockResolvedValue(ok({ message: 'success', data: [{ aliases: ['fallback@lid'] }, conversation], meta: { syncStatus: 'ready' } }));
    const result = await listConversations({ GET } as unknown as ApiClient);
    expect(result.resource.items.map((item) => item.conversationId)).toEqual([conversation.conversationId]);
  });

  it('fails closed when canonical detail omits its required conversationId', async () => {
    const GET = vi.fn().mockResolvedValue(ok({ message: 'success', data: { addressingJid: '123@lid', type: 'direct', unreadCount: 0 } }));
    await expect(getConversation({ GET } as unknown as ApiClient, '123@lid')).rejects.toMatchObject({ code: 'invalid_response' });
  });
});
