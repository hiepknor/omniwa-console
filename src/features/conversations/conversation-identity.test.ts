import { describe, expect, it } from 'vitest';
import type { ConversationResource } from '@/api/conversations';
import { canonicalConversationLocation, canonicalConversationReadsEnabled, canonicalConversationRedirect, resolveConversationRecipient } from './conversation-identity';

const direct: ConversationResource = {
  resourceType: 'conversation', conversationId: 'conversation-1', contactId: 'contact-1',
  aliases: ['100@s.whatsapp.net', '123@lid'], aliasesReported: true, addressingJid: '123@lid', type: 'direct', unreadCount: 0, unreadAuthoritative: true,
};

describe('canonical conversation identity policy', () => {
  it('enables reads only for instance scope with canonical_conversation_identity', () => {
    expect(canonicalConversationReadsEnabled(true, ['canonical_conversation_identity'])).toBe(true);
    expect(canonicalConversationReadsEnabled(true, ['canonical_conversation_identity', 'authoritative_conversation_unread'])).toBe(true);
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

  it.each([
    ['direct', 'direct-address@s.whatsapp.net'],
    ['group', 'group-address@g.us'],
    ['newsletter', 'channel-address@newsletter'],
    ['broadcast', 'list-address@broadcast'],
  ] as const)('keeps %s entity identity distinct from its explicit provider command target', (type, addressingJid) => {
    const conversation = { ...direct, type, conversationId: `${type}-conversation-id`, addressingJid };
    expect(resolveConversationRecipient(conversation)).toBe(addressingJid);
    expect(conversation.conversationId).not.toBe(addressingJid);
  });

  it('normalizes absorbed deep links to the returned canonical conversation ID', () => {
    expect(canonicalConversationRedirect('123@lid', direct)).toBe('conversation-1');
    expect(canonicalConversationRedirect('conversation-1', direct)).toBeUndefined();
  });

  it('preserves opaque URL state through canonical replacement and is stable after refresh', () => {
    const state = new URLSearchParams('cursor=opaque%3Apage&messageCursor=opaque%3Ahistory&details=conversation');
    expect(canonicalConversationLocation('123@lid', direct, state)).toBe('/conversations/conversation-1?cursor=opaque%3Apage&messageCursor=opaque%3Ahistory&details=conversation');
    expect(canonicalConversationLocation('conversation-1', direct, state)).toBeUndefined();
  });
});
