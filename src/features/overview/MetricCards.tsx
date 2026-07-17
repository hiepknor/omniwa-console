import { ApiFailure } from '@/api/envelopes';
import { formatCount } from '@/lib/format';
import {
  useDashboardSummary,
  useMediaMetrics,
  useMessageMetrics,
  useQueueMetrics,
  useWebhookMetrics,
} from './hooks';

export function MetricCards() {
  const dashboard = useDashboardSummary();
  const messages = useMessageMetrics();
  const queue = useQueueMetrics();
  const webhooks = useWebhookMetrics();
  const media = useMediaMetrics();

  const connected = dashboard.data?.resource?.connectedInstanceCount;
  const total = dashboard.data?.resource?.instanceCount;
  const disconnected = connected !== undefined && total !== undefined ? total - connected : undefined;
  const queries = [dashboard, messages, queue, webhooks, media];
  const failingQueries = queries.filter((query) => query.isError);
  const firstError = failingQueries[0]?.error;
  const failure = firstError instanceof ApiFailure ? firstError : undefined;
  const errorMessage = firstError instanceof Error ? firstError.message : 'Request failed';

  return (
    <section className="overview-metric-section" aria-labelledby="overview-metrics-title">
      <h2 id="overview-metrics-title">Key metrics</h2>
      <div className="metrics overview-metrics">
        <article className="card overview-metric-card">
          <div className="label">Active instances</div>
          <div className="value num">
            {dashboard.isError || connected === undefined || total === undefined
              ? '—'
              : `${formatCount(connected)} / ${formatCount(total)}`}
          </div>
          {disconnected !== undefined && disconnected > 0 && !dashboard.isError && (
            <div className="ctx">{formatCount(disconnected)} disconnected</div>
          )}
          {dashboard.data?.unavailable && (
            <div className="ctx" title={dashboard.data.unavailable.reasonCode}>No data yet</div>
          )}
          {dashboard.isError && <div className="ctx">Unreachable</div>}
        </article>
        <article className="card overview-metric-card">
          <div className="label">Messages</div>
          <div className="value num">
            {messages.isError ? '—' : formatCount(messages.data?.resource?.count ?? messages.data?.resource?.value)}
          </div>
          {messages.data?.unavailable && (
            <div className="ctx" title={messages.data.unavailable.reasonCode}>No data yet</div>
          )}
          {messages.isError && <div className="ctx">Unreachable</div>}
        </article>
        <article className="card overview-metric-card">
          <div className="label">Queue depth</div>
          <div className="value num">
            {queue.isError ? '—' : formatCount(queue.data?.resource?.queuedJobCount)}
          </div>
          {!queue.isError && queue.data?.resource?.deadJobCount !== undefined && queue.data.resource.deadJobCount > 0 && (
            <div className="ctx warn num">{formatCount(queue.data.resource.deadJobCount)} dead-lettered</div>
          )}
          {queue.data?.unavailable && (
            <div className="ctx" title={queue.data.unavailable.reasonCode}>No data yet</div>
          )}
          {queue.isError && <div className="ctx">Unreachable</div>}
        </article>
        <article className="card overview-metric-card">
          <div className="label">Webhooks</div>
          <div className="value num">
            {webhooks.isError ? '—' : formatCount(webhooks.data?.resource?.count ?? webhooks.data?.resource?.value)}
          </div>
          {webhooks.data?.unavailable && (
            <div className="ctx" title={webhooks.data.unavailable.reasonCode}>No data yet</div>
          )}
          {webhooks.isError && <div className="ctx">Unreachable</div>}
        </article>
        <article className="card overview-metric-card">
          <div className="label">Media</div>
          <div className="value num">
            {media.isError ? '—' : formatCount(media.data?.resource?.count ?? media.data?.resource?.value)}
          </div>
          {media.data?.unavailable && (
            <div className="ctx" title={media.data.unavailable.reasonCode}>No data yet</div>
          )}
          {media.isError && <div className="ctx">Unreachable</div>}
        </article>
      </div>
      {firstError !== undefined && (
        <div className="overview-error" role="alert">
          <span>
            {failure?.category ?? 'unknown'}: {errorMessage}
            {failure?.requestId && <span className="mono"> · {failure.requestId}</span>}
            {failingQueries.length > 1 && ` · ${failingQueries.length} sections affected`}
          </span>
          {failure?.retryable && (
            <button
              className="btn sm"
              type="button"
              onClick={() => { void Promise.all(failingQueries.map((query) => query.refetch())); }}
            >
              Retry
            </button>
          )}
        </div>
      )}
    </section>
  );
}
