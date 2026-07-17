import { InlineError } from './InlineError';
import { useDashboardSummary, useHealth, useHealthReadiness } from './hooks';

function healthPosture(prefix: string, status: string | undefined) {
  const normalized = status?.toLowerCase();
  if (normalized === 'ok' || normalized === 'healthy') {
    return { dotClass: 'dot-ok', label: `${prefix} ${prefix === 'API' ? 'healthy' : 'ok'}` };
  }
  if (normalized === 'degraded') {
    return { dotClass: 'dot-degraded', label: `${prefix} degraded`, degraded: true };
  }
  return { dotClass: 'dot-info', label: `${prefix} ${status ?? '—'}` };
}

export function HealthStrip() {
  const health = useHealth();
  const readiness = useHealthReadiness();
  const dashboard = useDashboardSummary();

  const apiPosture = health.isError
    ? { dotClass: 'dot-failed', label: 'API unreachable' }
    : healthPosture('API', health.data?.status);
  const readinessPosture = readiness.isError
    ? { dotClass: 'dot-failed', label: 'Readiness unreachable' }
    : healthPosture('Readiness', readiness.data?.status);

  const connected = dashboard.data?.connectedInstanceCount;
  const total = dashboard.data?.instanceCount;
  const hasInstanceCounts = connected !== undefined && total !== undefined;
  const instancesPosture = !hasInstanceCounts
    ? { dotClass: 'dot-info', label: 'Instances —' }
    : connected === total
      ? { dotClass: 'dot-ok', label: `Instances ${connected}/${total} connected` }
      : {
          dotClass: 'dot-pending',
          label: `${connected}/${total} connected`,
          degraded: true,
        };

  return (
    <section className="overview-health" aria-labelledby="overview-health-title">
      <h2 id="overview-health-title">Health</h2>
      <div className="health" aria-label="System health posture">
        {[apiPosture, readinessPosture, instancesPosture].map((posture) => (
          <span
            className={`health-item${posture.degraded ? ' health-item-degraded' : ''}`}
            key={posture.label}
          >
            <span className={`dot ${posture.dotClass}`}></span>
            <span>{posture.label}</span>
          </span>
        ))}
      </div>
      {health.isError && <InlineError error={health.error} onRetry={health.refetch} />}
      {readiness.isError && (
        <InlineError error={readiness.error} onRetry={readiness.refetch} />
      )}
      {dashboard.isError && (
        <InlineError error={dashboard.error} onRetry={dashboard.refetch} />
      )}
    </section>
  );
}
