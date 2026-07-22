import { useMemo, type KeyboardEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { AuditRecordResource, EventResource } from '@/api/events-api';
import { StatusIndicator } from '@/components/badges';
import {
  useRealtimeEvents,
  useRealtimeStatus,
  type RealtimeConnectionState,
} from '@/api/RealtimeProvider';
import { PageHeader } from '@/components/PageHeader';
import { RealtimeIndicator } from '@/components/RealtimeIndicator';
import {
  DataTable,
  DataTableFooter,
  DataTableToolbar,
  DataTableWorkspace,
  type DataTableColumn,
  type DataTableState,
} from '@/components/data-table';
import { relativeTime } from '@/lib/format';
import { useResilientReadState } from '@/lib/query-state';
import { EventInspector } from './EventInspector';
import { useAuditRecords, useEvents } from './hooks';

type EventsView = 'history' | 'audit';

const realtimeCopy: Record<RealtimeConnectionState, { label: string; dot: string }> = {
  connecting: { label: 'Reconnecting', dot: 'dot-pending' },
  live: { label: 'Live', dot: 'dot-ok' },
  reconnecting: { label: 'Reconnecting', dot: 'dot-pending' },
  polling: { label: 'Polling', dot: 'dot-info' },
};

function statusDot(status: string | undefined): string {
  const normalized = status?.toLowerCase();
  if (normalized === 'success' || normalized === 'succeeded' || normalized === 'completed' || normalized === 'allowed') return 'dot-ok';
  if (normalized === 'failed' || normalized === 'denied' || normalized === 'error') return 'dot-failed';
  if (normalized === 'pending' || normalized === 'accepted') return 'dot-pending';
  return 'dot-info';
}

function EventHistory() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('search') ?? '';
  const selectedId = searchParams.get('event') || undefined;
  const initialCursor = searchParams.get('cursor') ?? undefined;
  const liveEvents = useRealtimeEvents();
  const realtimeStatus = useRealtimeStatus();
  const list = useEvents(initialCursor);
  const pages = list.data?.pages ?? [];
  const listReadState = useResilientReadState(list, pages.some((page) => page.resource !== undefined));
  const events = useMemo(() => pages
    .flatMap((page) => page.resource?.items ?? [])
    .sort((left, right) => {
      const leftTime = left.timestamp ? Date.parse(left.timestamp) : Number.NaN;
      const rightTime = right.timestamp ? Date.parse(right.timestamp) : Number.NaN;
      if (Number.isNaN(leftTime)) return Number.isNaN(rightTime) ? 0 : 1;
      if (Number.isNaN(rightTime)) return -1;
      return rightTime - leftTime;
    }), [pages]);
  const unavailable = pages.some((page) => page.unavailable !== undefined);
  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return events;
    return events.filter((event) => [event.type, event.resourceRef, event.correlationId]
      .some((value) => value?.toLowerCase().includes(needle)));
  }, [events, search]);
  const selectedEvent = events.find((event) => event.id === selectedId);
  const newestTimestamp = events.map((event) => event.timestamp).filter((value): value is string => value !== undefined).sort().at(-1);
  const liveState = realtimeCopy[realtimeStatus];

  const setParam = (name: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(name, value); else next.delete(name);
    if (name === 'search') next.delete('cursor');
    setSearchParams(next, { replace: true });
  };
  const loadMore = async () => {
    const nextCursor = pages.at(-1)?.resource?.pagination?.nextCursor;
    if (!nextCursor) return;
    const result = await list.fetchNextPage();
    if (!result.isError) setParam('cursor', nextCursor);
  };

  const columns: DataTableColumn<EventResource>[] = [
    { id: 'timestamp', header: 'Timestamp', size: 'md', kind: 'date', sticky: 'identity', mobile: 'meta', cell: (event) => <time className="ts" dateTime={event.timestamp} title={event.timestamp}>{relativeTime(event.timestamp) || '—'}</time>, mobileCell: (event) => relativeTime(event.timestamp) || undefined },
    { id: 'type', header: 'Type', size: 'xl', kind: 'identifier', mobile: 'identity', cell: (event) => <span className="mono" title={event.type}>{event.type ?? '—'}</span> },
    { id: 'source', header: 'Source', size: 'md', mobile: 'secondary', cell: (event) => event.source ?? '—' },
    { id: 'resource', header: 'Resource ref', size: 'lg', kind: 'identifier', mobile: 'identifier', cell: (event) => <span className="mono" title={event.resourceRef}>{event.resourceRef ?? '—'}</span> },
    { id: 'correlation', header: 'Correlation ID', size: 'lg', kind: 'identifier', mobile: 'hidden', cell: (event) => <span className="mono event-correlation" title={event.correlationId}>{event.correlationId ?? '—'}</span> },
  ];
  const tableState: DataTableState<EventResource> = listReadState.isInitialError
    ? { status: 'error', error: listReadState.error, onRetry: list.refetch }
    : listReadState.isInitialLoading
      ? { status: 'loading', skeletonRows: 7 }
      : unavailable && events.length === 0
        ? { status: 'unavailable', message: 'Event history is not available on OmniWA GO.' }
        : filtered.length === 0
          ? { status: 'empty', message: events.length === 0 ? 'No event history yet.' : 'No events match this search.' }
          : { status: 'ready', rows: filtered };

  return (
    <div id="event-history-panel" role="tabpanel" aria-labelledby="event-history-tab">
      <section className="events-live-tail" aria-labelledby="live-tail-title">
        <div className="events-live-head">
          <div><span className="eyebrow">Live tail</span><h2 id="live-tail-title">Most recent stream events</h2></div>
          <span className="live events-stream-chip" data-state={realtimeStatus}><span className={`dot ${liveState.dot}`} />{liveState.label}</span>
        </div>
        <div className="events-live-rows" aria-live="polite">
          {liveEvents.length === 0
            ? <p className="events-live-empty">Waiting for realtime events.</p>
            : liveEvents.slice(0, 5).map((event) => (
              <div className="events-live-row" key={event.id}>
                <span className="dot dot-ok" aria-hidden="true" />
                <span className="mono events-live-type" title={event.type}>{event.type}</span>
                <span className="mono events-live-resource" title={event.resourceId}>{event.resourceId ?? '—'}</span>
                <time className="ts" dateTime={event.occurredAt} title={event.occurredAt}>{relativeTime(event.occurredAt) || '—'}</time>
              </div>
            ))}
        </div>
        <details className="events-behavior-note">
          <summary>How live tail works</summary>
          <p>The tail shows the most recent events from a bounded 200-event presentation buffer. The table below is the durable <span className="mono">listEvents</span> history and loads older pages with its cursor.</p>
        </details>
      </section>

      <DataTableWorkspace className="events-workspace" aria-labelledby="events-table-title">
        <div className="events-section-head"><div><h2>Event history</h2><span>Durable events · newest first</span></div><span className="num">{filtered.length} visible</span></div>
        <DataTableToolbar>
          <label className="search-field">
            <span className="visually-hidden">Search event history</span>
            <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
            <input className="search" type="search" value={search} onChange={(event) => setParam('search', event.target.value)} placeholder="Search type, resource, or correlation" />
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
          footer={<DataTableFooter primary={tableState.status === 'ready' || tableState.status === 'empty' ? <><span className="num">{filtered.length} loaded events</span><span className="freshness">Fresh through {relativeTime(newestTimestamp) || '—'}</span></> : <span className="num">Results —</span>} actions={list.hasNextPage ? <button className="btn" type="button" disabled={list.isFetchingNextPage} onClick={() => void loadMore()}>{list.isFetchingNextPage ? 'Loading…' : 'Load more'}</button> : undefined} />}
        />
      </DataTableWorkspace>

      {selectedEvent && <EventInspector event={selectedEvent} onClose={() => setParam('event', '')} />}
    </div>
  );
}

