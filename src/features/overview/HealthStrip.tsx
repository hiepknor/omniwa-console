import { formatClockTime, relativeTime } from '@/lib/format';
import type { InstanceHealthResource, ProjectionHealthResource, ServerHealthResource } from '@/api/overview';
import { useHealth, useProjectionHealth, useStableReadState } from './hooks';
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

function statusIs(value: string, accepted: readonly string[]): boolean {
  return accepted.includes(value.trim().toLowerCase());
}

function throttlingDetail(instance: InstanceHealthResource): string {
  const throttling = instance.throttling;
  const details = [throttling.observed
    ? `${label(throttling.status)} · ${label(throttling.circuitState)}`
    : `Not observed · ${label(throttling.circuitState)}`];
  if (throttling.retryAfterSeconds !== undefined) details.push(`retry in ${Math.ceil(throttling.retryAfterSeconds)}s`);
  if (throttling.openUntil !== undefined) details.push(`until ${formatClockTime(throttling.openUntil)}`);
  return details.join(' · ');
}

export function instanceNeedsReview(instance: InstanceHealthResource): boolean {
  const projectionHealthy = statusIs(instance.projection.status, ['healthy', 'ready']);
  const throttlingHealthy = !instance.throttling.observed
    ? statusIs(instance.throttling.circuitState, ['closed'])
    : statusIs(instance.throttling.status, ['healthy', 'ok', 'normal'])
      && statusIs(instance.throttling.circuitState, ['closed']);
  return !instance.connection.connected || !projectionHealthy || !throttlingHealthy;
}

export function healthSummary(
  snapshot: ServerHealthResource,
  projection: ProjectionHealthResource | undefined,
  projectionUnavailable = false,
): string {
  const platformNeedsReview = !statusIs(snapshot.api.status, ['healthy', 'ok'])
    || projectionUnavailable
    || (projection !== undefined && !statusIs(projection.status, ['healthy', 'ready']));
  const instancesNeedingReview = snapshot.instances.filter(instanceNeedsReview).length;
  if (platformNeedsReview && instancesNeedingReview > 0) return `Platform + ${instancesNeedingReview} instances need review`;
  if (platformNeedsReview) return 'Platform needs review';
  if (instancesNeedingReview > 0) return `${instancesNeedingReview} ${instancesNeedingReview === 1 ? 'instance needs' : 'instances need'} review`;
  return 'Operational';
}

export function InstanceHealthGroups({ instances }: { instances: InstanceHealthResource[] }) {
  if (instances.length === 0) return <p className="overview-instance-health-empty">No instances exist in this health scope.</p>;
  return (
    <div className="overview-instance-health-list" aria-label="Health dimensions grouped by instance">
      {instances.map((instance, index) => {
        const titleId = `overview-instance-health-${index}`;
        return (
          <article className="overview-instance-health" aria-labelledby={titleId} key={instance.instanceId}>
            <div className="overview-instance-health-head"><strong className="mono" id={titleId} title={instance.instanceId}>{instance.instanceId}</strong><span>{instanceNeedsReview(instance) ? 'Needs review' : 'Operational'}</span></div>
            <div className="overview-instance-health-reads">
              <div className="overview-posture-read"><span className={`dot ${dot(instance.connection.status)}`} aria-hidden="true" /><span><strong>Connection</strong><small>{label(instance.connection.status)}</small></span></div>
              <div className="overview-posture-read"><span className={`dot ${dot(instance.projection.status)}`} aria-hidden="true" /><span><strong>Projection</strong><small>{label(instance.projection.status)}</small></span></div>
              <div className="overview-posture-read"><span className={`dot ${dot(instance.throttling.status)}`} aria-hidden="true" /><span><strong>Throttling</strong><small>{throttlingDetail(instance)}</small></span></div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

export function HealthStrip() {
  const health = useHealth();
  const projectionHealth = useProjectionHealth();
  const state = useStableReadState(health, health.data !== undefined);
  const projectionState = useStableReadState(projectionHealth, projectionHealth.data !== undefined);
  const snapshot = health.data;

  if (state.isInitialLoading) {
    return <section className="overview-posture" aria-labelledby="overview-posture-title"><div className="overview-section-label"><span>Health</span><span>Checking</span></div><h2 id="overview-posture-title">Reading independent health dimensions.</h2><p>API, connection, projection and query throttling are evaluated separately.</p></section>;
  }
  if (state.isInitialError || !snapshot) {
    const diagnostics = [{ source: 'Server health', error: state.error }];
    if (projectionState.isError) diagnostics.push({ source: 'Projection health', error: projectionState.error });
    return <section className="overview-posture" aria-labelledby="overview-posture-title"><div className="overview-section-label"><span>Health</span><span>Unavailable</span></div><h2 id="overview-posture-title">The health snapshot cannot be read.</h2><p>No instance or projection status is inferred while the API is unreachable.</p><OverviewDiagnostics id="overview-health-diagnostics" diagnostics={diagnostics} onRetry={() => { void Promise.all([health.refetch(), projectionHealth.refetch()]); }} /></section>;
  }

  const projectionSnapshot = projectionHealth.data;
  const projectionUnavailable = projectionState.isInitialError || (!projectionHealth.isLoading && projectionSnapshot === undefined);
  const diagnostics = [
    ...(state.isStaleError ? [{ source: 'Server health refresh', error: state.error }] : []),
    ...(projectionState.isError ? [{ source: projectionState.isStaleError ? 'Projection health refresh' : 'Projection health', error: projectionState.error }] : []),
  ];
  const summary = state.isStaleError || projectionState.isStaleError
    ? 'Stale snapshot'
    : projectionHealth.isLoading && projectionSnapshot === undefined
      ? 'Checking projection health'
      : healthSummary(snapshot, projectionSnapshot, projectionUnavailable);

  return (
    <section className="overview-posture" aria-labelledby="overview-posture-title">
      <div className="overview-section-label"><span>Split health</span><span>{summary}</span></div>
      <h2 id="overview-posture-title">API, connection, projection and throttling.</h2>
      <p>Generated {relativeTime(snapshot.generatedAt) || 'at an unknown time'}. A healthy API does not imply that every WhatsApp instance is connected or ready.</p>
      <div className="overview-posture-reads" aria-label="Platform health dimensions">
        <div className="overview-posture-read">
          <span className={`dot ${dot(snapshot.api.status)}`} aria-hidden="true" />
          <span><strong>API</strong><small>{label(snapshot.api.status)}</small></span>
        </div>
        <div className="overview-posture-read">
          <span className={`dot ${projectionHealth.isLoading && projectionSnapshot === undefined ? 'dot-pending' : projectionUnavailable ? 'dot-muted' : dot(projectionSnapshot?.status ?? 'unknown')}`} aria-hidden="true" />
          <span><strong>Projection aggregate</strong><small>{projectionHealth.isLoading && projectionSnapshot === undefined ? 'Checking' : projectionUnavailable ? 'Unavailable' : `${label(projectionSnapshot?.status ?? 'unknown')} · ${projectionSnapshot?.total ?? '—'} resources`}</small></span>
        </div>
      </div>
      <InstanceHealthGroups instances={snapshot.instances} />
      {diagnostics.length > 0 && <OverviewDiagnostics id="overview-health-diagnostics" diagnostics={diagnostics} onRetry={() => { void Promise.all([health.refetch(), projectionHealth.refetch()]); }} />}
    </section>
  );
}
