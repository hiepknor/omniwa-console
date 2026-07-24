import { useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApiSession } from '@/api/ApiProvider';
import { useServerCapabilities } from '@/api/CapabilitiesProvider';
import type { ProjectionFailure } from '@/api/recovery';
import { ApiFailure } from '@/api/envelopes';
import { Button, Dialog, Field, Inspector, PageGuard, PageHeader, StateNotice, Status, Surface } from '@/components/v2';
import { humanizeToken, relativeTime } from '@/lib/format';
import { useResilientReadState } from '@/lib/query-state';
import { updateSearchParams } from '@/lib/url-search-state';
import { commandFailureState, failureDetail, failureRequestId, readFailureState } from './state';
import { useDiscardProjectionFailure, useProjectionFailures, useReplayProjectionFailure } from './hooks';
import { recoveryFiltersFromSearch } from './route-state';

type RecoveryAction = 'replay' | 'discard';

function failureIdentity(failure: ProjectionFailure): string {
  return JSON.stringify([failure.instanceId, failure.resource, failure.eventKey]);
}

function Timestamp({ value }: { value?: string }) {
  return value ? <time dateTime={value} title={value}>{relativeTime(value) || value}</time> : <>Not reported</>;
}

function Blocked({ detail, state }: { detail?: string; state: 'invalid' | 'discovering' | 'unsupported' }) { return <PageGuard eyebrow="Platform" title="Projection recovery" description="Inspect and operate terminal projection failures." state={state} detail={detail} />; }

