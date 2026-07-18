import { useQuery } from '@tanstack/react-query';
import { useRef } from 'react';
import { useApi } from '@/api/ApiProvider';
import type { PublicData } from '@/api/envelopes';
import type { components } from '@/api/generated/schema';
import { queryKeys } from '@/api/keys';
import { useRealtimeRefetchInterval } from '@/api/RealtimeProvider';
import {
  getDashboardSummary,
  getHealth,
  getHealthReadiness,
  getMediaMetrics,
  getMessageMetrics,
  getQueueMetrics,
  getWebhookMetrics,
  listActionRequiredItems,
  type ReadResult,
} from '@/api/overview';

export type { ReadResult };

export type HealthResource = components['schemas']['HealthResource'];
export type MetricsResource = components['schemas']['MetricsResource'];
export type DashboardResource = components['schemas']['DashboardResource'];
export type ActionRequiredItem = Extract<PublicData, { resourceType: 'health' }>;

type ReadQueryState = {
  data: unknown;
  error: unknown;
  isError: boolean;
  isFetching: boolean;
  isLoading: boolean;
};

/** Keep a settled failure visible while TanStack Query performs a background refetch. */
export function useStableReadState(query: ReadQueryState) {
  const lastError = useRef<unknown>();

  if (query.isError) {
    lastError.current = query.error;
  } else if (!query.isFetching && query.data !== undefined) {
    lastError.current = undefined;
  }

  const error = query.isError
    ? query.error
    : query.isFetching
      ? lastError.current
      : undefined;

  return {
    error,
    isError: error !== undefined,
    isInitialLoading: query.isLoading && error === undefined,
  };
}

export function isTransportFailure(error: unknown): boolean {
  if (error instanceof TypeError) return true;
  return error instanceof Error && /failed to fetch|load failed|networkerror/i.test(error.message);
}

export function useHealth() {
  const client = useApi();
  const refetchInterval = useRealtimeRefetchInterval();
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: () => getHealth(client),
    refetchInterval,
  });
}

export function useHealthReadiness() {
  const client = useApi();
  const refetchInterval = useRealtimeRefetchInterval();
  return useQuery({
    queryKey: queryKeys.healthReadiness,
    queryFn: () => getHealthReadiness(client),
    refetchInterval,
  });
}

export function useDashboardSummary() {
  const client = useApi();
  const refetchInterval = useRealtimeRefetchInterval();
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: () => getDashboardSummary(client),
    refetchInterval,
  });
}

export function useQueueMetrics() {
  const client = useApi();
  const refetchInterval = useRealtimeRefetchInterval();
  return useQuery({
    queryKey: queryKeys.queueMetrics,
    queryFn: () => getQueueMetrics(client),
    refetchInterval,
  });
}

export function useMessageMetrics() {
  const client = useApi();
  const refetchInterval = useRealtimeRefetchInterval();
  return useQuery({
    queryKey: queryKeys.messageMetrics,
    queryFn: () => getMessageMetrics(client),
    refetchInterval,
  });
}

export function useWebhookMetrics() {
  const client = useApi();
  const refetchInterval = useRealtimeRefetchInterval();
  return useQuery({
    queryKey: queryKeys.webhookMetrics,
    queryFn: () => getWebhookMetrics(client),
    refetchInterval,
  });
}

export function useMediaMetrics() {
  const client = useApi();
  const refetchInterval = useRealtimeRefetchInterval();
  return useQuery({
    queryKey: queryKeys.mediaMetrics,
    queryFn: () => getMediaMetrics(client),
    refetchInterval,
  });
}

export function useActionRequiredItems() {
  const client = useApi();
  const refetchInterval = useRealtimeRefetchInterval();
  return useQuery({
    queryKey: queryKeys.actionRequired,
    queryFn: () => listActionRequiredItems(client),
    refetchInterval,
  });
}
