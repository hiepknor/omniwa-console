import { useMemo } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useApiSession } from '@/api/ApiProvider';
import { useServerCapabilities } from '@/api/CapabilitiesProvider';
import type { CampaignStatus } from '@/api/campaigns';
import { ApiFailureNotice, Button, PageHeader, StateNotice, Status, Surface } from '@/components/v2';
import { humanizeToken, relativeTime } from '@/lib/format';
import { CampaignInspectorV2 } from './CampaignInspectorV2';
import { useCampaignsV2 } from './hooks';
import { campaignRouteState, setCampaignParam } from './route-state';

const statuses: CampaignStatus[] = ['draft', 'scheduled', 'running', 'paused', 'completed', 'aborted', 'failed'];
function tone(status: CampaignStatus) { return status === 'running' || status === 'completed' ? 'healthy' as const : status === 'failed' || status === 'aborted' ? 'failed' as const : status === 'scheduled' ? 'pending' as const : status === 'paused' ? 'degraded' as const : 'neutral' as const; }

export function CampaignsPageV2() {
  const session = useApiSession();
  const capabilities = useServerCapabilities();
  const { campaignId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const route = campaignRouteState(searchParams);
  const instanceScope = session.keyKind === 'api';
  const orchestration = instanceScope && (capabilities.data?.capabilities.includes('campaign_orchestration') ?? false);
  const ratePosture = capabilities.data?.capabilities.includes('outbound_rate_limit') ?? false;
  const campaigns = useCampaignsV2(route.status, route.cursor, orchestration);
  const items = useMemo(() => campaigns.data?.items ?? [], [campaigns.data]);
  const setParam = (key: string, value?: string) => setSearchParams(setCampaignParam(searchParams, key, value), { replace: true });
  const listParams = new URLSearchParams(searchParams); listParams.delete('created'); listParams.delete('tab'); listParams.delete('recipientCursor'); listParams.delete('auditCursor');
  const listUrl = `/messages${listParams.size ? `?${listParams}` : ''}`;

  if (!instanceScope) return <Blocked detail="Campaign orchestration requires an instance credential. Admin scope cannot operate token-scoped campaigns, and no campaign request was sent." state="invalid" />;
  if (capabilities.isPending) return <Blocked detail="Discovering instance capabilities before enabling campaign orchestration." state="discovering" />;
  if (capabilities.isError) return <Blocked detail="Capability discovery failed. Campaign operations remain disabled." state="unsupported" />;
  if (!orchestration) return <Blocked detail="The backend does not advertise campaign_orchestration. The Console does not emulate recipient loops, pacing, or retry in the browser." state="unsupported" />;

  return <div className="ui-v2-page">
    <PageHeader eyebrow="Messaging" title="Campaigns" description="Server-owned campaign orchestration with explicit consent, factual recipient outcomes, and durable audit history." actions={<><Button disabled={campaigns.isFetching} onClick={() => campaigns.refetch()}>{campaigns.isFetching ? 'Refreshing…' : 'Refresh'}</Button><Link className="ui-v2-button ui-v2-button--primary" to="/messages/new">New campaign</Link></>} />
    <div className="ui-v2-page__content">
      {searchParams.get('created') === '1' ? <StateNotice value={{ axis: 'command', state: 'acknowledged' }} detail="Campaign draft creation was acknowledged. Recipient and audit reads remain authoritative; creation does not prove delivery or campaign completion." /> : null}
      {!ratePosture ? <StateNotice value={{ axis: 'capability', state: 'unsupported' }} detail="outbound_rate_limit is not advertised. Campaign state remains readable, but confirm backend pacing posture before starting outbound work." /> : null}
      <Surface title="Campaign directory" description="Status filter, opaque cursor, and selected campaign remain URL-addressable.">
        <div className="ui-v2-campaign-filters"><label className="ui-v2-inline-select"><span>Status</span><select value={route.status ?? ''} onChange={(event) => setParam('status', event.target.value || undefined)}><option value="">All statuses</option>{statuses.map((status) => <option key={status} value={status}>{humanizeToken(status)}</option>)}</select></label><span>{items.length} campaigns on this page</span></div>
        {campaigns.isPending ? <StateNotice value={{ axis: 'resource', state: 'initial-loading' }} /> : campaigns.error && !campaigns.data ? <ApiFailureNotice error={campaigns.error} onRetry={() => campaigns.refetch()} /> : campaigns.data ? <>{campaigns.error ? <ApiFailureNotice error={campaigns.error} stale onRetry={() => campaigns.refetch()} /> : null}{items.length ? <div className="ui-v2-table-wrap" tabIndex={0} aria-label="Campaign table"><table className="ui-v2-table ui-v2-campaign-table"><caption className="ui-v2-visually-hidden">Campaigns</caption><thead><tr><th>Campaign</th><th>Status</th><th>Starts</th><th>Updated</th><th>Version</th></tr></thead><tbody>{items.map((campaign) => <tr key={campaign.id} data-selected={campaign.id === campaignId || undefined}><td data-label="Campaign"><button className="ui-v2-row-link" type="button" onClick={() => navigate(`/messages/${encodeURIComponent(campaign.id)}${searchParams.size ? `?${searchParams}` : ''}`)}>{campaign.name}</button><small className="ui-v2-mono">{campaign.id}</small></td><td data-label="Status"><Status tone={tone(campaign.status)}>{humanizeToken(campaign.status)}</Status></td><td data-label="Starts">{relativeTime(campaign.startsAt) || 'Not scheduled'}</td><td data-label="Updated">{relativeTime(campaign.updatedAt) || 'Not reported'}</td><td data-label="Version">{campaign.version}</td></tr>)}</tbody></table></div> : <StateNotice value={{ axis: 'resource', state: 'empty' }} detail={route.status ? `No ${humanizeToken(route.status)} campaigns were returned.` : 'No campaigns exist in this instance scope.'} />}<div className="ui-v2-pagination"><span>{route.cursor ? 'Opaque cursor page' : 'First page'}</span><div>{route.cursor ? <Button onClick={() => setParam('cursor')}>Start over</Button> : null}<Button disabled={!campaigns.data.nextCursor} onClick={() => setParam('cursor', campaigns.data?.nextCursor ?? undefined)}>Next page</Button></div></div></> : null}
      </Surface>
    </div>
    {campaignId ? <CampaignInspectorV2 campaignId={campaignId} onClose={() => navigate(listUrl)} /> : null}
  </div>;
}

function Blocked({ detail, state }: { detail: string; state: 'invalid' | 'discovering' | 'unsupported' }) { return <div className="ui-v2-page"><PageHeader eyebrow="Messaging" title="Campaigns" description="Server-owned campaign orchestration and durable recipient outcomes." /><div className="ui-v2-page__content"><StateNotice value={state === 'invalid' ? { axis: 'session', state } : { axis: 'capability', state }} detail={detail} /></div></div>; }