function AuditRecords() {
  const list = useAuditRecords();
  const pages = list.data?.pages ?? [];
  const listReadState = useResilientReadState(list, pages.some((page) => page.resource !== undefined));
  const records = useMemo(() => pages.flatMap((page) => page.resource?.items ?? []), [pages]);
  const unavailable = pages.some((page) => page.unavailable !== undefined);
  const latestTimestamp = records.map((record) => record.createdAt).filter((value): value is string => value !== undefined).sort().at(-1);
  const columns: DataTableColumn<AuditRecordResource>[] = [
    { id: 'id', header: 'ID', size: 'lg', kind: 'identifier', sticky: 'identity', mobile: 'identity', cell: (record) => <span className="mono" title={record.id}>{record.id}</span> },
    { id: 'category', header: 'Category', size: 'md', mobile: 'secondary', cell: (record) => record.category ?? '—' },
    { id: 'action', header: 'Action', size: 'lg', mobile: 'identifier', cell: (record) => record.action ?? '—' },
    { id: 'resourceType', header: 'Resource type', size: 'md', mobile: 'hidden', cell: (record) => record.auditedResourceType ?? '—' },
    { id: 'resource', header: 'Resource ref', size: 'lg', kind: 'identifier', mobile: 'hidden', cell: (record) => <span className="mono" title={record.resourceRef}>{record.resourceRef ?? '—'}</span> },
    { id: 'status', header: 'Status', size: 'md', kind: 'status', mobile: 'secondary', cell: (record) => <StatusIndicator dotClass={statusDot(record.status)}>{record.status ?? '—'}</StatusIndicator> },
    { id: 'created', header: 'Created', size: 'md', kind: 'date', mobile: 'meta', cell: (record) => <time className="ts" dateTime={record.createdAt} title={record.createdAt}>{relativeTime(record.createdAt) || '—'}</time>, mobileCell: (record) => relativeTime(record.createdAt) || undefined },
  ];
  const tableState: DataTableState<AuditRecordResource> = listReadState.isInitialError
    ? { status: 'error', error: listReadState.error, onRetry: list.refetch }
    : listReadState.isInitialLoading
      ? { status: 'loading', skeletonRows: 7 }
      : unavailable && records.length === 0
        ? { status: 'unavailable', message: 'Audit records are not available on OmniWA GO.' }
        : records.length === 0
          ? { status: 'empty', message: 'No audit records yet.' }
          : { status: 'ready', rows: records };

  return (
    <div id="audit-records-panel" role="tabpanel" aria-labelledby="audit-records-tab">
      <DataTableWorkspace className="events-workspace" aria-labelledby="audit-records-table-title">
        <div className="events-section-head"><div><h2>Audit records</h2><span>Operator and platform actions</span></div><span className="num">{records.length} loaded</span></div>
        <DataTable
          caption="Audit records"
          captionId="audit-records-table-title"
          layout="wide"
          columns={columns}
          state={tableState}
          refreshIssue={listReadState.isStaleError ? { error: listReadState.error, onRetry: list.refetch } : undefined}
          getRowKey={(record) => record.id}
          footer={<DataTableFooter primary={tableState.status === 'ready' || tableState.status === 'empty' ? <><span className="num">{records.length} loaded records</span><span className="freshness">Fresh through {relativeTime(latestTimestamp) || '—'}</span></> : <span className="num">Results —</span>} actions={list.hasNextPage ? <button className="btn" type="button" disabled={list.isFetchingNextPage} onClick={() => void list.fetchNextPage()}>{list.isFetchingNextPage ? 'Loading…' : 'Load more'}</button> : undefined} />}
        />
      </DataTableWorkspace>
    </div>
  );
}

