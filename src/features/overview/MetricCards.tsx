import { formatCount } from '@/lib/format';
import { InlineError } from './InlineError';
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

  const connected = dashboard.data?.connectedInstanceCount;
  const total = dashboard.data?.instanceCount;
  const disconnected = connected !== undefined && total !== undefined ? total - connected : undefined;

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
        </article>
        <article className="card overview-metric-card">
          <div className="label">Messages</div>
          <div className="value num">
            {messages.isError ? '—' : formatCount(messages.data?.count ?? messages.data?.value)}
          </div>
        </article>
        <article className="card overview-metric-card">
          <div className="label">Queue depth</div>
          <div className="value num">
            {queue.isError ? '—' : formatCount(queue.data?.queuedJobCount)}
          </div>
          {!queue.isError && queue.data?.deadJobCount !== undefined && queue.data.deadJobCount > 0 && (
            <div className="ctx warn num">{formatCount(queue.data.deadJobCount)} dead-lettered</div>
          )}
        </article>
        <article className="card overview-metric-card">
          <div className="label">Webhooks</div>
          <div className="value num">
            {webhooks.isError ? '—' : formatCount(webhooks.data?.count ?? webhooks.data?.value)}
          </div>
        </article>
        <article className="card overview-metric-card">
          <div className="label">Media</div>
          <div className="value num">
            {media.isError ? '—' : formatCount(media.data?.count ?? media.data?.value)}
          </div>
        </article>
      </div>
      {dashboard.isError && (
        <InlineError error={dashboard.error} onRetry={dashboard.refetch} />
      )}
      {messages.isError && (
        <InlineError error={messages.error} onRetry={messages.refetch} />
      )}
      {queue.isError && <InlineError error={queue.error} onRetry={queue.refetch} />}
      {webhooks.isError && (
        <InlineError error={webhooks.error} onRetry={webhooks.refetch} />
      )}
      {media.isError && <InlineError error={media.error} onRetry={media.refetch} />}
    </section>
  );
}
