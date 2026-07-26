import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/api/ApiProvider';
import { getChat, listChats } from '@/api/chats';
import { getContact, listContacts } from '@/api/contacts';
import { getLabel, listLabels } from '@/api/labels';
import { queryKeys, SESSION_QUERY_SCOPE } from '@/api/keys';
import { getMessage, listMessageReceipts, listMessages, sendMediaMessage, sendTextMessage, type SendMediaInput } from '@/api/messages';
import { pollingWhen, PROJECTION_READ_POLICY, QUERY_INTERVALS } from '@/lib/query-policy';

export function useChats(cursor: string | undefined, enabled: boolean) {
  const client = useApi();
  return useQuery({ queryKey: queryKeys.instanceChats(SESSION_QUERY_SCOPE, { cursor }), queryFn: () => listChats(client, { cursor, limit: 50 }), enabled, staleTime: PROJECTION_READ_POLICY.staleTime, refetchInterval: pollingWhen(enabled, QUERY_INTERVALS.projection) });
}

export function useChat(chatId: string | undefined, enabled: boolean) {
  const client = useApi();
  return useQuery({ queryKey: queryKeys.chat(SESSION_QUERY_SCOPE, chatId ?? ''), queryFn: () => getChat(client, chatId ?? ''), enabled: enabled && Boolean(chatId), staleTime: PROJECTION_READ_POLICY.staleTime, refetchInterval: pollingWhen(enabled && Boolean(chatId), QUERY_INTERVALS.projection) });
}

export function useMessages(chatId: string | undefined, cursor: string | undefined, enabled: boolean) {
  const client = useApi();
  return useQuery({ queryKey: queryKeys.instanceMessages(SESSION_QUERY_SCOPE, chatId ?? '', { cursor }), queryFn: () => listMessages(client, chatId ?? '', { cursor, limit: 100 }), enabled: enabled && Boolean(chatId), staleTime: PROJECTION_READ_POLICY.staleTime, refetchInterval: pollingWhen(enabled && Boolean(chatId), QUERY_INTERVALS.projection) });
}

export function useMessage(messageId: string | undefined, enabled: boolean) {
  const client = useApi();
  return useQuery({ queryKey: queryKeys.message(SESSION_QUERY_SCOPE, messageId ?? ''), queryFn: () => getMessage(client, messageId ?? ''), enabled: enabled && Boolean(messageId), staleTime: PROJECTION_READ_POLICY.staleTime });
}

export function useReceipts(messageId: string | undefined, enabled: boolean) {
  const client = useApi();
  return useQuery({ queryKey: queryKeys.messageDeliveryHistory(SESSION_QUERY_SCOPE, messageId ?? ''), queryFn: () => listMessageReceipts(client, messageId ?? ''), enabled: enabled && Boolean(messageId), staleTime: PROJECTION_READ_POLICY.staleTime });
}

export function useContacts(search: string, cursor: string | undefined, enabled: boolean) {
  const client = useApi();
  const params = { search: search || undefined, cursor, limit: 50 };
  return useQuery({ queryKey: queryKeys.instanceContacts(SESSION_QUERY_SCOPE, params), queryFn: () => listContacts(client, params), enabled, staleTime: PROJECTION_READ_POLICY.staleTime, refetchInterval: pollingWhen(enabled, QUERY_INTERVALS.projection) });
}

export function useContact(contactId: string | undefined, enabled: boolean) {
  const client = useApi();
  return useQuery({ queryKey: queryKeys.contact(SESSION_QUERY_SCOPE, contactId ?? ''), queryFn: () => getContact(client, contactId ?? ''), enabled: enabled && Boolean(contactId), staleTime: PROJECTION_READ_POLICY.staleTime });
}

export function useLabels(enabled: boolean) {
  const client = useApi();
  return useQuery({ queryKey: queryKeys.instanceLabels(SESSION_QUERY_SCOPE), queryFn: () => listLabels(client), enabled, staleTime: PROJECTION_READ_POLICY.staleTime, refetchInterval: pollingWhen(enabled, QUERY_INTERVALS.projection) });
}

export function useLabel(labelId: string | undefined, enabled: boolean) {
  const client = useApi();
  return useQuery({ queryKey: queryKeys.label(SESSION_QUERY_SCOPE, labelId ?? ''), queryFn: () => getLabel(client, labelId ?? ''), enabled: enabled && Boolean(labelId), staleTime: PROJECTION_READ_POLICY.staleTime });
}

export function useSendText(chatId: string) {
  const client = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (text: string) => sendTextMessage(client, chatId, text),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.instanceChats(SESSION_QUERY_SCOPE) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.instanceMessages(SESSION_QUERY_SCOPE, chatId) }),
      ]);
    },
  });
}

export function useSendMedia(chatId: string) {
  const client = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SendMediaInput) => sendMediaMessage(client, chatId, input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.instanceChats(SESSION_QUERY_SCOPE) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.instanceMessages(SESSION_QUERY_SCOPE, chatId) }),
      ]);
    },
  });
}
