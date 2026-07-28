import { useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApiSession } from '@/api/ApiProvider';
import { useServerCapabilities } from '@/api/CapabilitiesProvider';
import type { ProjectionFailure } from '@/api/recovery';
import { ApiFailureNotice } from '@/components/ApiFailureNotice';
import { humanizeToken } from '@/lib/format';
import { useResilientReadState } from '@/lib/query-state';
import { updateSearchParams } from '@/lib/url-search-state';
import { useInvalidCursorReset } from '@/lib/useInvalidCursorReset';
import { PageHeader, StateNotice } from '@/ui';
import { useDiscardProjectionFailure, useProjectionFailures, useReplayProjectionFailure } from './hooks';
import { recoveryFiltersFromSearch } from './route-state';
import { failureIdentity, RecoveryView } from './RecoveryView';
import { RecoveryCommandDialog, RecoveryInspector, type RecoveryAction } from './RecoveryInspector';


function Blocked({ detail, title }: { detail: string; title: string }) {
  return (
    <div className="grid gap-6 p-6 max-sm:p-4">
      <PageHeader eyebrow="Platform" title="Projection recovery" description="Review failed projections and submit audited recovery actions." />
      <StateNotice kind="empty" title={title} detail={detail} />
    </div>
  );
}

export function RecoveryPage() {
  const session = useApiSession();
  const capabilities = useServerCapabilities();
  const capabilityReady = capabilities.data?.capabilities.includes('projection_failure_operations') ?? false;
  const enabled = session.keyKind === 'admin' && capabilityReady;
  const commandsEnabled = capabilityReady && !capabilities.isError;
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = recoveryFiltersFromSearch(searchParams);
  const [instanceDraft, setInstanceDraft] = useState(filters.instanceId ?? '');
  const [resourceDraft, setResourceDraft] = useState(filters.resource ?? '');
  const query = useProjectionFailures(filters, enabled);
  const state = useResilientReadState(query);
  const replay = useReplayProjectionFailure();
  const discard = useDiscardProjectionFailure();
  const [action, setAction] = useState<RecoveryAction>();
  const [reason, setReason] = useState('');
  const selected = query.data?.items.find((item) =>
    item.instanceId === searchParams.get('failureInstance')
    && item.resource === searchParams.get('failureResource')
    && item.eventKey === searchParams.get('failureEvent'));
  const activeMutation = action === 'discard' ? discard : replay;
  const pending = replay.isPending || discard.isPending;
  const acknowledgement = replay.data ?? discard.data;
  const commandError = replay.error ?? discard.error;

  useEffect(() => setInstanceDraft(filters.instanceId ?? ''), [filters.instanceId]);
  useEffect(() => setResourceDraft(filters.resource ?? ''), [filters.resource]);

  const updateFilters = (updates: Record<string, string | undefined>, replace = true) => {
    const scopeChanged = 'instanceId' in updates || 'resource' in updates || 'limit' in updates;
    const next = updateSearchParams(searchParams, updates, scopeChanged ? ['cursor', 'failureInstance', 'failureResource', 'failureEvent'] : []);
    setSearchParams(next, { replace });
  };
  const selectFailure = (failure: ProjectionFailure | undefined) => {
    updateFilters({ failureInstance: failure?.instanceId, failureResource: failure?.resource, failureEvent: failure?.eventKey }, failure === undefined);
  };
  const openCommand = (nextAction: RecoveryAction) => { if (!commandsEnabled) return; replay.reset(); discard.reset(); setReason(''); setAction(nextAction); };
  const applyFilters = (event: FormEvent) => {
    event.preventDefault();
    updateFilters({ instanceId: instanceDraft.trim() || undefined, resource: resourceDraft.trim() || undefined });
  };
  const submitCommand = () => {
    if (!selected || !action || reason.trim().length < 8 || pending) return;
    activeMutation.mutate(
      { eventKey: selected.eventKey, instanceId: selected.instanceId, resource: selected.resource, reason: reason.trim() },
      { onSuccess: () => { setAction(undefined); selectFailure(undefined); } },
    );
  };
  useInvalidCursorReset(query.error, filters.cursor, () => updateFilters({ cursor: undefined, failureInstance: undefined, failureResource: undefined, failureEvent: undefined }));

  if (session.keyKind !== 'admin') return <Blocked title="Admin credential required" detail="Projection recovery requires an admin credential. No recovery request was sent." />;
  if (capabilities.isPending && !capabilities.data) return <Blocked title="Discovering capabilities" detail="Waiting for server capability discovery before reading failures." />;
  if (capabilities.isError && !capabilities.data) return (
    <div className="grid gap-6 p-6 max-sm:p-4">
      <PageHeader eyebrow="Platform" title="Projection recovery" description="Review failed projections and submit audited recovery actions." />
      <ApiFailureNotice error={capabilities.error} title="Capability discovery failed" onRetry={() => capabilities.refetch()} />
    </div>
  );
  if (!capabilityReady) return <Blocked title="Unsupported" detail="The last successful capability snapshot does not advertise projection_failure_operations." />;

  return (
    <>
      <RecoveryView
        refreshing={query.isFetching}
        onRefresh={() => query.refetch()}
        notices={
          <div className="grid gap-2">
            {capabilities.isError ? <ApiFailureNotice error={capabilities.error} title="Showing last known capabilities" onRetry={() => capabilities.refetch()} /> : null}
            {acknowledgement ? (
              <StateNotice kind="info" title={`${humanizeToken(acknowledgement.action, 'Command')} accepted`} detail={`Acknowledged for ${acknowledgement.resource ?? 'the selected resource'} / ${acknowledgement.eventKey ?? 'event'}. Acknowledgement does not prove projection recovery.`} />
            ) : null}
            {state.isError ? (
              <ApiFailureNotice error={state.error} title="Read failed" onRetry={() => query.refetch()} retryLabel="Retry read" />
            ) : null}
          </div>
        }
        instanceDraft={instanceDraft}
        resourceDraft={resourceDraft}
        onInstanceDraft={setInstanceDraft}
        onResourceDraft={setResourceDraft}
        limit={filters.limit}
        onLimit={(v) => updateFilters({ limit: v === '50' ? undefined : v })}
        onApply={applyFilters}
        initialLoading={state.isInitialLoading}
        empty={query.data?.items.length === 0}
        items={query.data?.items ?? []}
        selectedKey={selected ? failureIdentity(selected) : undefined}
        onSelect={selectFailure}
        cursor={filters.cursor}
        nextCursor={query.data?.nextCursor}
        onCursor={(value) => updateFilters({ cursor: value, failureInstance: undefined, failureResource: undefined, failureEvent: undefined }, false)}
      />

      <RecoveryInspector failure={selected} commandsEnabled={commandsEnabled} onClose={() => selectFailure(undefined)} onAction={openCommand} />
      <RecoveryCommandDialog failure={selected} action={action} reason={reason} pending={pending} error={commandError} onReason={setReason} onClose={() => setAction(undefined)} onSubmit={submitCommand} />
    </>
  );
}
