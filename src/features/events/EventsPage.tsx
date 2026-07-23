import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { hasCapability } from '@/api/capabilities';
import { useInstanceCapabilities } from '@/api/CapabilitiesProvider';
import { ApiFailure } from '@/api/envelopes';
import type { EventResource } from '@/api/events-api';
import { PageHeader } from '@/components/PageHeader';
import { SelectDropdown } from '@/components/SelectDropdown';
import {
  DataTable,
  DataTableFooter,
  DataTableToolbar,
  DataTableWorkspace,
  type DataTableColumn,
  type DataTableState,
} from '@/components/data-table';
import { cursorRecoveryAction } from '@/lib/cursor-recovery';
import { relativeTime } from '@/lib/format';
import { useResilientReadState } from '@/lib/query-state';
import { EventInspector } from './EventInspector';
import { useEventInstances, useEvents, useResetEvents } from './hooks';

function retentionLabel(seconds: number | undefined): string {
  if (!seconds) return 'Retention policy unavailable';
  const days = seconds / 86_400;
  return Number.isInteger(days) ? `${days} day retention` : `${Math.round(seconds / 3_600)} hour retention`;
}

export function EventsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const instanceId = searchParams.get('instance') || undefined;
  const eventType = searchParams.get('type')?.trim() || undefined;
  const initialCursor = searchParams.get('cursor') || undefined;
  const selectedId = searchParams.get('event') || undefined;
  const instances = useEventInstances();
  const instanceItems = instances.data?.resource?.items ?? [];
  const selectedInstance = instanceItems.find((instance) => instance.id === instanceId);
  const capabilities = useInstanceCapabilities(instanceId, selectedInstance?.token);
  const projectionEnabled = hasCapability(capabilities.data, 'events_projection');
  const queryParams = useMemo(() => ({ cursor: initialCursor, type: eventType }), [eventType, initialCursor]);
  const list = useEvents(instanceId, selectedInstance?.token, queryParams, projectionEnabled);
  const resetEvents = useResetEvents(instanceId, queryParams);
  const pages = list.data?.pages ?? [];
  const listReadState = useResilientReadState(list, pages.length > 0);
  const events = useMemo(() => pages.flatMap((page) => page.resource.items), [pages]);
  const selectedEvent = events.find((event) => event.id === selectedId);
  const meta = pages[0]?.meta;

  const setParam = (name: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(name, value); else next.delete(name);
    if (name === 'instance' || name === 'type') {
      next.delete('cursor');
      next.delete('event');
    }
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    if (instanceId !== undefined || instanceItems.length !== 1) return;
    const onlyInstance = instanceItems[0];
    if (onlyInstance) setParam('instance', onlyInstance.id);
  }, [instanceId, instanceItems]);

  useEffect(() => {
    const error = list.error;
    if (!(error instanceof ApiFailure)) return;
    if (cursorRecoveryAction(error.code, initialCursor) !== 'reset') return;
    const next = new URLSearchParams(searchParams);
    next.delete('cursor');
    setSearchParams(next, { replace: true });
    resetEvents();
  }, [initialCursor, list.error, resetEvents, searchParams, setSearchParams]);

  const loadMore = async () => {
    const nextCursor = pages.at(-1)?.resource.pagination.nextCursor;
    if (!nextCursor) return;
    const result = await list.fetchNextPage();
    if (!result.isError) setParam('cursor', nextCursor);
  };

  const columns: DataTableColumn<EventResource>[] = [
    { id: 'occurred', header: 'Occurred', size: 'md', kind: 'date', sticky: 'identity', mobile: 'meta', cell: (event) => <time className="ts" dateTime={event.occurredAt} title={event.occurredAt}>{relativeTime(event.occurredAt) || '—'}</time>, mobileCell: (event) => relativeTime(event.occurredAt) || undefined },
    { id: 'type', header: 'Type', size: 'xl', kind: 'identifier', mobile: 'identity', cell: (event) => <span className="mono" title={event.type}>{event.type}</span> },
    { id: 'id', header: 'Durable ID', size: 'xl', kind: 'identifier', mobile: 'identifier', cell: (event) => <span className="mono" title={event.id}>{event.id}</span> },
    { id: 'ingested', header: 'Ingested', size: 'md', kind: 'date', mobile: 'secondary', cell: (event) => <time className="ts" dateTime={event.ingestedAt} title={event.ingestedAt}>{relativeTime(event.ingestedAt) || '—'}</time> },
  ];

  let tableState: DataTableState<EventResource>;
  if (!instanceId) {
    tableState = { status: 'unavailable', message: instanceItems.length === 0 ? 'Create an instance before reading event history.' : 'Select an instance to read its event history.' };
  } else if (!selectedInstance?.token) {
    tableState = { status: 'unavailable', message: 'The selected instance has no usable access token.' };
  } else if (!projectionEnabled && events.length === 0) {
    tableState = capabilities.isLoading
      ? { status: 'loading', skeletonRows: 7 }
      : { status: 'unavailable', message: 'Durable event history is not available on this server.' };
  } else if (listReadState.isInitialError) {
    tableState = { status: 'error', error: listReadState.error, onRetry: list.refetch };
  } else if (listReadState.isInitialLoading) {
    tableState = { status: 'loading', skeletonRows: 7 };
  } else if (events.length === 0) {
    tableState = { status: 'empty', message: eventType ? `No durable events have type “${eventType}”.` : 'No durable event history yet.' };
  } else {
    tableState = { status: 'ready', rows: events };
  }

  const instanceOptions = instanceItems.map((instance) => ({
    value: instance.id,
    label: instance.displayName ?? instance.id,
    description: instance.id,
    meta: instance.status,
  }));

  return (
    <>
      <PageHeader
        title="Events"
        meta={<span>Durable normalized history</span>}
        scope={instanceOptions.length > 0 ? <SelectDropdown label="Instance" value={instanceId ?? ''} options={instanceOptions} onChange={(value) => setParam('instance', value)} /> : undefined}
        status={<span className="freshness">{retentionLabel(meta?.retentionSeconds)}</span>}
      />
      <DataTableWorkspace className="events-workspace" aria-labelledby="events-table-title">
        <div className="events-section-head">
          <div><h2>Event history</h2><span>Persisted before fan-out · newest first · no historical backfill</span></div>
          <span className="num">{events.length} loaded</span>
        </div>
        <DataTableToolbar>
          <label className="search-field">
            <span className="visually-hidden">Filter by exact event type</span>
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 6h16M7 12h10M10 18h4" /></svg>
            <input className="search" type="search" value={eventType ?? ''} onChange={(event) => setParam('type', event.target.value)} placeholder="Exact event type" maxLength={64} />
          </label>
        </DataTableToolbar>
        <DataTable
          caption="Durable event history"
          captionId="events-table-title"
          layout="wide"
          attached
          columns={columns}
          state={tableState}
          refreshIssue={listReadState.isStaleError ? { error: listReadState.error, onRetry: list.refetch } : undefined}
          getRowKey={(event) => event.id}
          getRowState={(event) => ({ active: event.id === selectedId })}
          getRowActionLabel={(event) => `Inspect event ${event.id}`}
          getRowProps={(event) => ({
            className: 'responsive-table-actionable',
            tabIndex: 0,
            onClick: () => setParam('event', event.id),
            onKeyDown: (keyEvent) => {
              if (keyEvent.key === 'Enter' || keyEvent.key === ' ') {
                keyEvent.preventDefault();
                setParam('event', event.id);
              }
            },
          })}
          footer={<DataTableFooter primary={tableState.status === 'ready' || tableState.status === 'empty' ? <><span className="num">{events.length} loaded events</span><span className="freshness">Generated {relativeTime(meta?.generatedAt) || '—'} · {retentionLabel(meta?.retentionSeconds)}</span></> : <span className="num">Results —</span>} actions={list.hasNextPage ? <button className="btn" type="button" disabled={list.isFetchingNextPage} onClick={() => void loadMore()}>{list.isFetchingNextPage ? 'Loading…' : 'Load more'}</button> : undefined} />}
        />
      </DataTableWorkspace>
      {selectedEvent && <EventInspector event={selectedEvent} onClose={() => setParam('event', '')} />}
    </>
  );
}
