import { describe, expect, it } from 'vitest';
import type { ConversationResource } from '@/api/conversations';
import { canonicalConversationReadsEnabled, canonicalConversationRedirect, resolveConversationRecipient } from './conversation-identity';

const direct: ConversationResource = {
  resourceType: 'conversation', conversationId: 'conversation-1', contactId: 'contact-1',
  aliases: ['100@s.whatsapp.net', '123@lid'], addressingJid: '123@lid', type: 'direct', unreadCount: 0,
};

describe('canonical conversation identity policy', () => {
  it('enables reads only for instance scope with canonical_conversation_identity', () => {
    expect(canonicalConversationReadsEnabled(true, ['canonical_conversation_identity'])).toBe(true);
    expect(canonicalConversationReadsEnabled(true, ['canonical_chat_identity', 'chats_projection'])).toBe(false);
    expect(canonicalConversationReadsEnabled(false, ['canonical_conversation_identity'])).toBe(false);
  });

  it('uses only the backend-selected provider command target', () => {
    expect(resolveConversationRecipient(direct)).toBe('123@lid');
    expect(resolveConversationRecipient({ ...direct, addressingJid: undefined })).toBeUndefined();
  });

  it('never falls back to the canonical UUID or a provider alias', () => {
    expect(resolveConversationRecipient({ ...direct, addressingJid: undefined, aliases: ['100@s.whatsapp.net'] })).toBeUndefined();
  });

  it('normalizes absorbed deep links to the returned canonical conversation ID', () => {
    expect(canonicalConversationRedirect('123@lid', direct)).toBe('conversation-1');
    expect(canonicalConversationRedirect('conversation-1', direct)).toBeUndefined();
  });
});
