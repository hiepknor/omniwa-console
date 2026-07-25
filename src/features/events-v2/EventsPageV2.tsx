import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApiSession } from '@/api/ApiProvider';
import { useServerCapabilities } from '@/api/CapabilitiesProvider';
import { ApiFailure } from '@/api/envelopes';
import type { EventResource } from '@/api/events-api';
import { ApiFailureNotice, Button, CursorPagination, Fact, Field, Inspector, PageGuard, PageHeader, StateNotice, Status, Surface, Table } from '@/components/v2';
import { cursorRecoveryAction } from '@/lib/cursor-recovery';
import { humanizeToken, relativeTime } from '@/lib/format';
import { useEventsV2 } from './hooks';
import { eventRouteState, setEventParam } from './route-state';

function retentionLabel(seconds?: number) { if (!seconds) return 'Retention unreported'; const days = seconds / 86_400; return Number.isInteger(days) ? `${days} day retention` : `${Math.round(seconds / 3_600)} hour retention`; }

export function EventsPageV2() {
  const session = useApiSession();
  const capabilities = useServerCapabilities();
  const [searchParams, setSearchParams] = useSearchParams();
  const route = eventRouteState(searchParams);
  const [typeDraft, setTypeDraft] = useState(route.type);
  useEffect(() => setTypeDraft(route.type), [route.type]);
  const instanceScope = session.keyKind === 'api';
  const enabled = instanceScope && (capabilities.data?.capabilities.includes('events_projection') ?? false);
  const events = useEventsV2(route.type, route.cursor, enabled);
  const items = useMemo(() => events.data?.resource.items ?? [], [events.data]);
  const selected = items.find((item) => item.id === route.event);
  const setParam = (key: string, value?: string) => setSearchParams(setEventParam(searchParams, key, value), { replace: true });

  useEffect(() => {
    if (!(events.error instanceof ApiFailure) || cursorRecoveryAction(events.error.code, route.cursor) !== 'reset') return;
    setSearchParams(setEventParam(searchParams, 'cursor'), { replace: true });
  }, [events.error, route.cursor, searchParams, setSearchParams]);

  if (!instanceScope) return <Blocked detail="Durable event history requires an instance credential. Admin scope does not open a browser WebSocket or query token-scoped history." state="invalid" />;
  if (capabilities.isPending) return <Blocked detail="Discovering instance capabilities before reading durable event history." state="discovering" />;
  if (capabilities.isError) return <Blocked detail="Capability discovery failed. No event-history request or WebSocket fallback was sent." state="unsupported" />;
  if (!enabled) return <Blocked detail="The backend does not advertise events_projection. Toast history and live provider payloads are not used as substitutes." state="unsupported" />;

  return <div className="ui-v2-page">
    <PageHeader eyebrow="Observability" title="Events" description="Durable normalized history for recovery and audit context; persisted before external fan-out." actions={<Button disabled={events.isFetching} onClick={() => events.refetch()}>{events.isFetching ? 'Refreshing…' : 'Refresh'}</Button>} />
    <div className="ui-v2-page__content">
      <div className="ui-v2-status-list"><Status tone="healthy">Polling durable history</Status><Status tone="neutral">{retentionLabel(events.data?.meta.retentionSeconds)}</Status><Status tone="neutral">No historical backfill</Status></div>
      <Surface title="Event history" description="Exact type filter, opaque cursor, and selected event remain URL-addressable.">
        <form className="ui-v2-event-filters" onSubmit={(event) => { event.preventDefault(); setParam('type', typeDraft.trim() || undefined); }}><Field label="Exact event type" type="search" maxLength={64} value={typeDraft} onChange={(event) => setTypeDraft(event.target.value)} placeholder="Message" /><Button type="submit" disabled={events.isFetching || typeDraft.trim() === route.type}>Apply filter</Button></form>
        {events.isPending ? <StateNotice value={{ axis: 'resource', state: 'initial-loading' }} /> : events.error && !events.data ? <ApiFailureNotice error={events.error} onRetry={() => events.refetch()} /> : events.data ? <>{events.error ? <ApiFailureNotice error={events.error} stale onRetry={() => events.refetch()} /> : null}{items.length ? <Table ariaLabel="Durable event table" caption="Durable normalized events" className="ui-v2-event-table" rows={items} rowKey={(item) => item.id} selectedKey={route.event} columns={[{ header: 'Type', cell: (item) => <button className="ui-v2-row-link ui-v2-mono" type="button" onClick={() => setParam('event', item.id)}>{item.type}</button> }, { header: 'Durable ID', cell: (item) => <span className="ui-v2-mono">{item.id}</span> }, { header: 'Occurred', cell: (item) => relativeTime(item.occurredAt) || 'Not reported' }, { header: 'Ingested', cell: (item) => relativeTime(item.ingestedAt) || 'Not reported' }]} /> : <StateNotice value={{ axis: 'resource', state: 'empty' }} detail={route.type ? `No durable events have the exact type “${route.type}”.` : 'No durable event history has been retained yet.'} />}<CursorPagination cursor={route.cursor} nextCursor={events.data.resource.pagination.nextCursor} onCursor={(value) => setParam('cursor', value)} label={`Generated ${relativeTime(events.data.meta.generatedAt) || 'at an unreported time'}`} /></> : null}
      </Surface>
    </div>
    {selected ? <EventInspectorV2 event={selected} onClose={() => setParam('event')} /> : null}
  </div>;
}

function EventInspectorV2({ event, onClose }: { event: EventResource; onClose: () => void }) { const summary = Object.entries(event.summary).sort(([a], [b]) => a.localeCompare(b)); return <Inspector titleId="event-v2-title" eyebrow="Durable event" title={event.type} subtitle={<span className="ui-v2-mono">{event.id}</span>} status={<Status tone="neutral">Normalized</Status>} modal onClose={onClose}><div className="ui-v2-stack"><dl className="ui-v2-detail-list"><Fact label="Occurred" value={event.occurredAt ?? 'Not reported'} /><Fact label="Ingested" value={event.ingestedAt ?? 'Not reported'} /></dl><section className="ui-v2-stack"><h3>Safe summary</h3>{summary.length ? <dl className="ui-v2-detail-list">{summary.map(([key, value]) => <Fact key={key} label={humanizeToken(key)} value={summaryValue(value)} />)}</dl> : <StateNotice value={{ axis: 'resource', state: 'empty' }} detail="This event contains no normalized summary fields." />}</section></div></Inspector>; }
function summaryValue(value: unknown) { if (value === null) return 'null'; if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value); return JSON.stringify(value); }
function Blocked({ detail, state }: { detail: string; state: 'invalid' | 'discovering' | 'unsupported' }) { return <PageGuard eyebrow="Observability" title="Events" description="Durable normalized event history and recovery context." state={state} detail={detail} />; }
