import { ApiFailure } from '@/api/envelopes';
import { useDashboardSummary, useHealth, useHealthReadiness } from './hooks';

type HealthPosture = {
  dotClass: string;
  label: string;
  degraded?: boolean;
  title?: string;
};

function healthPosture(prefix: string, status: string | undefined): HealthPosture {
  const normalized = status?.toLowerCase();
  if (normalized === 'ok' || normalized === 'healthy') {
    return { dotClass: 'dot-ok', label: `${prefix} ${prefix === 'API' ? 'healthy' : 'ok'}` };
  }
  if (normalized === 'degraded') {
    return { dotClass: 'dot-degraded', label: `${prefix} degraded`, degraded: true };
  }
  return { dotClass: 'dot-info', label: `${prefix} ${status ?? '—'}` };
}

function failureTitle(error: unknown): string | undefined {
  if (!(error instanceof ApiFailure)) return undefined;
  return `${error.category}: ${error.message}${error.requestId ? ` · ${error.requestId}` : ''}`;
}

export function HealthStrip() {
  const health = useHealth();
  const readiness = useHealthReadiness();
  const dashboard = useDashboardSummary();

  const apiPosture: HealthPosture = health.isError
    ? { dotClass: 'dot-failed', label: 'API unreachable', degraded: false, title: failureTitle(health.error) }
    : healthPosture('API', health.data?.resource?.status);
  const readinessPosture: HealthPosture = readiness.isError
    ? { dotClass: 'dot-failed', label: 'Readiness unreachable', degraded: false, title: failureTitle(readiness.error) }
    : healthPosture('Readiness', readiness.data?.resource?.status);

  const connected = dashboard.data?.resource?.connectedInstanceCount;
  const total = dashboard.data?.resource?.instanceCount;
  const hasInstanceCounts = connected !== undefined && total !== undefined;
  const instancesPosture: HealthPosture = !hasInstanceCounts
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
            title={posture.title}
          >
            <span className={`dot ${posture.dotClass}`}></span>
            <span>{posture.label}</span>
          </span>
        ))}
      </div>
    </section>
  );
}
