import { describe, expect, it, vi } from 'vitest';
import type { ApiClient } from './client';
import { getChat, listChats } from './chats';

function ok(data: unknown) {
  return { data, response: new Response(null, { status: 200 }) };
}

const chat = {
  chatId: '100@s.whatsapp.net',
  conversationId: '4c2a5707-95f6-4565-87db-20d983bbd555',
  contactId: 'contact-1',
  chatAliases: ['100@s.whatsapp.net', '123@lid', '100@s.whatsapp.net'],
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

describe('chats projection adapter', () => {
  it('normalizes list rows and preserves opaque pagination/freshness', async () => {
    const GET = vi.fn().mockResolvedValue(ok({
      message: 'success',
      data: [chat],
      meta: { source: 'projection', syncStatus: 'stale', nextCursor: 'opaque/next', total: 217 },
    }));

    const result = await listChats({ GET } as unknown as ApiClient, { cursor: 'opaque/current', limit: 25 });

    expect(GET).toHaveBeenCalledWith('/chat/list', { params: { query: { cursor: 'opaque/current', limit: 25 } } });
    expect(result.resource.items).toEqual([expect.objectContaining({
      resourceType: 'chat', id: chat.chatId, contactId: 'contact-1', type: 'direct', displayNameSource: 'full_name', unreadCount: 2,
      conversationId: undefined, chatAliases: [], addressingJid: undefined,
    })]);
    expect(result.resource.pagination).toEqual({ nextCursor: 'opaque/next', hasMore: true });
    expect(result.resource.total).toBe(217);
    expect(result.meta?.syncStatus).toBe('stale');
  });

  it('uses backend-owned canonical direct-conversation identity only behind its capability gate', async () => {
    const GET = vi.fn().mockResolvedValue(ok({ message: 'success', data: [chat], meta: { total: 1 } }));
    const result = await listChats({ GET } as unknown as ApiClient, { canonicalChatIdentity: true });
    expect(result.resource.items[0]).toMatchObject({
      id: chat.conversationId,
      conversationId: chat.conversationId,
      contactId: chat.contactId,
      chatAliases: ['100@s.whatsapp.net', '123@lid'],
      addressingJid: chat.addressingJid,
    });
    expect(result.resource.total).toBe(1);
  });

  it('normalizes an absorbed provider Chat ID lookup to the canonical conversation', async () => {
    const GET = vi.fn().mockResolvedValue(ok({ message: 'success', data: chat, meta: { syncStatus: 'ready' } }));
    const result = await getChat({ GET } as unknown as ApiClient, '123@lid', true);
    expect(GET).toHaveBeenCalledWith('/chat/info/{chatId}', { params: { path: { chatId: '123@lid' } } });
    expect(result.resource).toMatchObject({ id: chat.conversationId, conversationId: chat.conversationId });
  });

  it('does not collapse non-direct chats through canonical direct fields', async () => {
    const group = { ...chat, chatId: '120363000@g.us', conversationId: 'must-not-replace-group-id', type: 'group', addressingJid: undefined };
    const GET = vi.fn().mockResolvedValue(ok({ message: 'success', data: [group], meta: { total: 1 } }));
    const result = await listChats({ GET } as unknown as ApiClient, { canonicalChatIdentity: true });
    expect(result.resource.items[0]).toMatchObject({ id: group.chatId, conversationId: undefined, type: 'group' });
  });

  it('never groups rows by repeated display name in the browser adapter', async () => {
    const second = { ...chat, chatId: '200@s.whatsapp.net', conversationId: '71e75e2c-77a8-48f0-9fc8-99bc3e5c9694', contactId: 'contact-2' };
    const GET = vi.fn().mockResolvedValue(ok({ message: 'success', data: [chat, second], meta: { total: 2 } }));
    const result = await listChats({ GET } as unknown as ApiClient, { canonicalChatIdentity: true });
    expect(result.resource.items.map((item) => item.id)).toEqual([chat.conversationId, second.conversationId]);
    expect(result.resource.total).toBe(2);
  });

  it('uses safe defaults and excludes unknown storage/provider fields', async () => {
    const GET = vi.fn().mockResolvedValue(ok({
      message: 'success',
      data: { displayName: 'Unknown chat', type: 'provider-new-type', unreadCount: -2, SourceEventKey: 'secret' },
      meta: { source: 'projection', syncStatus: 'ready' },
    }));

    const result = await getChat({ GET } as unknown as ApiClient, 'fallback-chat');

    expect(result.resource).toEqual(expect.objectContaining({ id: 'fallback-chat', type: 'unknown', unreadCount: 0 }));
    expect(result.resource).not.toHaveProperty('SourceEventKey');
  });

  it('drops malformed list rows without a stable chat identity', async () => {
    const GET = vi.fn().mockResolvedValue(ok({ message: 'success', data: [{ displayName: 'Malformed' }, chat], meta: { syncStatus: 'ready' } }));
    const result = await listChats({ GET } as unknown as ApiClient);
    expect(result.resource.items.map((item) => item.id)).toEqual([chat.chatId]);
  });
});