export function RecoveryPageV2() {
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
    const next = updateSearchParams(
      searchParams,
      updates,
      scopeChanged ? ['cursor', 'failureInstance', 'failureResource', 'failureEvent'] : [],
    );
    setSearchParams(next, { replace });
  };
  const selectFailure = (failure: ProjectionFailure | undefined) => {
    updateFilters({
      failureInstance: failure?.instanceId,
      failureResource: failure?.resource,
      failureEvent: failure?.eventKey,
    }, failure === undefined);
  };
  const openCommand = (nextAction: RecoveryAction) => {
    replay.reset();
    discard.reset();
    setReason('');
    setAction(nextAction);
  };
  const applyFilters = (event: FormEvent) => {
    event.preventDefault();
    updateFilters({
      instanceId: instanceDraft.trim() || undefined,
      resource: resourceDraft.trim() || undefined,
    });
  };
  const submitCommand = () => {
    if (!selected || !action || reason.trim().length < 8 || pending) return;
    activeMutation.mutate({
      eventKey: selected.eventKey,
      instanceId: selected.instanceId,
      resource: selected.resource,
      reason: reason.trim(),
    }, {
      onSuccess: () => {
        setAction(undefined);
        selectFailure(undefined);
      },
    });
  };

  if (session.keyKind !== 'admin') {
    return <Blocked state="invalid" detail="Projection recovery requires an admin credential. No recovery request was sent." />;
  }
  if (capabilities.isPending) {
    return <Blocked state="discovering" detail="Waiting for server capability discovery before reading failures." />;
  }
  if (!capabilityReady) {
    return <Blocked state="unsupported" detail={capabilities.isError ? 'Capability discovery failed; recovery remains disabled.' : 'The server does not advertise projection_failure_operations.'} />;
  }

  return (
    <div className="ui-v2-page">
      <PageHeader
        eyebrow="Platform"
        title="Projection recovery"
        description="Review terminal failures and submit explicit audited replay or discard commands."
        actions={<Button onClick={() => query.refetch()} disabled={query.isFetching}>{query.isFetching ? 'Refreshing…' : 'Refresh'}</Button>}
      />
      <div className="ui-v2-page__content">
        {acknowledgement ? (
          <StateNotice
            value={{ axis: 'command', state: 'acknowledged' }}
            detail={`${humanizeToken(acknowledgement.action, 'Command')} acknowledged for ${acknowledgement.resource ?? 'the selected resource'} / ${acknowledgement.eventKey ?? 'event'}. Refresh determines whether it remains listed; acknowledgement does not prove projection recovery.`}
          />
        ) : null}
        {commandError ? (
          <StateNotice
            value={commandFailureState(commandError)}
            detail={`${failureDetail(commandError)} ${commandError instanceof ApiFailure ? 'The server rejected the command.' : 'Check the refreshed failure list before submitting again.'}`}
            requestId={failureRequestId(commandError)}
          />
        ) : null}
        {state.isError ? (
          <StateNotice value={readFailureState(state.error, state.isStaleError)} detail={`${failureDetail(state.error)}${readRateLimited ? ' Automatic retries are disabled.' : ''}`} requestId={failureRequestId(state.error)} action={readRateLimited ? undefined : <Button onClick={() => query.refetch()}>Retry read</Button>} />
        ) : null}

        <Surface title="Failure queue" description="Filters and the opaque cursor stay in the URL; changing a filter resets pagination and selection.">
          <form className="ui-v2-recovery-filters" onSubmit={applyFilters}>
            <Field label="Instance ID" value={instanceDraft} placeholder="All instances" onChange={(event) => setInstanceDraft(event.target.value)} />
            <Field label="Resource" value={resourceDraft} placeholder="All resources" onChange={(event) => setResourceDraft(event.target.value)} />
            <label className="ui-v2-field"><span className="ui-v2-field__label">Page size</span><select className="ui-v2-input" value={filters.limit} onChange={(event) => updateFilters({ limit: event.target.value === '50' ? undefined : event.target.value })}>{[25, 50, 100, 200].map((limit) => <option key={limit} value={limit}>{limit}</option>)}</select></label>
            <Button variant="primary" type="submit">Apply filters</Button>
          </form>

          {state.isInitialLoading ? <StateNotice value={{ axis: 'resource', state: 'initial-loading' }} detail="Reading projection failures." /> : null}
          {query.data?.items.length === 0 ? <StateNotice value={{ axis: 'resource', state: 'empty' }} detail="The server returned no terminal failures for this exact filter and cursor. This does not summarize other pages or scopes." /> : null}
          {query.data && query.data.items.length > 0 ? (
            <div className="ui-v2-table-wrap" tabIndex={0} aria-label="Projection failure table">
              <table className="ui-v2-table ui-v2-recovery-table">
                <caption className="ui-v2-visually-hidden">Terminal projection failures</caption>
                <thead><tr><th>Event</th><th>Instance</th><th>Resource</th><th>Failure</th><th>Attempts</th><th>Dead-lettered</th></tr></thead>
                <tbody>{query.data.items.map((failure) => (
                  <tr key={failureIdentity(failure)} data-selected={failure === selected || undefined}>
                    <td data-label="Event"><button className="ui-v2-row-link ui-v2-mono" type="button" onClick={() => selectFailure(failure)}>{failure.eventKey}</button></td>
                    <td data-label="Instance" className="ui-v2-mono">{failure.instanceId}</td>
                    <td data-label="Resource">{humanizeToken(failure.resource)}</td>
                    <td data-label="Failure">{humanizeToken(failure.lastErrorCode ?? failure.failureClass)}</td>
                    <td data-label="Attempts" className="ui-v2-mono">{failure.retryCount ?? '—'} / {failure.maxAttempts ?? '—'}</td>
                    <td data-label="Dead-lettered"><Timestamp value={failure.deadLetteredAt} /></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : null}
          <div className="ui-v2-pagination">
            <span>{filters.cursor ? 'Opaque cursor page' : 'First page'}</span>
            <div>
              {filters.cursor ? <Button onClick={() => updateFilters({ cursor: undefined, failureInstance: undefined, failureResource: undefined, failureEvent: undefined }, false)}>First page</Button> : null}
              <Button disabled={!query.data?.nextCursor} onClick={() => updateFilters({ cursor: query.data?.nextCursor, failureInstance: undefined, failureResource: undefined, failureEvent: undefined }, false)}>Next page</Button>
            </div>
          </div>
        </Surface>
      </div>

      {selected ? (
        <Inspector
          titleId="projection-failure-details"
          eyebrow="Terminal failure"
          title={humanizeToken(selected.resource)}
          subtitle={<span className="ui-v2-mono">{selected.eventKey}</span>}
          status={<Status tone="failed">{humanizeToken(selected.failureClass, 'Failed')}</Status>}
          modal
          onClose={() => selectFailure(undefined)}
        >
          <dl className="ui-v2-detail-list">
            <div><dt>Instance</dt><dd className="ui-v2-mono">{selected.instanceId}</dd></div>
            <div><dt>Event type</dt><dd>{humanizeToken(selected.eventType)}</dd></div>
            <div><dt>Error code</dt><dd className="ui-v2-mono">{selected.lastErrorCode ?? 'Not reported'}</dd></div>
            <div><dt>Attempts</dt><dd>{selected.retryCount ?? '—'} of {selected.maxAttempts ?? '—'}</dd></div>
            <div><dt>Occurred</dt><dd><Timestamp value={selected.occurredAt} /></dd></div>
            <div><dt>Last attempt</dt><dd><Timestamp value={selected.lastAttemptAt} /></dd></div>
            <div><dt>Dead-lettered</dt><dd><Timestamp value={selected.deadLetteredAt} /></dd></div>
          </dl>
          <div className="ui-v2-command-bar"><Button variant="primary" onClick={() => openCommand('replay')}>Replay…</Button><Button variant="danger" onClick={() => openCommand('discard')}>Discard…</Button></div>
        </Inspector>
      ) : null}

      {selected && action ? (
        <Dialog
          titleId="projection-failure-command"
          eyebrow="Audited command"
          title={action === 'replay' ? 'Replay this failure?' : 'Discard this failure?'}
          description={action === 'replay' ? 'The server will acknowledge the replay request. Recovery remains authoritative only after a refreshed projection and failure list.' : 'Discard is irreversible for this dead letter. It does not repair or replay the underlying projection event.'}
          canClose={!pending}
          onClose={() => setAction(undefined)}
          actions={<><Button onClick={() => setAction(undefined)} disabled={pending}>Cancel</Button><Button variant={action === 'discard' ? 'danger' : 'primary'} onClick={submitCommand} disabled={reason.trim().length < 8 || pending}>{pending ? 'Submitting…' : action === 'replay' ? 'Submit replay' : 'Confirm discard'}</Button></>}
        >
          <Field label="Operator reason" value={reason} minLength={8} required autoFocus disabled={pending} hint="Required for the server audit record; minimum 8 characters." onChange={(event) => setReason(event.target.value)} />
          <div className="ui-v2-command-identity"><span>Instance</span><code>{selected.instanceId}</code><span>Resource</span><code>{selected.resource}</code><span>Event</span><code>{selected.eventKey}</code></div>
        </Dialog>
      ) : null}
    </div>
  );
}
