import { describe, expect, it, vi } from 'vitest';
import type { ApiClient } from './client';
import { getChat, listChats } from './chats';

function ok(data: unknown) {
  return { data, response: new Response(null, { status: 200 }) };
}

const chat = {
  chatId: '100@s.whatsapp.net',
  contactId: 'contact-1',
  type: 'direct',
  displayName: 'Ada',
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
      meta: { source: 'projection', syncStatus: 'stale', nextCursor: 'opaque/next' },
    }));

    const result = await listChats({ GET } as unknown as ApiClient, { cursor: 'opaque/current', limit: 25 });

    expect(GET).toHaveBeenCalledWith('/chat/list', { params: { query: { cursor: 'opaque/current', limit: 25 } } });
    expect(result.resource.items).toEqual([expect.objectContaining({
      resourceType: 'chat', id: chat.chatId, type: 'direct', unreadCount: 2,
    })]);
    expect(result.resource.pagination).toEqual({ nextCursor: 'opaque/next', hasMore: true });
    expect(result.meta?.syncStatus).toBe('stale');
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
