import type { ProjectionMeta, ProjectionSyncStatus } from '@/api/envelopes';
import { relativeTime } from '@/lib/format';
import { SurfaceNotice } from './feedback/SurfaceNotice';
import type { FeedbackKind } from './feedback/feedback-types';

export type ProjectionPresentation = {
  kind: FeedbackKind;
  label: string;
  title: string;
  detail: string;
};

function syncedCopy(lastSyncedAt: string | undefined): string {
  const age = relativeTime(lastSyncedAt);
  return age ? `Last synchronized ${age}.` : 'The last synchronization time is unavailable.';
}

export function projectionPresentation(
  status: ProjectionSyncStatus | undefined,
  lastSyncedAt?: string,
): ProjectionPresentation | undefined {
  switch (status) {
    case undefined:
    case 'ready':
      return undefined;
    case 'syncing':
      return {
        kind: 'info',
        label: 'Projection syncing',
        title: 'Data is still synchronizing.',
        detail: 'The console will refresh when this resource becomes ready.',
      };
    case 'stale':
      return {
        kind: 'warning',
        label: 'Stale projection',
        title: 'Showing the latest stored data.',
        detail: syncedCopy(lastSyncedAt),
      };
    case 'not_started':
      return {
        kind: 'warning',
        label: 'Projection not started',
        title: 'This data source is not ready yet.',
        detail: 'No live WhatsApp lookup will be used as a fallback.',
      };
    case 'failed':
      return {
        kind: 'error',
        label: 'Projection failed',
        title: 'This data source could not synchronize.',
        detail: syncedCopy(lastSyncedAt),
      };
  }
}

export function ProjectionNotice({ meta, className }: { meta?: ProjectionMeta; className?: string }) {
  const presentation = projectionPresentation(meta?.syncStatus, meta?.lastSyncedAt);
  if (!presentation) return null;
  return <SurfaceNotice {...presentation} className={className} announcement="polite" />;
}
