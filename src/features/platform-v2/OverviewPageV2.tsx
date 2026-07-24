import { useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { useApiSession } from '@/api/ApiProvider';
import { useServerCapabilities } from '@/api/CapabilitiesProvider';
import { ApiFailure } from '@/api/envelopes';
import { queryKeys } from '@/api/keys';
import { Button, PageHeader, RelativeTime, StateNotice, Status, Surface } from '@/components/v2';
import { formatCount, humanizeToken, relativeTime } from '@/lib/format';
import { useResilientReadState } from '@/lib/query-state';
import { updateSearchParams } from '@/lib/url-search-state';
import { failureDetail, failureRequestId, readFailureState } from './state';
import { usePlatformHealth, usePlatformOverview, usePlatformProjectionHealth } from './hooks';
import { overviewWindowFromSearch, overviewWindowOptions } from './route-state';

function QueryNotice({ query, state }: { query: { error: unknown; refetch: () => unknown }; state: ReturnType<typeof useResilientReadState> }) {
  if (!state.isError) return null;
  const rateLimited = state.error instanceof ApiFailure && state.error.category === 'rate_limited';
  return (
    <StateNotice
      value={readFailureState(state.error, state.isStaleError)}
      detail={`${failureDetail(state.error)}${rateLimited ? ' Automatic retries are disabled.' : ''}`}
      requestId={failureRequestId(state.error)}
      action={rateLimited ? undefined : <Button onClick={() => query.refetch()}>Retry read</Button>}
    />
  );
}

export function OverviewPageV2() {
  const [searchParams, setSearchParams] = useSearchParams();
  const window = overviewWindowFromSearch(searchParams.get('window'));
  const overview = usePlatformOverview(window);
  const health = usePlatformHealth();
  const projection = usePlatformProjectionHealth();
  const overviewState = useResilientReadState(overview);
  const healthState = useResilientReadState(health);
  const projectionState = useResilientReadState(projection);
  const queryClient = useQueryClient();
  const session = useApiSession();
  const capabilities = useServerCapabilities();
  const recoveryAvailable = capabilities.data?.capabilities.includes('projection_failure_operations') ?? false;
  const refreshing = overview.isFetching || health.isFetching || projection.isFetching;

  const setWindow = (value: string) => {
    setSearchParams(updateSearchParams(searchParams, { window: value === '24h' ? undefined : value }), { replace: true });
  };
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.overview(window) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.health });
    void queryClient.invalidateQueries({ queryKey: queryKeys.projectionHealth });
  };

  return (
    <div className="ui-v2-page">
      <PageHeader
        eyebrow="Platform"
        title="Operational overview"
        description="Persisted server, instance, projection, and message facts. Missing values remain unreported."
        actions={(
          <>
            <label className="ui-v2-inline-select">
              <span>Metric window</span>
              <select value={window} onChange={(event) => setWindow(event.target.value)}>
                {overviewWindowOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <Button onClick={refresh} disabled={refreshing} aria-busy={refreshing || undefined}>
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </Button>
          </>
        )}
      />

      <div className="ui-v2-page__content">
        <div className="ui-v2-state-list">
          <QueryNotice query={health} state={healthState} />
          <QueryNotice query={overview} state={overviewState} />
          <QueryNotice query={projection} state={projectionState} />
        </div>

        {healthState.isInitialLoading || overviewState.isInitialLoading || projectionState.isInitialLoading ? (
          <StateNotice value={{ axis: 'resource', state: 'initial-loading' }} detail="Reading the persisted platform snapshots." />
        ) : null}

        {health.data ? (
          <Surface
            title="Control plane and instance health"
            description={`Generated ${relativeTime(health.data.generatedAt) || 'at an unreported time'}. Connection, projection, and throttling remain independent.`}
            actions={<Status tone={health.data.api.status === 'healthy' ? 'healthy' : 'degraded'}>{humanizeToken(health.data.api.status)}</Status>}
          >
            {health.data.instances.length === 0 ? (
              <StateNotice value={{ axis: 'resource', state: 'empty' }} detail="The health snapshot contains no instances; this is not evidence of a representative workload." />
            ) : (
              <div className="ui-v2-table-wrap" tabIndex={0} aria-label="Instance health table">
                <table className="ui-v2-table ui-v2-platform-table">
                  <caption className="ui-v2-visually-hidden">Independent instance health dimensions</caption>
                  <thead><tr><th>Instance</th><th>Connection</th><th>Projection</th><th>Throttling</th></tr></thead>
                  <tbody>
                    {health.data.instances.map((instance) => (
                      <tr key={instance.instanceId}>
                        <td data-label="Instance" className="ui-v2-mono">{instance.instanceId}</td>
                        <td data-label="Connection"><Status tone={instance.connection.connected ? 'healthy' : 'failed'}>{humanizeToken(instance.connection.status)}</Status></td>
                        <td data-label="Projection"><Status tone={instance.projection.status === 'healthy' || instance.projection.status === 'ready' ? 'healthy' : 'degraded'}>{humanizeToken(instance.projection.status)}</Status></td>
                        <td data-label="Throttling"><Status tone={instance.throttling.observed ? 'degraded' : 'neutral'}>{humanizeToken(instance.throttling.status)}</Status></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Surface>
        ) : null}

        {overview.data ? (
          <Surface
            title="Persisted metrics"
            description={`${humanizeToken(overview.data.scope.type)} scope · ${window} · generated ${relativeTime(overview.data.generatedAt) || 'at an unreported time'}`}
          >
            <div className="ui-v2-metric-grid">
              {[
                ['Instances', overview.data.instances.total],
                ['Connected', overview.data.instances.connected],
                ['Disconnected', overview.data.instances.disconnected],
                ['Messages', overview.data.messages.total],
                ['Incoming', overview.data.messages.incoming],
                ['Outgoing', overview.data.messages.outgoing],
                ['Chats', overview.data.projections.chats],
                ['Groups', overview.data.projections.groups],
                ['Contacts', overview.data.projections.contacts],
                ['Events', overview.data.projections.events],
              ].map(([label, value]) => (
                <div key={label as string}><span>{label}</span><strong>{formatCount(value as number | undefined)}</strong></div>
              ))}
            </div>
          </Surface>
        ) : null}

        {projection.data ? (
          <Surface
            title="Projection posture"
            description={`Aggregate snapshot generated ${relativeTime(projection.data.generatedAt) || 'at an unreported time'}.`}
            actions={<Status tone={projection.data.status === 'healthy' || projection.data.status === 'ready' ? 'healthy' : 'degraded'}>{humanizeToken(projection.data.status)}</Status>}
          >
            {projection.data.resources.length === 0 ? (
              <StateNotice value={{ axis: 'resource', state: 'empty' }} detail="The server reported no projection resources in this snapshot." />
            ) : (
              <div className="ui-v2-table-wrap" tabIndex={0} aria-label="Projection health table">
                <table className="ui-v2-table ui-v2-platform-table">
                  <caption className="ui-v2-visually-hidden">Projection resource health</caption>
                  <thead><tr><th>Resource</th><th>Instance</th><th>Sync state</th><th>Pending</th><th>Dead letters</th><th>Event lag</th></tr></thead>
                  <tbody>
                    {projection.data.resources.map((resource, index) => (
                      <tr key={`${resource.instanceId ?? 'server'}-${resource.resource}-${index}`}>
                        <td data-label="Resource">{humanizeToken(resource.resource)}</td>
                        <td data-label="Instance" className="ui-v2-mono">{resource.instanceId ?? 'Server'}</td>
                        <td data-label="Sync state"><Status tone={resource.syncStatus === 'ready' ? 'healthy' : resource.syncStatus === 'failed' ? 'failed' : 'degraded'}>{humanizeToken(resource.syncStatus)}</Status></td>
                        <td data-label="Pending" className="ui-v2-mono">{formatCount(resource.pendingEvents)}</td>
                        <td data-label="Dead letters" className="ui-v2-mono">{formatCount(resource.deadLetterEvents)}</td>
                        <td data-label="Event lag" className="ui-v2-mono">{resource.eventLagSeconds === undefined ? '—' : `${resource.eventLagSeconds}s`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Surface>
        ) : null}

        <Surface title="Recovery" description="Terminal projection failures require an explicit audited operator command.">
          {capabilities.isPending ? (
            <StateNotice value={{ axis: 'capability', state: 'discovering' }} detail="Waiting for capability discovery before enabling Recovery." />
          ) : session.keyKind === 'admin' && recoveryAvailable ? (
            <div className="ui-v2-empty-action"><p>Review dead letters without inferring recovery from aggregate health.</p><Link className="ui-v2-button ui-v2-button--secondary" to="/recovery">Open recovery</Link></div>
          ) : (
            <StateNotice value={{ axis: 'capability', state: 'unsupported' }} detail="Recovery requires admin scope and the projection_failure_operations capability." />
          )}
        </Surface>

        <p className="ui-v2-generated-note">Latest available snapshots: overview <RelativeTime value={overview.data?.generatedAt} />, health <RelativeTime value={health.data?.generatedAt} />, projections <RelativeTime value={projection.data?.generatedAt} />.</p>
      </div>
    </div>
  );
}
