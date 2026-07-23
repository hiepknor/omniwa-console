import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/api/ApiProvider';
import { createCampaign, getCampaign, listCampaignAudit, listCampaignRecipients, listCampaigns, transitionCampaign, type CampaignRecipientConsent, type CampaignStatus } from '@/api/campaigns';
import { queryKeys } from '@/api/keys';

const SCOPE = 'session';
const READ_POLICY = { staleTime: 15_000, refetchInterval: 30_000 };

export function useCampaignsV2(status: CampaignStatus | undefined, cursor: string | undefined, enabled: boolean) {
  const client = useApi();
  const params = { status, cursor, limit: 50 };
  return useQuery({ queryKey: queryKeys.instanceCampaigns(SCOPE, params), queryFn: () => listCampaigns(client, params), enabled, ...READ_POLICY });
}

export function useCampaignV2(campaignId: string | undefined, enabled: boolean) {
  const client = useApi();
  return useQuery({ queryKey: queryKeys.campaign(SCOPE, campaignId ?? ''), queryFn: () => getCampaign(client, campaignId!), enabled: enabled && Boolean(campaignId), ...READ_POLICY });
}

export function useCampaignRecipientsV2(campaignId: string | undefined, cursor: string | undefined, enabled: boolean) {
  const client = useApi();
  const params = { cursor, limit: 50 };
  return useQuery({ queryKey: [...queryKeys.campaignRecipients(SCOPE, campaignId ?? ''), params], queryFn: () => listCampaignRecipients(client, campaignId!, params), enabled: enabled && Boolean(campaignId), ...READ_POLICY });
}

export function useCampaignAuditV2(campaignId: string | undefined, cursor: string | undefined, enabled: boolean) {
  const client = useApi();
  const params = { cursor, limit: 50 };
  return useQuery({ queryKey: [...queryKeys.campaignAudit(SCOPE, campaignId ?? ''), params], queryFn: () => listCampaignAudit(client, campaignId!, params), enabled: enabled && Boolean(campaignId), ...READ_POLICY });
}

function useInvalidateCampaign(campaignId?: string) {
  const cache = useQueryClient();
  return async () => {
    await cache.invalidateQueries({ queryKey: queryKeys.instanceCampaigns(SCOPE) });
    if (!campaignId) return;
    await Promise.all([
      cache.invalidateQueries({ queryKey: queryKeys.campaign(SCOPE, campaignId) }),
      cache.invalidateQueries({ queryKey: queryKeys.campaignRecipients(SCOPE, campaignId) }),
      cache.invalidateQueries({ queryKey: queryKeys.campaignAudit(SCOPE, campaignId) }),
    ]);
  };
}

export function useCreateCampaignV2() {
  const client = useApi();
  const invalidate = useInvalidateCampaign();
  return useMutation({ mutationFn: (input: { name: string; text: string; recipients: CampaignRecipientConsent[] }) => createCampaign(client, input), onSuccess: invalidate });
}

export function useCampaignTransitionV2(campaignId: string) {
  const client = useApi();
  const invalidate = useInvalidateCampaign(campaignId);
  return useMutation({ mutationFn: ({ action, startsAt }: { action: 'schedule' | 'start' | 'pause' | 'resume' | 'abort'; startsAt?: string }) => transitionCampaign(client, campaignId, action, startsAt), onSuccess: invalidate });
}
