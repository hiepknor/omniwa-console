import { describe, expect, it, vi } from 'vitest';
import type { ApiClient } from './client';
import { getMessage, listMessageReceipts, listMessages, sendMediaMessage, sendTextMessage } from './messages';

function ok(data: unknown) {
  return { data, response: new Response(null, { status: 200 }) };
}

const message = {
  messageId: 'message-1',
  conversationId: '4c2a5707-95f6-4565-87db-20d983bbd555',
  providerChatId: '100@s.whatsapp.net',
  senderJid: '100@s.whatsapp.net',
  direction: 'incoming',
  messageType: 'text',
  contentText: 'Hello',
  contentSummary: 'Hello',
  mediaAssetId: 'asset-1',
  providerTimestamp: '2026-07-22T08:00:00Z',
  provenance: 'history_sync',
  status: 'delivered',
};

describe('messages projection adapter', () => {
  it('normalizes canonical-conversation history and preserves its opaque cursor', async () => {
    const GET = vi.fn().mockResolvedValue(ok({ message: 'success', data: [message], meta: { source: 'projection', syncStatus: 'stale', nextCursor: 'opaque/older' } }));
    const result = await listMessages({ GET } as unknown as ApiClient, message.conversationId, { cursor: 'opaque/current', limit: 25 });
    expect(GET).toHaveBeenCalledWith('/conversations/{conversationRef}/messages', { params: { path: { conversationRef: message.conversationId }, query: { cursor: 'opaque/current', limit: 25 } } });
    expect(result.resource.items).toEqual([expect.objectContaining({ resourceType: 'message', id: 'message-1', conversationId: message.conversationId, providerChatId: message.providerChatId, contentText: 'Hello', mediaAssetId: 'asset-1', provenance: 'history_sync' })]);
    expect(result.resource.pagination.nextCursor).toBe('opaque/older');
    expect(result.meta?.syncStatus).toBe('stale');
  });

  it('uses the conversation-scoped canonical message detail endpoint', async () => {
    const GET = vi.fn().mockResolvedValue(ok({ message: 'success', data: message }));
    const result = await getMessage({ GET } as unknown as ApiClient, message.conversationId, message.messageId);
    expect(GET).toHaveBeenCalledWith('/conversations/{conversationRef}/messages/{messageId}', { params: { path: { conversationRef: message.conversationId, messageId: message.messageId } } });
    expect(result.resource).toMatchObject({ conversationId: message.conversationId, providerChatId: message.providerChatId });
    expect(result.resource).not.toHaveProperty('chatId');
  });

  it('does not use the requested ref as a fallback message identity', async () => {
    const GET = vi.fn().mockResolvedValue(ok({ message: 'success', data: { ...message, messageId: undefined, direction: 'future', provenance: 'future', SourceEventKey: 'secret' }, meta: { syncStatus: 'ready' } }));
    await expect(getMessage({ GET } as unknown as ApiClient, message.conversationId, 'fallback-message')).rejects.toMatchObject({ code: 'invalid_response' });
  });

  it('fails closed when canonical message detail omits its required conversationId', async () => {
    const GET = vi.fn().mockResolvedValue(ok({ message: 'success', data: { ...message, conversationId: undefined } }));
    await expect(getMessage({ GET } as unknown as ApiClient, message.conversationId, message.messageId)).rejects.toMatchObject({ code: 'invalid_response' });
  });

  it.each([
    ['messageId', { messageId: undefined }],
    ['conversationId', { conversationId: undefined, providerChatId: 'provider-fallback' }],
    ['providerTimestamp', { providerTimestamp: undefined, sentAt: '2026-07-22T08:05:00Z' }],
  ])('fails the whole Message list when a row has an invalid required %s', async (_field, replacement) => {
    const GET = vi.fn().mockResolvedValue(ok({
      message: 'success',
      data: [message, { ...message, ...replacement }],
      meta: { syncStatus: 'ready' },
    }));

    await expect(listMessages({ GET } as unknown as ApiClient, message.conversationId)).rejects.toMatchObject({ code: 'invalid_response' });
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
    const result = await sendTextMessage({ POST } as unknown as ApiClient, '123@lid', 'Hi');
    expect(POST).toHaveBeenCalledWith('/send/text', { body: { number: '123@lid', text: 'Hi' } });
    expect(result.disposition).toBe('completed');
    expect(result.data).toEqual({ messageId: 'message-2', acknowledgedAt: '2026-07-22T08:02:00Z' });
    expect(result.data).not.toHaveProperty('Message');
  });

  it('maps a URL media send and quarantines provider-native response fields', async () => {
    const POST = vi.fn().mockResolvedValue(ok({ message: 'success', data: {
      ID: 'message-3',
      Timestamp: '2026-07-22T08:03:00Z',
      Message: { imageMessage: { url: 'provider-private' } },
    } }));
    const result = await sendMediaMessage({ POST } as unknown as ApiClient, '123@lid', {
      source: 'url',
      url: 'https://example.com/photo.jpg',
      mediaType: 'image',
      caption: 'Launch photo',
      filename: 'photo.jpg',
    });
    expect(POST).toHaveBeenCalledWith('/send/media', { body: {
      number: '123@lid',
      url: 'https://example.com/photo.jpg',
      type: 'image',
      caption: 'Launch photo',
      filename: 'photo.jpg',
    } });
    expect(result.disposition).toBe('completed');
    expect(result.data).toEqual({ messageId: 'message-3', acknowledgedAt: '2026-07-22T08:03:00Z' });
    expect(result.data).not.toHaveProperty('Message');
  });

  it('sends a managed image asset without URL, base64, or file fields', async () => {
    const POST = vi.fn().mockResolvedValue(ok({ message: 'success', data: {
      messageId: 'message-4', timestamp: '2026-07-22T08:04:00Z',
    } }));
    const result = await sendMediaMessage({ POST } as unknown as ApiClient, '200@s.whatsapp.net', {
      source: 'asset', mediaAssetId: 'asset-1', caption: 'Private image',
    });
    expect(POST).toHaveBeenCalledWith('/send/media', { body: {
      number: '200@s.whatsapp.net', type: 'image', mediaAssetId: 'asset-1', caption: 'Private image',
    } });
    expect(result.data).toEqual({ messageId: 'message-4', acknowledgedAt: '2026-07-22T08:04:00Z' });
  });

  it('requires the authoritative provider timestamp instead of falling back to lifecycle timestamps', async () => {
    const GET = vi.fn().mockResolvedValue(ok({
      message: 'success',
      data: { ...message, providerTimestamp: undefined, sentAt: '2026-07-22T08:05:00Z', deliveredAt: '2026-07-22T08:06:00Z' },
    }));
    await expect(getMessage({ GET } as unknown as ApiClient, message.conversationId, 'message-1')).rejects.toMatchObject({ code: 'invalid_response' });
  });
});
