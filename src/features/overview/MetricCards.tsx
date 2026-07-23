import { formatCount, relativeTime } from '@/lib/format';
import { useOverview, useStableReadState } from './hooks';
import { OverviewDiagnostics } from './OverviewDiagnostics';

type Metric = { label: string; value: number; context: string };

export function MetricCards() {
  const overview = useOverview('24h');
  const state = useStableReadState(overview, overview.data !== undefined);
  const snapshot = overview.data;

  if (state.isInitialLoading) {
    return <section className="overview-coverage" aria-labelledby="overview-metrics-loading"><div className="overview-section-label"><span>Persisted metrics</span><span>Loading</span></div><h2 id="overview-metrics-loading">Reading the 24-hour projection snapshot.</h2><p>This read uses PostgreSQL and does not query WhatsApp.</p></section>;
  }
  if (state.isInitialError || !snapshot) {
    return <section className="overview-coverage" aria-labelledby="overview-metrics-error"><div className="overview-section-label"><span>Persisted metrics</span><span>Unavailable</span></div><h2 id="overview-metrics-error">The overview snapshot cannot be read.</h2><p>Unavailable counters remain unreported; they are not presented as zero.</p><OverviewDiagnostics id="overview-metric-diagnostics" diagnostics={[{ source: 'Persisted overview', error: state.error }]} onRetry={() => { void overview.refetch(); }} /></section>;
  }

  const window = snapshot.window.durationSeconds > 0 ? `${Math.round(snapshot.window.durationSeconds / 3_600)}h window` : 'Window unavailable';
  const metrics: Metric[] = [
    { label: 'Instances', value: snapshot.instances.total, context: `${formatCount(snapshot.instances.connected)} connected · persisted state` },
    { label: 'Groups', value: snapshot.projections.groups, context: 'Active projection rows' },
    { label: 'Contacts', value: snapshot.projections.contacts, context: 'Active projection rows' },
    { label: 'Chats', value: snapshot.projections.chats, context: 'Active projection rows' },
    { label: 'Messages', value: snapshot.messages.total, context: `${formatCount(snapshot.messages.incoming)} in · ${formatCount(snapshot.messages.outgoing)} out · ${window}` },
    { label: 'Events', value: snapshot.projections.events, context: `Durable history · ${window}` },
  ];

  return (
    <section className="overview-metric-section" aria-labelledby="overview-metrics-title">
      <div className="overview-metric-head">
        <div><span className="overview-eyebrow">Persisted metrics</span><h2 id="overview-metrics-title">Projection snapshot</h2></div>
        <span className="overview-metric-state">{state.isStaleError ? 'Stale' : `Generated ${relativeTime(snapshot.generatedAt) || '—'}`}</span>
      </div>
      <p>Scope: <span className="mono">{snapshot.scope.type}{snapshot.scope.instanceId ? `:${snapshot.scope.instanceId}` : ''}</span>. Flow counters use the explicit {window}; entity counters are current active rows.</p>
      <div className="overview-metrics">
        {metrics.map((metric) => <article className="overview-metric-card" data-state={state.isStaleError ? 'stale' : 'fresh'} key={metric.label}><div className="label">{metric.label}</div><div className="value num">{formatCount(metric.value)}</div><div className="ctx"><span>{metric.context}</span></div></article>)}
      </div>
      {state.isStaleError && <OverviewDiagnostics id="overview-metric-diagnostics" diagnostics={[{ source: 'Persisted overview refresh', error: state.error }]} onRetry={() => { void overview.refetch(); }} />}
    </section>
  );
}