export function EventsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const view: EventsView = searchParams.get('view') === 'audit' ? 'audit' : 'history';

  const setView = (nextView: EventsView) => {
    const next = new URLSearchParams(searchParams);
    if (nextView === 'history') next.delete('view'); else next.set('view', nextView);
    if (nextView === 'audit') next.delete('event');
    if (nextView !== view) next.delete('cursor');
    setSearchParams(next, { replace: true });
  };
  const handleTabKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const nextView = view === 'history' ? 'audit' : 'history';
    event.currentTarget.querySelector<HTMLButtonElement>(`#${nextView === 'history' ? 'event-history-tab' : 'audit-records-tab'}`)?.focus();
    setView(nextView);
  };

  return (
    <>
      <PageHeader title="Events" status={<RealtimeIndicator />} />
      <div className="events-mode-tabs" role="tablist" aria-label="Event data view" onKeyDown={handleTabKey}>
        <button className={`events-mode !min-h-11${view === 'history' ? ' active' : ''}`} id="event-history-tab" type="button" role="tab" aria-selected={view === 'history'} aria-controls="event-history-panel" tabIndex={view === 'history' ? 0 : -1} onClick={() => setView('history')}>Event history</button>
        <button className={`events-mode !min-h-11${view === 'audit' ? ' active' : ''}`} id="audit-records-tab" type="button" role="tab" aria-selected={view === 'audit'} aria-controls="audit-records-panel" tabIndex={view === 'history' ? -1 : 0} onClick={() => setView('audit')}>Audit records</button>
      </div>
      {view === 'history' ? <EventHistory /> : <AuditRecords />}
    </>
  );
}
