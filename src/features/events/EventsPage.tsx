import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApiSession } from '@/api/ApiProvider';
import { useServerCapabilities } from '@/api/CapabilitiesProvider';
import { ApiFailure } from '@/api/envelopes';
import type { EventResource } from '@/api/events-api';
import { humanizeToken, relativeTime } from '@/lib/format';
import { useInvalidCursorReset } from '@/lib/useInvalidCursorReset';
import { Button, Drawer, PageHeader, StateNotice, Status } from '@/ui';
import { EventsView } from './EventsView';
import { useEvents } from './hooks';
import { eventRouteState, setEventParam } from './route-state';

function Blocked({ detail, title }: { detail: string; title: string }) {
  return (
    <div className="grid gap-6 p-6 max-sm:p-4">
      <PageHeader eyebrow="Observability" title="Events" description="Durable normalized event history and recovery context." />
      <StateNotice kind="empty" title={title} detail={detail} />
    </div>
  );
}

function Fail({ error, stale, onRetry }: { error: unknown; stale?: boolean; onRetry: () => void }) {
  const f = error instanceof ApiFailure ? error : undefined;
  const notReady = f?.code === 'projection_not_ready';
  return <StateNotice kind={notReady ? 'empty' : 'error'} title={notReady ? 'Projection not ready' : stale ? 'Showing last known data' : 'Read failed'} detail={f?.message ?? 'An unexpected error occurred.'} requestId={f?.requestId} action={notReady ? undefined : <Button onClick={onRetry}>Retry</Button>} />;
}

function summaryValue(value: unknown) {
  if (value === null) return 'null';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
}

export function EventInspector({ event, onClose }: { event: EventResource; onClose: () => void }) {
  const summary = Object.entries(event.summary).sort(([a], [b]) => a.localeCompare(b));
  return (
    <Drawer open onClose={onClose} title={event.type} subtitle={event.id}>
      <div className="grid gap-4">
        <Status tone="neutral">Normalized</Status>
        <dl>
          <div className="flex items-center justify-between gap-4 py-1.5 border-b border-line"><dt className="text-xs text-fg-3">Occurred</dt><dd className="text-[13px] text-fg">{event.occurredAt ?? 'Not reported'}</dd></div>
          <div className="flex items-center justify-between gap-4 py-1.5 border-b border-line"><dt className="text-xs text-fg-3">Ingested</dt><dd className="text-[13px] text-fg">{event.ingestedAt ?? 'Not reported'}</dd></div>
        </dl>
        <div className="grid gap-2">
          <h3 className="text-[11px] font-medium uppercase tracking-wider text-fg-3">Safe summary</h3>
          {summary.length ? (
            <dl>
              {summary.map(([key, value]) => (
                <div key={key} className="flex items-start justify-between gap-4 py-1.5 border-b border-line last:border-b-0">
                  <dt className="text-xs text-fg-3">{humanizeToken(key)}</dt>
                  <dd className="font-mono text-xs text-fg text-right break-all">{summaryValue(value)}</dd>
                </div>
              ))}
            </dl>
          ) : <StateNotice kind="empty" title="No summary" detail="This event contains no normalized summary fields." />}
        </div>
      </div>
    </Drawer>
  );
}

export function EventsPage() {
  const session = useApiSession();
  const capabilities = useServerCapabilities();
  const [searchParams, setSearchParams] = useSearchParams();
  const route = eventRouteState(searchParams);
  const [typeDraft, setTypeDraft] = useState(route.type);
  useEffect(() => setTypeDraft(route.type), [route.type]);
  const instanceScope = session.keyKind === 'api';
  const enabled = instanceScope && (capabilities.data?.capabilities.includes('events_projection') ?? false);
  const events = useEvents(route.type, route.cursor, enabled);
  const items = useMemo(() => events.data?.resource.items ?? [], [events.data]);
  const selected = items.find((item) => item.id === route.event);
  const setParam = (key: string, value?: string) => setSearchParams(setEventParam(searchParams, key, value), { replace: true });

  useInvalidCursorReset(events.error, route.cursor, () => {
    setSearchParams(setEventParam(searchParams, 'cursor'), { replace: true });
  });

  if (!instanceScope) return <Blocked title="Instance credential required" detail="Durable event history requires an instance credential. Admin scope does not open a browser WebSocket or query token-scoped history." />;
  if (capabilities.isPending) return <Blocked title="Discovering capabilities" detail="Discovering instance capabilities before reading durable event history." />;
  if (capabilities.isError && !events.data) return <Blocked title="Unsupported" detail="Capability discovery failed. No event-history request or WebSocket fallback was sent." />;
  if (!enabled && !events.data) return <Blocked title="Projection unavailable" detail="The backend does not currently advertise events_projection, which may be unsupported or waiting for readiness. Capability polling continues; no WebSocket or provider fallback is used." />;

  return (
    <>
      <EventsView
        refreshing={events.isFetching}
        onRefresh={() => events.refetch()}
        retentionSeconds={events.data?.meta.retentionSeconds}
        typeDraft={typeDraft}
        onTypeDraft={setTypeDraft}
        onApply={(e) => { e.preventDefault(); setParam('type', typeDraft.trim() || undefined); }}
        applyDisabled={events.isFetching || typeDraft.trim() === route.type}
        errorSlot={!enabled && events.data || events.error ? <div className="grid gap-2">{!enabled && events.data ? <StateNotice kind="empty" title="Capability changed" detail="Keeping the last usable durable event snapshot visible while events_projection is absent." /> : null}{events.error && !events.data ? <Fail error={events.error} onRetry={() => events.refetch()} /> : events.error ? <Fail error={events.error} stale onRetry={() => events.refetch()} /> : null}</div> : undefined}
        initialLoading={events.isPending}
        empty={Boolean(events.data) && items.length === 0}
        emptyDetail={route.type ? `No durable events have the exact type “${route.type}”.` : 'No durable event history has been retained yet.'}
        items={items}
        selectedId={route.event}
        onOpen={(id) => setParam('event', id)}
        cursor={route.cursor}
        nextCursor={events.data?.resource.pagination.nextCursor ?? undefined}
        onCursor={(v) => setParam('cursor', v)}
        generatedInfo={events.data ? `Generated ${relativeTime(events.data.meta.generatedAt) || 'at an unreported time'}` : undefined}
      />
      {selected ? <EventInspector event={selected} onClose={() => setParam('event')} /> : null}
    </>
  );
}
