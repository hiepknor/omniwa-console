import { describe, expect, it, vi } from 'vitest';
import type { ApiClient } from './client';
import { getMessage, listMessageReceipts, listMessages, sendTextMessage } from './messages';

function ok(data: unknown) {
  return { data, response: new Response(null, { status: 200 }) };
}

const message = {
  messageId: 'message-1',
  chatId: '100@s.whatsapp.net',
  senderJid: '100@s.whatsapp.net',
  direction: 'incoming',
  messageType: 'text',
  contentText: 'Hello',
  contentSummary: 'Hello',
  providerTimestamp: '2026-07-22T08:00:00Z',
  provenance: 'history_sync',
  status: 'delivered',
};

describe('messages projection adapter', () => {
  it('normalizes chat-scoped history and preserves its opaque cursor', async () => {
    const GET = vi.fn().mockResolvedValue(ok({ message: 'success', data: [message], meta: { source: 'projection', syncStatus: 'stale', nextCursor: 'opaque/older' } }));
    const result = await listMessages({ GET } as unknown as ApiClient, message.chatId, { cursor: 'opaque/current', limit: 25 });
    expect(GET).toHaveBeenCalledWith('/chat/{chatId}/messages', { params: { path: { chatId: message.chatId }, query: { cursor: 'opaque/current', limit: 25 } } });
    expect(result.resource.items).toEqual([expect.objectContaining({ resourceType: 'message', id: 'message-1', contentText: 'Hello', provenance: 'history_sync' })]);
    expect(result.resource.pagination.nextCursor).toBe('opaque/older');
    expect(result.meta?.syncStatus).toBe('stale');
  });

  it('uses safe detail defaults without exposing unknown fields', async () => {
    const GET = vi.fn().mockResolvedValue(ok({ message: 'success', data: { ...message, messageId: undefined, direction: 'future', provenance: 'future', SourceEventKey: 'secret' }, meta: { syncStatus: 'ready' } }));
    const result = await getMessage({ GET } as unknown as ApiClient, 'fallback-message');
    expect(result.resource).toEqual(expect.objectContaining({ id: 'fallback-message', direction: 'unknown', provenance: 'unknown' }));
    expect(result.resource).not.toHaveProperty('SourceEventKey');
  });

  it('normalizes ordered receipt rows and discards malformed rows', async () => {
    const GET = vi.fn().mockResolvedValue(ok({ message: 'success', data: [
      { messageId: 'message-1', recipientJid: '200@s.whatsapp.net', receiptType: 'delivered', receiptAt: '2026-07-22T08:01:00Z' },
      { messageId: 'message-1', receiptType: 'read' },
    ], meta: { syncStatus: 'ready' } }));
    const result = await listMessageReceipts({ GET } as unknown as ApiClient, 'message-1');
    expect(result.resource).toEqual([expect.objectContaining({ resourceType: 'messageReceipt', receiptType: 'delivered' })]);
  });

  it('maps a text send to the existing command without claiming delivery', async () => {
    const POST = vi.fn().mockResolvedValue(ok({ message: 'success', data: {
      Info: { ID: 'message-2', Timestamp: '2026-07-22T08:02:00Z', Secret: 'must-not-pass' },
      Message: { conversation: 'provider-native-payload' },
    } }));
    const result = await sendTextMessage({ POST } as unknown as ApiClient, message.chatId, 'Hi');
    expect(POST).toHaveBeenCalledWith('/send/text', { body: { number: message.chatId, text: 'Hi' } });
    expect(result.disposition).toBe('completed');
    expect(result.data).toEqual({ messageId: 'message-2', acknowledgedAt: '2026-07-22T08:02:00Z' });
    expect(result.data).not.toHaveProperty('Message');
  });
});
