import type { ChatResource } from '@/api/chats';

export function resolveConversationRecipient(
  chat: ChatResource | undefined,
  canonicalChatIdentity: boolean,
  canonicalContactIdentity: boolean,
  contactAddressingJid: string | undefined,
): string | undefined {
  if (!chat) return undefined;
  if (chat.type !== 'direct') return chat.id;
  if (canonicalChatIdentity) return chat.addressingJid;
  if (canonicalContactIdentity && chat.contactId) return contactAddressingJid;
  return chat.id;
}

export function canonicalConversationRedirect(
  requestedChatId: string | undefined,
  returnedChat: ChatResource | undefined,
  canonicalChatIdentity: boolean,
): string | undefined {
  if (!canonicalChatIdentity || !requestedChatId || !returnedChat?.id || returnedChat.id === requestedChatId) return undefined;
  return returnedChat.id;
}
