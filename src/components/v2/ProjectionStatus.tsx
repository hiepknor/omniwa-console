import type { ProjectionMeta } from '@/api/envelopes';
import { relativeTime } from '@/lib/format';
import { Status } from './primitives';

export function ProjectionStatus({ meta }: { meta?: ProjectionMeta }) {
  if (!meta?.syncStatus) return null;
  const tone = meta.syncStatus === 'ready' ? 'healthy' : meta.syncStatus === 'failed' ? 'failed' : meta.syncStatus === 'stale' ? 'degraded' : 'pending';
  return <div className="ui-v2-projection-status"><Status tone={tone}>Projection {meta.syncStatus.replace('_', ' ')}</Status><span>{meta.lastSyncedAt ? `Last synced ${relativeTime(meta.lastSyncedAt)}` : 'Sync time not reported'}</span></div>;
}
