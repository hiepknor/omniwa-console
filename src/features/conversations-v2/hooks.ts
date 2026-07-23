import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/api/ApiProvider';
import { getChat, listChats } from '@/api/chats';
import { getContact, listContacts } from '@/api/contacts';
import { getLabel, listLabels } from '@/api/labels';
import { queryKeys } from '@/api/keys';
import { getMessage, listMessageReceipts, listMessages, sendMediaMessage, sendTextMessage, type SendMediaInput } from '@/api/messages';

const SCOPE = 'session';

export function useChatsV2(cursor: string | undefined, enabled: boolean) {
  const client = useApi();
  return useQuery({ queryKey: queryKeys.instanceChats(SCOPE, { cursor }), queryFn: () => listChats(client, { cursor, limit: 50 }), enabled, staleTime: 30_000, refetchInterval: enabled ? 60_000 : false });
}

export function useChatV2(chatId: string | undefined, enabled: boolean) {
  const client = useApi();
  return useQuery({ queryKey: queryKeys.chat(SCOPE, chatId ?? ''), queryFn: () => getChat(client, chatId ?? ''), enabled: enabled && Boolean(chatId), staleTime: 30_000, refetchInterval: enabled && chatId ? 60_000 : false });
}

export function useMessagesV2(chatId: string | undefined, cursor: string | undefined, enabled: boolean) {
  const client = useApi();
  return useQuery({ queryKey: queryKeys.instanceMessages(SCOPE, chatId ?? '', { cursor }), queryFn: () => listMessages(client, chatId ?? '', { cursor, limit: 100 }), enabled: enabled && Boolean(chatId), staleTime: 30_000, refetchInterval: enabled && chatId ? 60_000 : false });
}

export function useMessageV2(messageId: string | undefined, enabled: boolean) {
  const client = useApi();
  return useQuery({ queryKey: queryKeys.message(SCOPE, messageId ?? ''), queryFn: () => getMessage(client, messageId ?? ''), enabled: enabled && Boolean(messageId), staleTime: 30_000 });
}

export function useReceiptsV2(messageId: string | undefined, enabled: boolean) {
  const client = useApi();
  return useQuery({ queryKey: queryKeys.messageDeliveryHistory(SCOPE, messageId ?? ''), queryFn: () => listMessageReceipts(client, messageId ?? ''), enabled: enabled && Boolean(messageId), staleTime: 30_000 });
}

export function useContactsV2(search: string, cursor: string | undefined, enabled: boolean) {
  const client = useApi();
  const params = { search: search || undefined, cursor, limit: 50 };
  return useQuery({ queryKey: queryKeys.instanceContacts(SCOPE, params), queryFn: () => listContacts(client, params), enabled, staleTime: 30_000, refetchInterval: enabled ? 60_000 : false });
}

export function useContactV2(contactId: string | undefined, enabled: boolean) {
  const client = useApi();
  return useQuery({ queryKey: queryKeys.contact(SCOPE, contactId ?? ''), queryFn: () => getContact(client, contactId ?? ''), enabled: enabled && Boolean(contactId), staleTime: 30_000 });
}

export function useLabelsV2(enabled: boolean) {
  const client = useApi();
  return useQuery({ queryKey: queryKeys.instanceLabels(SCOPE), queryFn: () => listLabels(client), enabled, staleTime: 30_000, refetchInterval: enabled ? 60_000 : false });
}

export function useLabelV2(labelId: string | undefined, enabled: boolean) {
  const client = useApi();
  return useQuery({ queryKey: queryKeys.label(SCOPE, labelId ?? ''), queryFn: () => getLabel(client, labelId ?? ''), enabled: enabled && Boolean(labelId), staleTime: 30_000 });
}

export function useSendTextV2(chatId: string) {
  const client = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (text: string) => sendTextMessage(client, chatId, text),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.instanceChats(SCOPE) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.instanceMessages(SCOPE, chatId) }),
      ]);
    },
  });
}

export function useSendMediaV2(chatId: string) {
  const client = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SendMediaInput) => sendMediaMessage(client, chatId, input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.instanceChats(SCOPE) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.instanceMessages(SCOPE, chatId) }),
      ]);
    },
  });
}
