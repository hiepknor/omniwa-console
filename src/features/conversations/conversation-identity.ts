import type { ConversationResource } from '@/api/conversations';
import { withSearchParams } from '@/lib/url-search-state';

export function canonicalConversationReadsEnabled(instanceScope: boolean, capabilities: readonly string[]): boolean {
  return instanceScope && capabilities.includes('canonical_conversation_identity');
}

export function resolveConversationRecipient(
  conversation: ConversationResource | undefined,
): string | undefined {
  return conversation?.addressingJid;
}

export function canonicalConversationRedirect(
  requestedConversationRef: string | undefined,
  returnedConversation: ConversationResource | undefined,
): string | undefined {
  if (!requestedConversationRef || !returnedConversation?.conversationId || returnedConversation.conversationId === requestedConversationRef) return undefined;
  return returnedConversation.conversationId;
}

export function canonicalConversationLocation(
  requestedConversationRef: string | undefined,
  returnedConversation: ConversationResource | undefined,
  searchParams: URLSearchParams,
): string | undefined {
  const canonicalId = canonicalConversationRedirect(requestedConversationRef, returnedConversation);
  return canonicalId
    ? withSearchParams(`/conversations/${encodeURIComponent(canonicalId)}`, searchParams)
    : undefined;
}
