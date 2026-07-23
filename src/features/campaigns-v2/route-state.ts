import type { CampaignStatus } from '@/api/campaigns';

const statuses: CampaignStatus[] = ['draft', 'scheduled', 'running', 'paused', 'completed', 'aborted', 'failed'];
export type CampaignTabV2 = 'overview' | 'recipients' | 'audit';

export function campaignRouteState(searchParams: URLSearchParams) {
  const statusValue = searchParams.get('status');
  const tabValue = searchParams.get('tab');
  return {
    status: statuses.includes(statusValue as CampaignStatus) ? statusValue as CampaignStatus : undefined,
    cursor: searchParams.get('cursor')?.trim() || undefined,
    recipientCursor: searchParams.get('recipientCursor')?.trim() || undefined,
    auditCursor: searchParams.get('auditCursor')?.trim() || undefined,
    tab: tabValue === 'recipients' || tabValue === 'audit' ? tabValue : 'overview' as CampaignTabV2,
  };
}

export function setCampaignParam(searchParams: URLSearchParams, key: string, value?: string) {
  const next = new URLSearchParams(searchParams);
  if (value) next.set(key, value); else next.delete(key);
  if (key === 'status') next.delete('cursor');
  return next;
}
