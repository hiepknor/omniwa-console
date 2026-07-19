import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/api/ApiProvider';
import type { CommandResult } from '@/api/envelopes';
import { opsKeys, queryKeys } from '@/api/keys';
import { useRealtimeRefetchInterval } from '@/api/RealtimeProvider';
import {
  activateWebhook,
  bulkRedriveWebhookDeliveries,
  getWebhook,
  getWebhookDeliveryHistory,
  listWebhookDeliveries,
  listWebhooks,
  redriveWebhookDelivery,
  registerWebhook,
  retireWebhook,
  retryWebhookDelivery,
  suspendWebhook,
  updateWebhook,
  type WebhookRequest,
} from '@/api/webhooks';

export function useWebhooks(initialCursor?: string) {
  const client = useApi();
  const refetchInterval = useRealtimeRefetchInterval();
  return useInfiniteQuery({
    queryKey: queryKeys.webhooks({ initialCursor }),
    queryFn: ({ pageParam }) => listWebhooks(client, { cursor: pageParam, limit: 50 }),
    initialPageParam: initialCursor,
    getNextPageParam: (lastPage) => lastPage.resource?.pagination?.nextCursor,
    refetchInterval,
  });
}

export function useWebhook(webhookId: string | undefined) {
  const client = useApi();
  const refetchInterval = useRealtimeRefetchInterval();
  return useQuery({
    queryKey: queryKeys.webhook(webhookId ?? ''),
    queryFn: () => getWebhook(client, webhookId ?? ''),
    enabled: webhookId !== undefined,
    refetchInterval,
  });
}

export function useWebhookDeliveries() {
  const client = useApi();
  const refetchInterval = useRealtimeRefetchInterval();
  return useInfiniteQuery({
    queryKey: queryKeys.webhookDeliveries({}),
    queryFn: ({ pageParam }) => listWebhookDeliveries(client, { cursor: pageParam, limit: 50 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.resource?.pagination?.nextCursor,
    refetchInterval,
  });
}

export function useWebhookDeliveryHistory(deliveryId: string | undefined) {
  const client = useApi();
  const refetchInterval = useRealtimeRefetchInterval();
  return useQuery({
    queryKey: queryKeys.webhookDeliveryHistory(deliveryId ?? ''),
    queryFn: () => getWebhookDeliveryHistory(client, deliveryId ?? ''),
    enabled: deliveryId !== undefined,
    refetchInterval,
  });
}

function useInvalidateWebhooks() {
  const queryClient = useQueryClient();
  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: opsKeys.webhooks }),
      queryClient.invalidateQueries({ queryKey: opsKeys.webhookDeliveries }),
    ]);
  };
}

export function useRegisterWebhook() {
  const client = useApi();
  const invalidate = useInvalidateWebhooks();
  return useMutation({ mutationFn: (body: WebhookRequest) => registerWebhook(client, body), onSuccess: invalidate });
}

export function useUpdateWebhook(webhookId: string) {
  const client = useApi();
  const invalidate = useInvalidateWebhooks();
  return useMutation({ mutationFn: (body: Partial<WebhookRequest>) => updateWebhook(client, webhookId, body), onSuccess: invalidate });
}

function useWebhookCommand(command: (client: ReturnType<typeof useApi>, webhookId: string) => Promise<CommandResult>, webhookId: string) {
  const client = useApi();
  const invalidate = useInvalidateWebhooks();
  return useMutation({ mutationFn: () => command(client, webhookId), onSuccess: invalidate });
}

export function useActivateWebhook(webhookId: string) { return useWebhookCommand(activateWebhook, webhookId); }
export function useSuspendWebhook(webhookId: string) { return useWebhookCommand(suspendWebhook, webhookId); }
export function useRetireWebhook(webhookId: string) { return useWebhookCommand(retireWebhook, webhookId); }

export function useRetryDelivery() {
  const client = useApi();
  const invalidate = useInvalidateWebhooks();
  return useMutation({ mutationFn: (deliveryId: string) => retryWebhookDelivery(client, deliveryId), onSuccess: invalidate });
}

export function useRedriveDelivery() {
  const client = useApi();
  const invalidate = useInvalidateWebhooks();
  return useMutation({ mutationFn: (deliveryId: string) => redriveWebhookDelivery(client, deliveryId), onSuccess: invalidate });
}

export function useBulkRedrive() {
  const client = useApi();
  const invalidate = useInvalidateWebhooks();
  return useMutation({ mutationFn: (deliveryIds: string[]) => bulkRedriveWebhookDeliveries(client, deliveryIds), onSuccess: invalidate });
}
