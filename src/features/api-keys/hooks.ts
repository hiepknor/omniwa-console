import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/api/ApiProvider';
import {
  listApiKeys,
  provisionApiKey,
  revokeApiKey,
  rotateApiKey,
  type ApiKeyProvisionRequest,
  type ApiKeyRevocationRequest,
  type ApiKeyRotationRequest,
} from '@/api/api-keys';
import { queryKeys } from '@/api/keys';
import { useRealtimeRefetchInterval } from '@/api/RealtimeProvider';

export function useApiKeys() {
  const client = useApi();
  const refetchInterval = useRealtimeRefetchInterval();
  return useInfiniteQuery({
    queryKey: queryKeys.apiKeys({}),
    queryFn: ({ pageParam }) => listApiKeys(client, { cursor: pageParam, limit: 50 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.resource?.pagination?.nextCursor,
    refetchInterval,
  });
}

function useInvalidateApiKeys() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys({}) });
}

export function useProvisionApiKey() {
  const client = useApi();
  const invalidate = useInvalidateApiKeys();
  return useMutation({
    mutationFn: (body: ApiKeyProvisionRequest) => provisionApiKey(client, body),
    onSuccess: invalidate,
  });
}

export function useRotateApiKey(keyId: string) {
  const client = useApi();
  const invalidate = useInvalidateApiKeys();
  return useMutation({
    mutationFn: (body: ApiKeyRotationRequest) => rotateApiKey(client, keyId, body),
    onSuccess: invalidate,
  });
}

export function useRevokeApiKey(keyId: string) {
  const client = useApi();
  const invalidate = useInvalidateApiKeys();
  return useMutation({
    mutationFn: (body: ApiKeyRevocationRequest) => revokeApiKey(client, keyId, body),
    onSuccess: invalidate,
  });
}
