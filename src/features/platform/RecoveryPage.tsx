import { useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApiSession } from '@/api/ApiProvider';
import { useServerCapabilities } from '@/api/CapabilitiesProvider';
import type { ProjectionFailure } from '@/api/recovery';
import { ApiFailure } from '@/api/envelopes';
import { humanizeToken, relativeTime } from '@/lib/format';
import { useResilientReadState } from '@/lib/query-state';
import { updateSearchParams } from '@/lib/url-search-state';
import { useInvalidCursorReset } from '@/lib/useInvalidCursorReset';
import { Button, DescriptionItem, DescriptionList, Dialog, Drawer, Field, Input, PageHeader, StateNotice, Status } from '@/ui';
import { failureDetail, failureRequestId } from './state';
import { useDiscardProjectionFailure, useProjectionFailures, useReplayProjectionFailure } from './hooks';
import { recoveryFiltersFromSearch } from './route-state';
import { failureIdentity, RecoveryView } from './RecoveryView';

type RecoveryAction = 'replay' | 'discard';

function Blocked({ detail, title }: { detail: string; title: string }) {
  return (
    <div className="grid gap-6 p-6 max-sm:p-4">
      <PageHeader eyebrow="Platform" title="Projection recovery" description="Inspect and operate terminal projection failures." />
      <StateNotice kind="empty" title={title} detail={detail} />
    </div>
  );
}

function Fact({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return <DescriptionItem label={label} mono={mono}>{value}</DescriptionItem>;
}

export function RecoveryPage() {
  const session = useApiSession();
  const capabilities = useServerCapabilities();
  const capabilityReady = capabilities.data?.capabilities.includes('projection_failure_operations') ?? false;
  const enabled = session.keyKind === 'admin' && capabilityReady;
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
  const readRateLimited = state.error instanceof ApiFailure && state.error.category === 'rate_limited';

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
  const openCommand = (nextAction: RecoveryAction) => { replay.reset(); discard.reset(); setReason(''); setAction(nextAction); };
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
  if (capabilities.isPending) return <Blocked title="Discovering capabilities" detail="Waiting for server capability discovery before reading failures." />;
  if (!capabilityReady) return <Blocked title="Unsupported" detail={capabilities.isError ? 'Capability discovery failed; recovery remains disabled.' : 'The server does not advertise projection_failure_operations.'} />;

  return (
    <>
      <RecoveryView
        refreshing={query.isFetching}
        onRefresh={() => query.refetch()}
        notices={
          <div className="grid gap-2">
            {acknowledgement ? (
              <StateNotice kind="info" title={`${humanizeToken(acknowledgement.action, 'Command')} accepted`} detail={`Acknowledged for ${acknowledgement.resource ?? 'the selected resource'} / ${acknowledgement.eventKey ?? 'event'}. Acknowledgement does not prove projection recovery.`} />
            ) : null}
            {commandError ? (
              <StateNotice kind="error" title="Command failed" detail={failureDetail(commandError)} requestId={failureRequestId(commandError)} />
            ) : null}
            {state.isError ? (
              <StateNotice kind="error" title="Read failed" detail={`${failureDetail(state.error)}${readRateLimited ? ' Automatic retries are disabled.' : ''}`} requestId={failureRequestId(state.error)} action={readRateLimited ? undefined : <Button onClick={() => query.refetch()}>Retry read</Button>} />
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

      {selected ? (
        <Drawer open onClose={() => selectFailure(undefined)} title={humanizeToken(selected.resource)} subtitle={selected.eventKey}>
          <div className="grid gap-4">
            <Status tone="failed">{humanizeToken(selected.failureClass, 'Failed')}</Status>
            <DescriptionList>
              <Fact label="Instance" value={selected.instanceId} mono />
              <Fact label="Event type" value={humanizeToken(selected.eventType)} />
              <Fact label="Error code" value={selected.lastErrorCode ?? 'Not reported'} mono />
              <Fact label="Attempts" value={`${selected.retryCount ?? '—'} of ${selected.maxAttempts ?? '—'}`} />
              <Fact label="Occurred" value={relativeTime(selected.occurredAt) || 'Not reported'} />
              <Fact label="Last attempt" value={relativeTime(selected.lastAttemptAt) || 'Not reported'} />
              <Fact label="Dead-lettered" value={relativeTime(selected.deadLetteredAt) || 'Not reported'} />
            </DescriptionList>
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" onClick={() => openCommand('replay')}>Replay…</Button>
              <Button variant="danger" onClick={() => openCommand('discard')}>Discard…</Button>
            </div>
          </div>
        </Drawer>
      ) : null}

      <Dialog
        open={Boolean(selected && action)}
        onClose={() => setAction(undefined)}
        closeDisabled={pending}
        title={action === 'replay' ? 'Replay this failure?' : 'Discard this failure?'}
        footer={
          <>
            <Button onClick={() => setAction(undefined)} disabled={pending}>Cancel</Button>
            <Button variant={action === 'discard' ? 'danger' : 'primary'} onClick={submitCommand} disabled={reason.trim().length < 8 || pending}>{pending ? 'Submitting…' : action === 'replay' ? 'Submit replay' : 'Confirm discard'}</Button>
          </>
        }
      >
        {selected ? (
          <div className="grid gap-3">
            <p className="text-sm text-fg-2">{action === 'replay' ? 'The server will acknowledge the replay request. Recovery remains authoritative only after a refreshed projection and failure list.' : 'Discard is irreversible for this dead letter. It does not repair or replay the underlying projection event.'}</p>
            <Field label="Operator reason">
              {(id) => <Input id={id} value={reason} minLength={8} required autoFocus disabled={pending} placeholder="Minimum 8 characters for the audit record" onChange={(e) => setReason(e.target.value)} />}
            </Field>
            <div className="grid gap-1 font-mono text-xs text-fg-3">
              <span>instance: {selected.instanceId}</span>
              <span>resource: {selected.resource}</span>
              <span>event: {selected.eventKey}</span>
            </div>
          </div>
        ) : null}
      </Dialog>
    </>
  );
}
