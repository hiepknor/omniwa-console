import { useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useApi } from '@/api/ApiProvider';
import { getConversation, listConversations, type ConversationReadResult, type ConversationResource } from '@/api/conversations';
import { getMediaAsset, getMediaAssetContent, uploadMediaAsset } from '@/api/media-assets';
import { queryKeys, SESSION_QUERY_SCOPE } from '@/api/keys';
import { getMessage, listMessageReceipts, listMessages, sendMediaMessage, sendTextMessage, type SendMediaInput } from '@/api/messages';
import { ApiFailure } from '@/api/envelopes';
import { MEDIA_ASSET_READ_POLICY, mediaAssetPollingInterval, pollingWhen, PROJECTION_READ_POLICY, QUERY_INTERVALS } from '@/lib/query-policy';

export function useConversations(cursor: string | undefined, enabled: boolean) {
  const client = useApi();
  const params = { cursor };
  return useQuery({ queryKey: queryKeys.instanceConversations(SESSION_QUERY_SCOPE, params), queryFn: () => listConversations(client, { ...params, limit: 50 }), enabled, staleTime: PROJECTION_READ_POLICY.staleTime, refetchInterval: pollingWhen(enabled, QUERY_INTERVALS.projection) });
}

export function cacheCanonicalConversation(
  queryClient: QueryClient,
  result: ConversationReadResult<ConversationResource>,
) {
  queryClient.setQueryData(
    queryKeys.conversation(SESSION_QUERY_SCOPE, result.resource.conversationId),
    result,
  );
}

export function removeResolvedConversationRef(queryClient: QueryClient, conversationRef: string) {
  queryClient.removeQueries({
    queryKey: queryKeys.conversation(SESSION_QUERY_SCOPE, conversationRef),
    exact: true,
  });
}

export function useConversation(conversationRef: string | undefined, enabled: boolean) {
  const client = useApi();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: queryKeys.conversation(SESSION_QUERY_SCOPE, conversationRef ?? ''), queryFn: () => getConversation(client, conversationRef ?? ''), enabled: enabled && Boolean(conversationRef), staleTime: PROJECTION_READ_POLICY.staleTime, refetchInterval: pollingWhen(enabled && Boolean(conversationRef), QUERY_INTERVALS.projection) });
  const canonicalConversationId = query.data?.resource.conversationId;

  useEffect(() => {
    if (!conversationRef || !query.data || !canonicalConversationId || canonicalConversationId === conversationRef) return;
    cacheCanonicalConversation(queryClient, query.data);
    return () => removeResolvedConversationRef(queryClient, conversationRef);
  }, [canonicalConversationId, conversationRef, query.data, queryClient]);

  return query;
}

export function useMessages(conversationId: string | undefined, cursor: string | undefined, enabled: boolean) {
  const client = useApi();
  const params = { cursor };
  return useQuery({ queryKey: queryKeys.conversationMessages(SESSION_QUERY_SCOPE, conversationId ?? '', params), queryFn: () => listMessages(client, conversationId ?? '', { ...params, limit: 100 }), enabled: enabled && Boolean(conversationId), staleTime: PROJECTION_READ_POLICY.staleTime, refetchInterval: pollingWhen(enabled && Boolean(conversationId), QUERY_INTERVALS.projection) });
}

export function useMessage(conversationId: string | undefined, messageId: string | undefined, enabled: boolean) {
  const client = useApi();
  return useQuery({ queryKey: queryKeys.conversationMessage(SESSION_QUERY_SCOPE, conversationId ?? '', messageId ?? ''), queryFn: () => getMessage(client, conversationId ?? '', messageId ?? ''), enabled: enabled && Boolean(conversationId) && Boolean(messageId), staleTime: PROJECTION_READ_POLICY.staleTime });
}

export function useReceipts(conversationId: string | undefined, messageId: string | undefined, enabled: boolean) {
  const client = useApi();
  return useQuery({ queryKey: queryKeys.messageDeliveryHistory(SESSION_QUERY_SCOPE, conversationId ?? '', messageId ?? ''), queryFn: () => listMessageReceipts(client, messageId ?? ''), enabled: enabled && Boolean(conversationId) && Boolean(messageId), staleTime: PROJECTION_READ_POLICY.staleTime });
}

export function useSendText(conversationId: string, addressingJid: string) {
  const client = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (text: string) => sendTextMessage(client, addressingJid, text),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.instanceConversations(SESSION_QUERY_SCOPE) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.conversationMessages(SESSION_QUERY_SCOPE, conversationId) }),
      ]);
    },
  });
}

export function useSendMedia(conversationId: string, addressingJid: string) {
  const client = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SendMediaInput) => sendMediaMessage(client, addressingJid, input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.instanceConversations(SESSION_QUERY_SCOPE) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.conversationMessages(SESSION_QUERY_SCOPE, conversationId) }),
      ]);
    },
  });
}

export function useUploadConversationImage() {
  const client = useApi();
  const key = useRef<{ signature: string; value: string }>();
  return useMutation({
    mutationFn: (file: File) => {
      const signature = `${file.name}:${file.size}:${file.type}:${file.lastModified}`;
      if (key.current?.signature !== signature) key.current = { signature, value: crypto.randomUUID() };
      return uploadMediaAsset(client, file, key.current.value);
    },
    onSuccess: () => { key.current = undefined; },
  });
}

export function useConversationMediaAsset(mediaId: string | undefined, enabled: boolean) {
  const client = useApi();
  return useQuery({
    queryKey: queryKeys.mediaAsset(SESSION_QUERY_SCOPE, mediaId ?? ''),
    queryFn: () => getMediaAsset(client, mediaId!),
    enabled: enabled && Boolean(mediaId),
    staleTime: MEDIA_ASSET_READ_POLICY.staleTime,
    refetchInterval: (query) => mediaAssetPollingInterval(query.state.data?.status, query.state.dataUpdateCount),
  });
}

export function useConversationMediaContent(mediaId: string | undefined, enabled: boolean) {
  const client = useApi();
  return useQuery({
    queryKey: queryKeys.mediaAssetContent(SESSION_QUERY_SCOPE, mediaId ?? ''),
    queryFn: () => getMediaAssetContent(client, mediaId!),
    enabled: enabled && Boolean(mediaId),
    staleTime: MEDIA_ASSET_READ_POLICY.terminalStaleTime,
    gcTime: 60_000,
    retry: (failureCount, error) => error instanceof ApiFailure && error.code === 'media_asset_not_ready' && failureCount < 3,
    retryDelay: (attempt) => Math.min(2_000 * (2 ** attempt), 8_000),
  });
}
