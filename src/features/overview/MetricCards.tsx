import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ApiFailure } from '@/api/envelopes';
import { formatCount } from '@/lib/format';
import {
  useDashboardSummary,
  useMediaMetrics,
  useMessageMetrics,
  useQueueMetrics,
  useWebhookMetrics,
} from './hooks';

type MetricCardModel = {
  label: string;
  value: string;
  context: string;
  contextTitle?: string;
  reporting: boolean;
  attention?: boolean;
};

function MetricCard({ metric }: { metric: MetricCardModel }) {
  return (
    <article className={`overview-metric-card${metric.reporting ? ' overview-metric-card-reported' : ''}`}>
      <div className="label">{metric.label}</div>
      <div className={`value${metric.reporting ? ' num' : ' overview-value-unavailable'}`}>{metric.value}</div>
      <div className="ctx" title={metric.contextTitle}>
        {metric.attention && <span className="dot dot-failed"></span>}
        <span>{metric.context}</span>
      </div>
    </article>
  );
}

export function MetricCards({ actionRequired }: { actionRequired: ReactNode }) {
  const dashboard = useDashboardSummary();
  const messages = useMessageMetrics();
  const queue = useQueueMetrics();
  const webhooks = useWebhookMetrics();
  const media = useMediaMetrics();

  const connected = dashboard.data?.resource?.connectedInstanceCount;
  const total = dashboard.data?.resource?.instanceCount;
  const queuedJobCount = queue.data?.resource?.queuedJobCount;
  const deadJobCount = queue.data?.resource?.deadJobCount;
  const dashboardPending = dashboard.data?.unavailable !== undefined;
  const queuePending = queue.data?.unavailable !== undefined;
  const messagesPending = messages.data?.unavailable !== undefined;
  const webhooksPending = webhooks.data?.unavailable !== undefined;
  const mediaPending = media.data?.unavailable !== undefined;
  const instanceReporting = !dashboard.isError && !dashboardPending && total !== undefined;
  const activeReporting = !dashboard.isError && !dashboardPending && connected !== undefined;
  const messageCount = messages.data?.resource?.count ?? messages.data?.resource?.value;
  const webhookCount = webhooks.data?.resource?.count ?? webhooks.data?.resource?.value;
  const mediaCount = media.data?.resource?.count ?? media.data?.resource?.value;
  const queueReporting = !queue.isError && !queuePending && queuedJobCount !== undefined;

  function pendingValue(isError: boolean, pending: boolean, reasonCode?: string) {
    return {
      value: 'Not reported',
      context: isError ? 'Unreachable' : pending ? 'Data pending' : 'Value omitted',
      contextTitle: reasonCode,
    };
  }

  const metrics: MetricCardModel[] = [
    {
      label: 'Queue depth',
      ...(queueReporting
        ? {
            value: formatCount(queuedJobCount),
            context: deadJobCount !== undefined && deadJobCount > 0
              ? `Reporting · ${formatCount(deadJobCount)} dead-lettered`
              : 'Reporting',
          }
        : pendingValue(queue.isError, queuePending, queue.data?.unavailable?.reasonCode)),
      reporting: queueReporting,
      attention: queueReporting && deadJobCount !== undefined && deadJobCount > 0,
    },
    {
      label: 'Instances',
      ...(instanceReporting
        ? { value: formatCount(total), context: 'Reporting' }
        : pendingValue(dashboard.isError, dashboardPending, dashboard.data?.unavailable?.reasonCode)),
      reporting: instanceReporting,
    },
    {
      label: 'Active instances',
      ...(activeReporting
        ? { value: formatCount(connected), context: 'Reporting' }
        : pendingValue(dashboard.isError, dashboardPending, dashboard.data?.unavailable?.reasonCode)),
      reporting: activeReporting,
    },
    {
      label: 'Messages',
      ...(!messages.isError && !messagesPending && messageCount !== undefined
        ? { value: formatCount(messageCount), context: 'Reporting' }
        : pendingValue(messages.isError, messagesPending, messages.data?.unavailable?.reasonCode)),
      reporting: !messages.isError && !messagesPending && messageCount !== undefined,
    },
    {
      label: 'Webhooks',
      ...(!webhooks.isError && !webhooksPending && webhookCount !== undefined
        ? { value: formatCount(webhookCount), context: 'Reporting' }
        : pendingValue(webhooks.isError, webhooksPending, webhooks.data?.unavailable?.reasonCode)),
      reporting: !webhooks.isError && !webhooksPending && webhookCount !== undefined,
    },
    {
      label: 'Media',
      ...(!media.isError && !mediaPending && mediaCount !== undefined
        ? { value: formatCount(mediaCount), context: 'Reporting' }
        : pendingValue(media.isError, mediaPending, media.data?.unavailable?.reasonCode)),
      reporting: !media.isError && !mediaPending && mediaCount !== undefined,
    },
  ];
  const reportingCount = metrics.filter((metric) => metric.reporting).length;
  const failingQueries = [dashboard, messages, queue, webhooks, media].filter((query) => query.isError);
  const firstError = failingQueries[0]?.error;
  const failure = firstError instanceof ApiFailure ? firstError : undefined;
  const errorMessage = firstError instanceof Error ? firstError.message : 'Request failed';
  const hasDeadLetters = queueReporting && deadJobCount !== undefined && deadJobCount > 0;
  const allQueuedJobsDead = hasDeadLetters && queuedJobCount === deadJobCount;
  const coverageTitle = reportingCount === 0
    ? 'No operational metrics are reporting.'
    : reportingCount === 1 && queueReporting
      ? 'Only queue depth is reporting.'
      : `${reportingCount} of ${metrics.length} operational metrics are reporting.`;

  return (
    <>
      <div className="overview-command-grid">
        <section className={`overview-attention${hasDeadLetters ? ' is-urgent' : ''}`} aria-labelledby="overview-attention-title">
          <div className="overview-section-label">
            <span>Attention</span><span>{hasDeadLetters ? 'Needs review' : queueReporting ? 'No dead letters' : 'Data pending'}</span>
          </div>
          <div className="overview-attention-body">
            <div>
              <h2 id="overview-attention-title">{hasDeadLetters ? 'Dead-letter queue' : 'Queue posture'}</h2>
              <p>
                {hasDeadLetters
                  ? allQueuedJobsDead
                    ? `All ${formatCount(queuedJobCount)} queued jobs are dead-lettered and require review.`
                    : `${formatCount(deadJobCount)} queued jobs are dead-lettered and require review.`
                  : queueReporting
                    ? 'No dead-lettered jobs are currently reported.'
                    : queue.isError
                      ? 'Queue metrics cannot be reached.'
                      : 'Queue metrics have not reported yet.'}
              </p>
            </div>
            <div className="overview-attention-count" aria-label={hasDeadLetters ? `${deadJobCount} dead-lettered jobs` : 'No dead-letter count reported'}>
              <strong className="num">{hasDeadLetters ? formatCount(deadJobCount) : queueReporting ? '0' : '—'}</strong>
              <span>{hasDeadLetters ? 'dead-lettered' : queueReporting ? 'reported' : 'not reported'}</span>
            </div>
          </div>
          <div className="overview-attention-footer">
            <span><span className="num">{queueReporting ? formatCount(queuedJobCount) : '—'}</span> total queue depth</span>
            <Link className="btn" to="/queue">Review queue</Link>
          </div>
        </section>

        {actionRequired}

        <section className="overview-coverage" aria-labelledby="overview-coverage-title">
          <div className="overview-section-label"><span>Reporting coverage</span><span className="num">{reportingCount} of {metrics.length} metrics</span></div>
          <h2 id="overview-coverage-title">{coverageTitle}</h2>
          <p>Unavailable values stay unreported until their sources respond.</p>
          <div className="overview-coverage-bar" role="img" aria-label={`${reportingCount} of ${metrics.length} operational metrics are reporting`}>
            <span style={{ width: `${(reportingCount / metrics.length) * 100}%` }}></span>
          </div>
        </section>
      </div>

      <section className="overview-metric-section" aria-labelledby="overview-metrics-title">
        <div className="overview-metric-head">
          <div><span className="overview-eyebrow">Operational metrics</span><h2 id="overview-metrics-title">Current reporting</h2></div>
          <span className="overview-metric-state">Unavailable values are not zero</span>
        </div>
        <div className="overview-metrics">
          {metrics.map((metric) => <MetricCard key={metric.label} metric={metric} />)}
        </div>
        {firstError !== undefined && (
          <div className="overview-error" role="alert">
            <span>
              {failure?.category ?? 'unknown'}: {errorMessage}
              {failure?.requestId && <span className="mono"> · {failure.requestId}</span>}
              {failingQueries.length > 1 && ` · ${failingQueries.length} sections affected`}
            </span>
            {failure?.retryable && (
              <button className="btn sm" type="button" onClick={() => { void Promise.all(failingQueries.map((query) => query.refetch())); }}>
                Retry
              </button>
            )}
          </div>
        )}
      </section>
    </>
  );
}
