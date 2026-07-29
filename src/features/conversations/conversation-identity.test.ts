import { describe, expect, it } from 'vitest';
import type { ChatResource } from '@/api/chats';
import { canonicalConversationRedirect, resolveConversationRecipient } from './conversation-identity';

const direct: ChatResource = {
  resourceType: 'chat', id: 'conversation-1', conversationId: 'conversation-1', contactId: 'contact-1',
  chatAliases: ['100@s.whatsapp.net', '123@lid'], addressingJid: '123@lid', type: 'direct', unreadCount: 0,
};

describe('canonical conversation identity policy', () => {
  it('uses only the backend-selected direct-chat command target in canonical chat mode', () => {
    expect(resolveConversationRecipient(direct, true, true, 'contact-fallback@s.whatsapp.net')).toBe('123@lid');
    expect(resolveConversationRecipient({ ...direct, addressingJid: undefined }, true, true, 'contact-fallback@s.whatsapp.net')).toBeUndefined();
  });

  it('preserves canonical-contact and provider-chat compatibility modes', () => {
    expect(resolveConversationRecipient(direct, false, true, '100@s.whatsapp.net')).toBe('100@s.whatsapp.net');
    expect(resolveConversationRecipient(direct, false, false, undefined)).toBe('conversation-1');
    expect(resolveConversationRecipient({ ...direct, id: '120363000@g.us', type: 'group' }, true, true, undefined)).toBe('120363000@g.us');
  });

  it('normalizes absorbed deep links only when canonical chat capability is active', () => {
    expect(canonicalConversationRedirect('123@lid', direct, true)).toBe('conversation-1');
    expect(canonicalConversationRedirect('123@lid', direct, false)).toBeUndefined();
    expect(canonicalConversationRedirect('conversation-1', direct, true)).toBeUndefined();
  });
});
