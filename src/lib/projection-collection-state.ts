import type { ProjectionSyncStatus } from '@/api/envelopes';

export type ProjectionCollectionState = 'not_ready' | 'error' | 'loading' | 'syncing' | 'unavailable' | 'empty' | 'ready';

export function projectionCollectionState(input: {
  errorCode?: string;
  hasInitialError: boolean;
  hasResource: boolean;
  isInitialLoading: boolean;
  itemCount: number;
  projectionStatus?: ProjectionSyncStatus;
  readinessAdvertised: boolean;
  unavailable: boolean;
}): ProjectionCollectionState {
  if (!input.hasResource && input.errorCode === 'projection_not_ready') return 'not_ready';
  if (input.hasInitialError) return 'error';
  if (input.isInitialLoading) return 'loading';
  if (input.itemCount === 0 && input.projectionStatus === 'syncing') return 'syncing';
  if (
    input.itemCount === 0
    && (
      input.unavailable
      || input.projectionStatus === 'not_started'
      || input.projectionStatus === 'failed'
      || (input.projectionStatus === undefined && !input.readinessAdvertised)
    )
  ) return 'unavailable';
  return input.itemCount === 0 ? 'empty' : 'ready';
}
