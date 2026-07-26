import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/api/ApiProvider';
import { createCampaign, getCampaign, listCampaignAudit, listCampaignRecipients, listCampaigns, transitionCampaign, type CampaignRecipientConsent, type CampaignStatus } from '@/api/campaigns';
import { queryKeys, SESSION_QUERY_SCOPE } from '@/api/keys';
import { CAMPAIGN_READ_POLICY } from '@/lib/query-policy';

export function useCampaigns(status: CampaignStatus | undefined, cursor: string | undefined, enabled: boolean) {
  const client = useApi();
  const params = { status, cursor, limit: 50 };
  return useQuery({ queryKey: queryKeys.instanceCampaigns(SESSION_QUERY_SCOPE, params), queryFn: () => listCampaigns(client, params), enabled, ...CAMPAIGN_READ_POLICY });
}

export function useCampaign(campaignId: string | undefined, enabled: boolean) {
  const client = useApi();
  return useQuery({ queryKey: queryKeys.campaign(SESSION_QUERY_SCOPE, campaignId ?? ''), queryFn: () => getCampaign(client, campaignId!), enabled: enabled && Boolean(campaignId), ...CAMPAIGN_READ_POLICY });
}

export function useCampaignRecipients(campaignId: string | undefined, cursor: string | undefined, enabled: boolean) {
  const client = useApi();
  const params = { cursor, limit: 50 };
  return useQuery({ queryKey: queryKeys.campaignRecipients(SESSION_QUERY_SCOPE, campaignId ?? '', params), queryFn: () => listCampaignRecipients(client, campaignId!, params), enabled: enabled && Boolean(campaignId), ...CAMPAIGN_READ_POLICY });
}

export function useCampaignAudit(campaignId: string | undefined, cursor: string | undefined, enabled: boolean) {
  const client = useApi();
  const params = { cursor, limit: 50 };
  return useQuery({ queryKey: queryKeys.campaignAudit(SESSION_QUERY_SCOPE, campaignId ?? '', params), queryFn: () => listCampaignAudit(client, campaignId!, params), enabled: enabled && Boolean(campaignId), ...CAMPAIGN_READ_POLICY });
}

function useInvalidateCampaign(campaignId?: string) {
  const cache = useQueryClient();
  return async () => {
    await cache.invalidateQueries({ queryKey: queryKeys.instanceCampaigns(SESSION_QUERY_SCOPE) });
    if (!campaignId) return;
    await Promise.all([
      cache.invalidateQueries({ queryKey: queryKeys.campaign(SESSION_QUERY_SCOPE, campaignId) }),
      cache.invalidateQueries({ queryKey: queryKeys.campaignRecipients(SESSION_QUERY_SCOPE, campaignId) }),
      cache.invalidateQueries({ queryKey: queryKeys.campaignAudit(SESSION_QUERY_SCOPE, campaignId) }),
    ]);
  };
}

export function useCreateCampaign() {
  const client = useApi();
  const invalidate = useInvalidateCampaign();
  return useMutation({ mutationFn: (input: { name: string; text: string; recipients: CampaignRecipientConsent[] }) => createCampaign(client, input), onSuccess: invalidate });
}

export function useCampaignTransition(campaignId: string) {
  const client = useApi();
  const invalidate = useInvalidateCampaign(campaignId);
  return useMutation({ mutationFn: ({ action, startsAt }: { action: 'schedule' | 'start' | 'pause' | 'resume' | 'abort'; startsAt?: string }) => transitionCampaign(client, campaignId, action, startsAt), onSuccess: invalidate });
}
