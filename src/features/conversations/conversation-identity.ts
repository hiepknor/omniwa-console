import type { ConversationResource } from '@/api/conversations';

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
