import { useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useApiSession } from '@/api/ApiProvider';
import { useServerCapabilities } from '@/api/CapabilitiesProvider';
import { ApiFailureNotice } from '@/components/ApiFailureNotice';
import { humanizeToken } from '@/lib/format';
import { omitSearchParams, withSearchParams } from '@/lib/url-search-state';
import { useInvalidCursorReset } from '@/lib/useInvalidCursorReset';
import { PageHeader, StateNotice } from '@/ui';
import { CampaignInspector } from './CampaignInspector';
import { CampaignsView } from './CampaignsView';
import { useCampaigns } from './hooks';
import { campaignRouteState, setCampaignParam } from './route-state';

function Blocked({ detail, title }: { detail: string; title: string }) {
  return (
    <div className="grid gap-6 p-6 max-sm:p-4">
      <PageHeader eyebrow="Messaging" title="Campaigns" description="Server-owned campaign orchestration and durable recipient outcomes." />
      <StateNotice kind="empty" title={title} detail={detail} />
    </div>
  );
}

function Fail({ error, stale, onRetry }: { error: unknown; stale?: boolean; onRetry: () => void }) {
  return <ApiFailureNotice error={error} title={stale ? 'Showing last known data' : 'Read failed'} onRetry={onRetry} />;
}

export function CampaignsPage() {
  const session = useApiSession();
  const capabilities = useServerCapabilities();
  const { campaignId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const route = campaignRouteState(searchParams);
  const instanceScope = session.keyKind === 'api';
  const orchestration = instanceScope && (capabilities.data?.capabilities.includes('campaign_orchestration') ?? false);
  const ratePosture = capabilities.data?.capabilities.includes('outbound_rate_limit') ?? false;
  const campaigns = useCampaigns(route.status, route.cursor, orchestration);
  const items = useMemo(() => campaigns.data?.items ?? [], [campaigns.data]);
  const setParam = (key: string, value?: string) => setSearchParams(setCampaignParam(searchParams, key, value), { replace: true });
  const listParams = omitSearchParams(searchParams, ['created', 'tab', 'recipientCursor', 'auditCursor']);
  const listUrl = withSearchParams('/messages', listParams);
  const openCampaign = (id: string) => navigate(`/messages/${encodeURIComponent(id)}${searchParams.size ? `?${searchParams}` : ''}`);
  useInvalidCursorReset(campaigns.error, route.cursor, () => setParam('cursor'));

  if (!instanceScope) return <Blocked title="Instance credential required" detail="Campaign orchestration requires an instance credential. Admin scope cannot operate token-scoped campaigns, and no campaign request was sent." />;
  if (capabilities.isPending) return <Blocked title="Discovering capabilities" detail="Discovering instance capabilities before enabling campaign orchestration." />;
  if (capabilities.isError && !campaigns.data) return <Blocked title="Unsupported" detail="Capability discovery failed. Campaign operations remain disabled." />;
  if (!orchestration && !campaigns.data) return <Blocked title="Unsupported" detail="The backend does not advertise campaign_orchestration. The Console does not emulate recipient loops, pacing, or retry in the browser." />;

  return (
    <>
      <CampaignsView
        refreshing={campaigns.isFetching}
        onRefresh={() => campaigns.refetch()}
        newHref={orchestration ? '/messages/new' : undefined}
        notices={
          <div className="grid gap-2">
            {searchParams.get('created') === '1' ? <StateNotice kind="info" title="Draft creation accepted" detail="Recipient and audit reads remain authoritative; creation does not prove delivery or campaign completion." /> : null}
            {!ratePosture ? <StateNotice kind="empty" title="Rate posture unknown" detail="outbound_rate_limit is not advertised. Campaign state remains readable, but confirm backend pacing posture before starting outbound work." /> : null}
            {!orchestration ? <StateNotice kind="empty" title="Capability changed" detail="Keeping the last usable campaign snapshot visible. New campaign commands remain unavailable until campaign_orchestration returns." /> : null}
          </div>
        }
        status={route.status ?? ''}
        onStatus={(v) => setParam('status', v)}
        count={items.length}
        initialLoading={campaigns.isPending}
        empty={Boolean(campaigns.data) && items.length === 0}
        emptyDetail={route.status ? `No ${humanizeToken(route.status)} campaigns were returned.` : 'No campaigns exist in this instance scope.'}
        errorSlot={campaigns.error && !campaigns.data ? <Fail error={campaigns.error} onRetry={() => campaigns.refetch()} /> : campaigns.error ? <Fail error={campaigns.error} stale onRetry={() => campaigns.refetch()} /> : undefined}
        items={items}
        selectedId={campaignId}
        onOpen={openCampaign}
        cursor={route.cursor}
        nextCursor={campaigns.data?.nextCursor ?? undefined}
        onCursor={(v) => setParam('cursor', v)}
      />
      {campaignId ? <CampaignInspector campaignId={campaignId} commandsEnabled={orchestration} onClose={() => navigate(listUrl)} /> : null}
    </>
  );
}
