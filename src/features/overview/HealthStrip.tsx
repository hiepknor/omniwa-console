import { useHealth, useHealthReadiness } from './hooks';
import { OverviewDiagnostics, type OverviewDiagnostic } from './OverviewDiagnostics';

function isPositive(status: string | undefined): boolean {
  const normalized = status?.toLowerCase();
  return normalized === 'ok' || normalized === 'healthy' || normalized === 'alive' || normalized === 'ready';
}

function displayStatus(status: string | undefined, fallback: string): string {
  if (!status) return fallback;
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function HealthStrip() {
  const health = useHealth();
  const readiness = useHealthReadiness();
  const apiStale = health.isError && health.data?.resource?.status !== undefined;
  const readinessStale = readiness.isError && readiness.data?.resource?.status !== undefined;
  const apiHealthy = isPositive(health.data?.resource?.status);
  const readinessHealthy = isPositive(readiness.data?.resource?.status);
  const readinessPending = readiness.isLoading || (!readiness.isError && !readiness.data?.resource?.status);
  const apiStatus = apiStale ? `${displayStatus(health.data?.resource?.status, 'Unknown')} · Stale` : health.isError ? 'Unreachable' : displayStatus(health.data?.resource?.status, 'Pending');
  const readinessStatus = readinessStale ? `${displayStatus(readiness.data?.resource?.status, 'Unknown')} · Stale` : readiness.isError ? 'Unreachable' : displayStatus(readiness.data?.resource?.status, 'Pending');
  const summary = health.isError && !apiStale
    ? 'Not observable'
    : apiStale || readinessStale
      ? 'Stale posture'
    : apiHealthy && readinessHealthy
      ? 'Operational'
      : apiHealthy && readinessPending
        ? 'Posture pending'
      : apiHealthy
        ? 'Partially observable'
        : 'Posture pending';
  const heading = health.isError && !apiStale
    ? 'The API cannot be reached.'
    : apiStale || readinessStale
      ? 'Last-known platform posture is stale.'
    : apiHealthy && readinessHealthy
      ? 'The API is responding and the platform is ready.'
      : apiHealthy && readinessPending
        ? 'The API is responding. Readiness is still pending.'
      : apiHealthy
        ? 'The API is responding. Readiness cannot be reached.'
        : 'Platform posture is still being determined.';
  const detail = health.isError && !apiStale
    ? 'The console cannot read platform posture until the API responds.'
    : apiStale || readinessStale
      ? 'The console is preserving the last successful health reads because a refresh failed.'
    : apiHealthy && readinessHealthy
      ? 'The console can reach the API and confirm that the platform is ready to process work.'
      : apiHealthy && readinessPending
        ? 'The console is waiting for the readiness probe before reporting platform posture.'
      : apiHealthy
        ? 'Commands can reach the API, but the console cannot confirm that the platform is ready to process work.'
        : 'Health reads have not reported a conclusive platform posture yet.';
  const diagnostics: OverviewDiagnostic[] = [];
  if (health.isError) diagnostics.push({ source: 'API health', error: health.error });
  if (readiness.isError) diagnostics.push({ source: 'Readiness', error: readiness.error });

  return (
    <section className="overview-posture" aria-labelledby="overview-posture-title">
      <div className="overview-section-label"><span>Platform posture</span><span>{summary}</span></div>
      <h2 id="overview-posture-title">{heading}</h2>
      <p>{detail}</p>
      <div className="overview-posture-reads" aria-label="Platform posture reads">
        <div className="overview-posture-read">
          <span className={`dot ${apiStale ? 'dot-pending' : health.isError ? 'dot-failed' : apiHealthy ? 'dot-ok' : 'dot-info'}`} aria-hidden="true"></span>
          <span><strong>API</strong><small>{apiStatus}</small></span>
        </div>
        <div className="overview-posture-read overview-posture-read-unreachable">
          <span className={`dot ${readinessStale ? 'dot-pending' : readiness.isError ? 'dot-degraded' : readinessHealthy ? 'dot-ok' : 'dot-info'}`} aria-hidden="true"></span>
          <span><strong>Readiness</strong><small>{readinessStatus}</small></span>
        </div>
      </div>
      <OverviewDiagnostics
        id="overview-health-diagnostics"
        diagnostics={diagnostics}
        onRetry={() => { void Promise.all([health.refetch(), readiness.refetch()]); }}
      />
    </section>
  );
}
