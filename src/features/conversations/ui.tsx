import type { ProjectionMeta } from '@/api/envelopes';
import { ApiFailure } from '@/api/envelopes';
import { ApiFailureNotice } from '@/components/ApiFailureNotice';
import { relativeTime } from '@/lib/format';
import { Status, type Tone } from '@/ui';

export function FailureNotice({ error, stale, command, onRetry }: { error: unknown; stale?: boolean; command?: boolean; onRetry?: () => void }) {
  const failure = error instanceof ApiFailure ? error : undefined;
  const notReady = !command && failure?.code === 'projection_not_ready';
  const title = command ? 'Command failed' : notReady ? 'Projection not ready' : stale ? 'Showing last known data' : 'Read failed';
  return <ApiFailureNotice error={error} kind={notReady ? 'empty' : 'error'} title={title} onRetry={notReady ? undefined : onRetry} />;
}

export function ProjectionStatus({ meta }: { meta?: ProjectionMeta }) {
  if (!meta?.syncStatus) return null;
  const tone: Tone = meta.syncStatus === 'ready' ? 'ok' : meta.syncStatus === 'failed' ? 'failed' : meta.syncStatus === 'stale' ? 'degraded' : 'pending';
  return (
    <div className="flex items-center justify-between gap-3 py-2 text-xs text-fg-3">
      <Status tone={tone}>Projection {meta.syncStatus.replace('_', ' ')}</Status>
      <span>{meta.lastSyncedAt ? `Last synced ${relativeTime(meta.lastSyncedAt)}` : 'Sync time not reported'}</span>
    </div>
  );
}
