import { ApiFailure } from '@/api/envelopes';
import { useHealth, useHealthReadiness } from './hooks';

function isPositive(status: string | undefined): boolean {
  const normalized = status?.toLowerCase();
  return normalized === 'ok' || normalized === 'healthy' || normalized === 'alive' || normalized === 'ready';
}

function displayStatus(status: string | undefined, fallback: string): string {
  if (!status) return fallback;
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function failureTitle(error: unknown): string | undefined {
  if (!(error instanceof ApiFailure)) return undefined;
  return `${error.category}: ${error.message}${error.requestId ? ` · ${error.requestId}` : ''}`;
}

export function HealthStrip() {
  const health = useHealth();
  const readiness = useHealthReadiness();
  const apiHealthy = !health.isError && isPositive(health.data?.resource?.status);
  const readinessHealthy = !readiness.isError && isPositive(readiness.data?.resource?.status);
  const readinessPending = readiness.isLoading || (!readiness.isError && !readiness.data?.resource?.status);
  const apiStatus = health.isError ? 'Unreachable' : displayStatus(health.data?.resource?.status, 'Pending');
  const readinessStatus = readiness.isError ? 'Unreachable' : displayStatus(readiness.data?.resource?.status, 'Pending');
  const summary = health.isError
    ? 'Not observable'
    : apiHealthy && readinessHealthy
      ? 'Operational'
      : apiHealthy && readinessPending
        ? 'Posture pending'
      : apiHealthy
        ? 'Partially observable'
        : 'Posture pending';
  const heading = health.isError
    ? 'The API cannot be reached.'
    : apiHealthy && readinessHealthy
      ? 'The API is responding and the platform is ready.'
      : apiHealthy && readinessPending
        ? 'The API is responding. Readiness is still pending.'
      : apiHealthy
        ? 'The API is responding. Readiness cannot be reached.'
        : 'Platform posture is still being determined.';
  const detail = health.isError
    ? 'The console cannot read platform posture until the API responds.'
    : apiHealthy && readinessHealthy
      ? 'The console can reach the API and confirm that the platform is ready to process work.'
      : apiHealthy && readinessPending
        ? 'The console is waiting for the readiness probe before reporting platform posture.'
      : apiHealthy
        ? 'Commands can reach the API, but the console cannot confirm that the platform is ready to process work.'
        : 'Health reads have not reported a conclusive platform posture yet.';

  return (
    <section className="overview-posture" aria-labelledby="overview-posture-title">
      <div className="overview-section-label"><span>Platform posture</span><span>{summary}</span></div>
      <h2 id="overview-posture-title">{heading}</h2>
      <p>{detail}</p>
      <div className="overview-posture-reads" aria-label="Platform posture reads">
        <div className="overview-posture-read" title={failureTitle(health.error)}>
          <span className={`dot ${health.isError ? 'dot-failed' : apiHealthy ? 'dot-ok' : 'dot-info'}`} aria-hidden="true"></span>
          <span><strong>API</strong><small>{apiStatus}</small></span>
        </div>
        <div className="overview-posture-read overview-posture-read-unreachable" title={failureTitle(readiness.error)}>
          <span className={`dot ${readiness.isError ? 'dot-degraded' : readinessHealthy ? 'dot-ok' : 'dot-info'}`} aria-hidden="true"></span>
          <span><strong>Readiness</strong><small>{readinessStatus}</small></span>
        </div>
      </div>
    </section>
  );
}
