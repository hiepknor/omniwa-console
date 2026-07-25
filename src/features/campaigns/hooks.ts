import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useApi } from "@/api/ApiProvider";
import {
  createCampaign,
  getCampaign,
  listCampaignAudit,
  listCampaignRecipients,
  listCampaigns,
  transitionCampaign,
  type CampaignRecipientConsent,
  type CampaignStatus,
} from "@/api/campaigns";
import { listInstances } from "@/api/instances";
import { queryKeys } from "@/api/keys";
import { useInstanceClient } from "@/api/useInstanceClient";
import { useServerCapability } from "@/api/CapabilitiesProvider";

export function useCampaignInstances() {
  const client = useApi();
  const metadata = useServerCapability("instance_metadata_views");
  return useQuery({
    queryKey: queryKeys.instances({ metadata }),
    queryFn: () => listInstances(client, { limit: 50, metadata }),
    staleTime: 30_000,
  });
}
export function useCampaigns(
  instanceId: string | undefined,
  token: string | undefined,
  status: CampaignStatus | undefined,
  enabled: boolean,
) {
  const client = useInstanceClient(token);
  return useInfiniteQuery({
    queryKey: queryKeys.instanceCampaigns(instanceId ?? "", { status }),
    queryFn: ({ pageParam }) =>
      listCampaigns(client!, { status, cursor: pageParam, limit: 50 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    enabled: enabled && !!instanceId && !!client,
    refetchInterval: 30_000,
  });
}
export function useCampaign(
  instanceId: string | undefined,
  token: string | undefined,
  campaignId: string | undefined,
  enabled: boolean,
) {
  const client = useInstanceClient(token);
  return useQuery({
    queryKey: queryKeys.campaign(instanceId ?? "", campaignId ?? ""),
    queryFn: () => getCampaign(client!, campaignId!),
    enabled: enabled && !!instanceId && !!campaignId && !!client,
    refetchInterval: 15_000,
  });
}
export function useCampaignRecipients(
  instanceId: string | undefined,
  token: string | undefined,
  campaignId: string | undefined,
  enabled: boolean,
) {
  const client = useInstanceClient(token);
  return useInfiniteQuery({
    queryKey: queryKeys.campaignRecipients(instanceId ?? "", campaignId ?? ""),
    queryFn: ({ pageParam }) =>
      listCampaignRecipients(client!, campaignId!, {
        cursor: pageParam,
        limit: 50,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    enabled: enabled && !!instanceId && !!campaignId && !!client,
    refetchInterval: 15_000,
  });
}
export function useCampaignAudit(
  instanceId: string | undefined,
  token: string | undefined,
  campaignId: string | undefined,
  enabled: boolean,
) {
  const client = useInstanceClient(token);
  return useInfiniteQuery({
    queryKey: queryKeys.campaignAudit(instanceId ?? "", campaignId ?? ""),
    queryFn: ({ pageParam }) =>
      listCampaignAudit(client!, campaignId!, { cursor: pageParam, limit: 50 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    enabled: enabled && !!instanceId && !!campaignId && !!client,
    refetchInterval: 15_000,
  });
}
export function useCreateCampaign(
  instanceId: string,
  token: string | undefined,
) {
  const client = useInstanceClient(token);
  const cache = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      name: string;
      text: string;
      recipients: CampaignRecipientConsent[];
    }) => createCampaign(client!, input),
    onSuccess: async () =>
      cache.invalidateQueries({
        queryKey: queryKeys.instanceCampaigns(instanceId),
      }),
  });
}
export function useCampaignTransition(
  instanceId: string,
  token: string | undefined,
  campaignId: string,
) {
  const client = useInstanceClient(token);
  const cache = useQueryClient();
  return useMutation({
    mutationFn: ({
      action,
      startsAt,
    }: {
      action: "schedule" | "start" | "pause" | "resume" | "abort";
      startsAt?: string;
    }) => transitionCampaign(client!, campaignId, action, startsAt),
    onSuccess: async () =>
      Promise.all([
        cache.invalidateQueries({
          queryKey: queryKeys.campaign(instanceId, campaignId),
        }),
        cache.invalidateQueries({
          queryKey: queryKeys.instanceCampaigns(instanceId),
        }),
        cache.invalidateQueries({
          queryKey: queryKeys.campaignRecipients(instanceId, campaignId),
        }),
        cache.invalidateQueries({
          queryKey: queryKeys.campaignAudit(instanceId, campaignId),
        }),
      ]),
  });
}
