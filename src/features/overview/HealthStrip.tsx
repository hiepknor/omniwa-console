import { relativeTime } from '@/lib/format';
import { useHealth, useStableReadState } from './hooks';
import { OverviewDiagnostics } from './OverviewDiagnostics';

function dot(status: string): string {
  switch (status.toLowerCase()) {
    case 'healthy':
    case 'connected':
    case 'closed':
      return 'dot-ok';
    case 'degraded':
    case 'syncing':
    case 'half_open':
      return 'dot-pending';
    case 'throttled':
    case 'failed':
    case 'open':
      return 'dot-failed';
    default:
      return 'dot-info';
  }
}

function label(value: string): string {
  return value.replaceAll('_', ' ').replace(/^./u, (letter) => letter.toUpperCase());
}

export function HealthStrip() {
  const health = useHealth();
  const state = useStableReadState(health, health.data !== undefined);
  const snapshot = health.data;
  const degraded = snapshot?.instances.filter((instance) => (
    !instance.connection.connected
    || instance.projection.status === 'degraded'
    || instance.projection.status === 'failed'
    || instance.throttling.status === 'throttled'
  )).length ?? 0;

  if (state.isInitialLoading) {
    return <section className="overview-posture" aria-labelledby="overview-posture-title"><div className="overview-section-label"><span>Health</span><span>Checking</span></div><h2 id="overview-posture-title">Reading independent health dimensions.</h2><p>API, connection, projection and query throttling are evaluated separately.</p></section>;
  }
  if (state.isInitialError || !snapshot) {
    return <section className="overview-posture" aria-labelledby="overview-posture-title"><div className="overview-section-label"><span>Health</span><span>Unavailable</span></div><h2 id="overview-posture-title">The health snapshot cannot be read.</h2><p>No instance or projection status is inferred while the API is unreachable.</p><OverviewDiagnostics id="overview-health-diagnostics" diagnostics={[{ source: 'Server health', error: state.error }]} onRetry={() => { void health.refetch(); }} /></section>;
  }

  return (
    <section className="overview-posture" aria-labelledby="overview-posture-title">
      <div className="overview-section-label"><span>Split health</span><span>{state.isStaleError ? 'Stale snapshot' : degraded > 0 ? `${degraded} need review` : 'Operational'}</span></div>
      <h2 id="overview-posture-title">API, connection, projection and throttling.</h2>
      <p>Generated {relativeTime(snapshot.generatedAt) || 'at an unknown time'}. A healthy API does not imply that every WhatsApp instance is connected or ready.</p>
      <div className="overview-posture-reads" aria-label="Independent server health dimensions">
        <div className="overview-posture-read">
          <span className={`dot ${dot(snapshot.api.status)}`} aria-hidden="true" />
          <span><strong>API</strong><small>{label(snapshot.api.status)}</small></span>
        </div>
        {snapshot.instances.flatMap((instance) => [
          <div className="overview-posture-read" key={`${instance.instanceId}:connection`} title={instance.instanceId}>
            <span className={`dot ${dot(instance.connection.status)}`} aria-hidden="true" />
            <span><strong>Connection</strong><small>{label(instance.connection.status)}</small></span>
          </div>,
          <div className="overview-posture-read" key={`${instance.instanceId}:projection`} title={instance.instanceId}>
            <span className={`dot ${dot(instance.projection.status)}`} aria-hidden="true" />
            <span><strong>Projection</strong><small>{label(instance.projection.status)}</small></span>
          </div>,
          <div className="overview-posture-read" key={`${instance.instanceId}:throttling`} title={instance.instanceId}>
            <span className={`dot ${dot(instance.throttling.status)}`} aria-hidden="true" />
            <span><strong>Throttling</strong><small>{instance.throttling.observed ? `${label(instance.throttling.status)} · ${label(instance.throttling.circuitState)}` : 'Not observed · closed'}</small></span>
          </div>,
        ])}
      </div>
      {snapshot.instances.length === 0 && <p>No instances exist in this health scope.</p>}
      {state.isStaleError && <OverviewDiagnostics id="overview-health-diagnostics" diagnostics={[{ source: 'Server health refresh', error: state.error }]} onRetry={() => { void health.refetch(); }} />}
    </section>
  );
}
