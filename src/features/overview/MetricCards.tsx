import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { formatCount, relativeTime } from '@/lib/format';
import {
  useDashboardSummary,
  useMediaMetrics,
  useMessageMetrics,
  useQueueMetrics,
  isTransportFailure,
  useStableReadState,
  useWebhookMetrics,
} from './hooks';
import { OverviewDiagnostics } from './OverviewDiagnostics';

type MetricState = 'loading' | 'fresh' | 'stale' | 'unavailable' | 'error' | 'omitted';

type MetricCardModel = {
  label: string;
  value: string;
  context: string;
  contextTitle?: string;
  reporting: boolean;
  state: MetricState;
  attention?: boolean;
};

function MetricCard({ metric }: { metric: MetricCardModel }) {
  return (
    <article className="overview-metric-card" data-state={metric.state}>
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
  const dashboardState = useStableReadState(dashboard);
  const messagesState = useStableReadState(messages);
  const queueState = useStableReadState(queue);
  const webhooksState = useStableReadState(webhooks);
  const mediaState = useStableReadState(media);

  const connected = dashboard.data?.resource?.connectedInstanceCount;
  const total = dashboard.data?.resource?.instanceCount;
  const queuedJobCount = queue.data?.resource?.queuedJobCount;
  const totalJobCount = queue.data?.resource?.totalJobCount;
  const deadJobCount = queue.data?.resource?.deadJobCount;
  const dashboardPending = dashboard.data?.unavailable !== undefined;
  const queuePending = queue.data?.unavailable !== undefined;
  const messagesPending = messages.data?.unavailable !== undefined;
  const webhooksPending = webhooks.data?.unavailable !== undefined;
  const mediaPending = media.data?.unavailable !== undefined;
  const messageCount = messages.data?.resource?.count ?? messages.data?.resource?.value;
  const webhookCount = webhooks.data?.resource?.count ?? webhooks.data?.resource?.value;
  const mediaCount = media.data?.resource?.count ?? media.data?.resource?.value;
  const metricValue = ({
    value,
    query,
    pending,
    reasonCode,
  }: {
    value: number | undefined;
    query: { isInitialLoading: boolean; isError: boolean; isFetching: boolean; dataUpdatedAt: number };
    pending: boolean;
    reasonCode?: string;
  }): Pick<MetricCardModel, 'value' | 'context' | 'contextTitle' | 'reporting' | 'state'> => {
    if (value !== undefined && !pending) {
      const updated = query.dataUpdatedAt > 0
        ? relativeTime(new Date(query.dataUpdatedAt).toISOString()) || 'just now'
        : undefined;
      if (query.isError) {
        return { value: formatCount(value), context: `Stale${updated ? ` · ${updated}` : ''}`, reporting: true, state: 'stale' };
      }
      return {
        value: formatCount(value),
        context: query.isFetching ? 'Refreshing' : updated ? `Updated ${updated}` : 'Reporting',
        reporting: true,
        state: 'fresh',
      };
    }
    if (query.isInitialLoading) return { value: 'Checking', context: 'First read in progress', reporting: false, state: 'loading' };
    if (pending) return { value: 'Not reported', context: 'Data pending', contextTitle: reasonCode, reporting: false, state: 'unavailable' };
    if (query.isError) return { value: 'Not reported', context: 'Unreachable', reporting: false, state: 'error' };
    return { value: 'Not reported', context: 'Value omitted', reporting: false, state: 'omitted' };
  };

  const queueMetric = metricValue({ value: queuedJobCount, query: { ...queue, ...queueState }, pending: queuePending, reasonCode: queue.data?.unavailable?.reasonCode });
  const instanceMetric = metricValue({ value: total, query: { ...dashboard, ...dashboardState }, pending: dashboardPending, reasonCode: dashboard.data?.unavailable?.reasonCode });
  const activeMetric = metricValue({ value: connected, query: { ...dashboard, ...dashboardState }, pending: dashboardPending, reasonCode: dashboard.data?.unavailable?.reasonCode });
  const messageMetric = metricValue({ value: messageCount, query: { ...messages, ...messagesState }, pending: messagesPending, reasonCode: messages.data?.unavailable?.reasonCode });
  const webhookMetric = metricValue({ value: webhookCount, query: { ...webhooks, ...webhooksState }, pending: webhooksPending, reasonCode: webhooks.data?.unavailable?.reasonCode });
  const mediaMetric = metricValue({ value: mediaCount, query: { ...media, ...mediaState }, pending: mediaPending, reasonCode: media.data?.unavailable?.reasonCode });

  const metrics: MetricCardModel[] = [
    {
      label: 'Queue depth',
      ...queueMetric,
      context: queueMetric.reporting && deadJobCount !== undefined && deadJobCount > 0
        ? `${queueMetric.context} · ${formatCount(deadJobCount)} dead-lettered`
        : queueMetric.context,
      attention: queueMetric.reporting && deadJobCount !== undefined && deadJobCount > 0,
    },
    {
      label: 'Instances',
      ...instanceMetric,
    },
    {
      label: 'Active instances',
      ...activeMetric,
    },
    {
      label: 'Messages',
      ...messageMetric,
    },
    {
      label: 'Webhooks',
      ...webhookMetric,
    },
    {
      label: 'Media',
      ...mediaMetric,
    },
  ];
  const reportingCount = metrics.filter((metric) => metric.reporting).length;
  const failedReads = [
    { source: 'Dashboard', query: dashboard, state: dashboardState },
    { source: 'Message metrics', query: messages, state: messagesState },
    { source: 'Queue metrics', query: queue, state: queueState },
    { source: 'Webhook metrics', query: webhooks, state: webhooksState },
    { source: 'Media metrics', query: media, state: mediaState },
  ].filter(({ state }) => state.isError);
  const readsBlockedByOrigin = failedReads.length === 5 && failedReads.every(({ state }) => isTransportFailure(state.error));
  const hasDeadLetters = queueMetric.reporting && deadJobCount !== undefined && deadJobCount > 0;
  const allQueuedJobsDead = hasDeadLetters && queuedJobCount === deadJobCount;
  const coverageTitle = reportingCount === 0
    ? 'No operational values are available.'
    : reportingCount === 1 && queueMetric.reporting
      ? 'Only queue depth is available.'
      : `${reportingCount} of ${metrics.length} operational values are available.`;

  // HealthStrip owns a whole-origin outage. Keep cached values visible, but do
  // not amplify one transport failure across every downstream dashboard read.
  if (readsBlockedByOrigin && reportingCount === 0) return null;

  return (
    <>
      <div className={`overview-command-grid${hasDeadLetters ? ' has-urgent-attention' : ''}`}>
        <section className="overview-attention" aria-labelledby="overview-attention-title">
          <div className="overview-section-label">
            <span>{hasDeadLetters ? 'Attention' : 'Queue reporting'}</span><span>{hasDeadLetters ? 'Needs review' : queueMetric.reporting ? queueMetric.state === 'stale' ? 'Stale data' : 'No dead letters' : queueMetric.context}</span>
          </div>
          <div className="overview-attention-body">
            <div>
              <h2 id="overview-attention-title">{hasDeadLetters ? 'Dead-letter queue' : 'Queue posture'}</h2>
              <p>
                {hasDeadLetters
                  ? allQueuedJobsDead
                    ? `All ${formatCount(queuedJobCount)} queued jobs are dead-lettered and require review.`
                    : `${formatCount(deadJobCount)} queued jobs are dead-lettered and require review.`
                  : queueMetric.reporting
                    ? 'No dead-lettered jobs are currently reported.'
                    : queueState.isError
                      ? 'Queue metrics cannot be reached.'
                      : 'Queue metrics have not reported yet.'}
              </p>
            </div>
            <div className="overview-attention-count" aria-label={hasDeadLetters ? `${deadJobCount} dead-lettered jobs` : 'No dead-letter count reported'}>
              <strong className="num">{hasDeadLetters ? formatCount(deadJobCount) : queueMetric.reporting ? '0' : '—'}</strong>
              <span>{hasDeadLetters ? 'dead-lettered' : queueMetric.reporting ? 'reported' : 'not reported'}</span>
            </div>
          </div>
          <div className="overview-attention-footer">
            <span><span className="num">{totalJobCount !== undefined ? formatCount(totalJobCount) : queuedJobCount !== undefined ? formatCount(queuedJobCount) : '—'}</span> {totalJobCount !== undefined ? 'total jobs tracked' : 'queued jobs'}</span>
            <Link className="btn" to="/queue">Review queue</Link>
          </div>
        </section>

        {actionRequired}

        <section className="overview-coverage" aria-labelledby="overview-coverage-title">
          <div className="overview-section-label"><span>Metric coverage</span><span className="num">{reportingCount} of {metrics.length} values</span></div>
          <h2 id="overview-coverage-title">{coverageTitle}</h2>
          <p>Unavailable values stay unreported until their sources respond.</p>
          <div className="overview-coverage-bar" role="img" aria-label={`${reportingCount} of ${metrics.length} operational values are available`}>
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
        <OverviewDiagnostics
          id="overview-metric-diagnostics"
          diagnostics={readsBlockedByOrigin ? [] : failedReads.map(({ source, state }) => ({ source, error: state.error }))}
          onRetry={() => { void Promise.all(failedReads.map(({ query }) => query.refetch())); }}
        />
      </section>
    </>
  );
}
