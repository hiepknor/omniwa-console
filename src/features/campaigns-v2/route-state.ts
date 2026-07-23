import type { CampaignStatus } from '@/api/campaigns';
import { readOptionalSearchParam, readSearchEnum, updateSearchParams } from '@/lib/url-search-state';

const statuses: CampaignStatus[] = ['draft', 'scheduled', 'running', 'paused', 'completed', 'aborted', 'failed'];
export type CampaignTabV2 = 'overview' | 'recipients' | 'audit';

export function campaignRouteState(searchParams: URLSearchParams) {
  const statusValue = searchParams.get('status');
  return {
    status: statuses.includes(statusValue as CampaignStatus) ? statusValue as CampaignStatus : undefined,
    cursor: readOptionalSearchParam(searchParams, 'cursor'),
    recipientCursor: readOptionalSearchParam(searchParams, 'recipientCursor'),
    auditCursor: readOptionalSearchParam(searchParams, 'auditCursor'),
    tab: readSearchEnum(searchParams, 'tab', ['overview', 'recipients', 'audit'], 'overview') as CampaignTabV2,
  };
}

export function setCampaignParam(searchParams: URLSearchParams, key: string, value?: string) {
  return updateSearchParams(searchParams, { [key]: value }, key === 'status' ? ['cursor'] : []);
}
