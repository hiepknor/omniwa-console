import type { ProjectionMeta } from '@/api/envelopes';
import { ApiFailure } from '@/api/envelopes';
import { relativeTime } from '@/lib/format';
import { Status, type Tone } from '@/ui';
import { ApiFailureNotice } from './ApiFailureNotice';

export function ProjectionFailureNotice({ error, stale, command, onRetry }: { error: unknown; stale?: boolean; command?: boolean; onRetry?: () => void }) {
  const failure = error instanceof ApiFailure ? error : undefined;
  const notReady = !command && failure?.code === 'projection_not_ready';
  const title = command ? 'Command failed' : notReady ? 'Projection not ready' : stale ? 'Showing last known data' : 'Read failed';
  return <ApiFailureNotice error={error} kind={notReady ? 'empty' : 'error'} title={title} onRetry={notReady ? undefined : onRetry} />;
}
export function ProjectionStatus({ meta, label = 'Projection' }: { meta?: ProjectionMeta; label?: string }) {
  if (!meta?.syncStatus) return null;
  const tone: Tone = meta.syncStatus === 'ready' ? 'ok' : meta.syncStatus === 'failed' ? 'failed' : meta.syncStatus === 'stale' ? 'degraded' : 'pending';
  return <div className="flex items-center justify-between gap-3 py-2 text-xs text-fg-3"><Status tone={tone}>{label} {meta.syncStatus.replace('_', ' ')}</Status><span>{meta.lastSyncedAt ? `Last synced ${relativeTime(meta.lastSyncedAt)}` : 'Sync time not reported'}</span></div>;
}

export function ProjectionStatusGroup({ entries }: { entries: { label: string; meta?: ProjectionMeta }[] }) {
  const reported = entries.filter((entry): entry is { label: string; meta: ProjectionMeta } => Boolean(entry.meta?.syncStatus));
  if (!reported.length) return null;
  if (reported.length > 1 && reported.every((entry) => entry.meta.syncStatus === 'ready')) {
    return <div className="flex flex-wrap items-center justify-between gap-3 py-2 text-xs text-fg-3"><Status tone="ok">{reported.map((entry) => entry.label).join(' + ')} ready</Status><span>{reported.map((entry) => `${entry.label} sync ${entry.meta.lastSyncedAt ? relativeTime(entry.meta.lastSyncedAt) : 'time unreported'}`).join(' · ')}</span></div>;
  }
  return <div className="grid">{reported.map((entry) => <ProjectionStatus key={entry.label} label={`${entry.label} projection`} meta={entry.meta} />)}</div>;
}
