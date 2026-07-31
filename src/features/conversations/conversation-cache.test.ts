import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import type { ConversationReadResult, ConversationResource } from '@/api/conversations';
import { queryKeys, SESSION_QUERY_SCOPE } from '@/api/keys';
import { cacheCanonicalConversation, removeResolvedConversationRef } from './hooks';

const canonicalId = '4c2a5707-95f6-4565-87db-20d983bbd555';
const alias = '731002@lid';
const result: ConversationReadResult<ConversationResource> = {
  resource: {
    resourceType: 'conversation',
    conversationId: canonicalId,
    aliases: ['15551230001@s.whatsapp.net', alias],
    aliasesReported: true,
    addressingJid: alias,
    type: 'direct',
    unreadCount: 3,
    unreadAuthoritative: true,
  },
  meta: { syncStatus: 'ready' },
};

describe('canonical Conversation cache normalization', () => {
  it('moves an alias detail response to the canonical entity key and removes the alias entry', () => {
    const queryClient = new QueryClient();
    const aliasKey = queryKeys.conversation(SESSION_QUERY_SCOPE, alias);
    const canonicalKey = queryKeys.conversation(SESSION_QUERY_SCOPE, canonicalId);
    queryClient.setQueryData(aliasKey, result);

    cacheCanonicalConversation(queryClient, result);
    removeResolvedConversationRef(queryClient, alias);

    expect(queryClient.getQueryData(aliasKey)).toBeUndefined();
    expect(queryClient.getQueryData(canonicalKey)).toBe(result);
    expect(canonicalKey).not.toContain(result.resource.addressingJid);
  });

  it('scopes Message pages only to canonical conversationId', () => {
    const key = queryKeys.conversationMessages(SESSION_QUERY_SCOPE, result.resource.conversationId, { cursor: 'opaque' });
    expect(key).toContain(canonicalId);
    expect(key).not.toContain(alias);
    expect(key).not.toContain(result.resource.addressingJid);
  });
});
