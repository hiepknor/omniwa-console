import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApiSession } from '@/api/ApiProvider';
import { useServerCapabilities } from '@/api/CapabilitiesProvider';
import { ApiFailure } from '@/api/envelopes';
import { ApiFailureNotice } from '@/components/ApiFailureNotice';
import type { EventResource } from '@/api/events-api';
import { humanizeToken, relativeTime } from '@/lib/format';
import { useInvalidCursorReset } from '@/lib/useInvalidCursorReset';
import { CopyValue, DescriptionItem, DescriptionList, Drawer, PageHeader, Panel, StateNotice, Status } from '@/ui';
import { EventsView } from './EventsView';
import { useEvents } from './hooks';
import { eventRouteState, setEventParam } from './route-state';

function Blocked({ detail, title }: { detail: string; title: string }) {
  return (
    <div className="grid gap-6 p-6 max-sm:p-4">
      <PageHeader eyebrow="Observability" title="Events" description="Inspect durable operational events and audit context." />
      <StateNotice kind="empty" title={title} detail={detail} />
    </div>
  );
}

function Fail({ error, stale, onRetry }: { error: unknown; stale?: boolean; onRetry: () => void }) {
  const f = error instanceof ApiFailure ? error : undefined;
  const notReady = f?.code === 'projection_not_ready';
  return <ApiFailureNotice error={error} kind={notReady ? 'empty' : 'error'} title={notReady ? 'Projection not ready' : stale ? 'Showing last known data' : 'Read failed'} onRetry={notReady ? undefined : onRetry} />;
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
        <Panel headingLevel={3} title="Event facts" description="Durable normalized identity and timestamps." actions={<Status tone="neutral">Normalized</Status>} bodyPadding="compact-top">
          <DescriptionList>
            <DescriptionItem label="Event ID" mono><CopyValue value={event.id} label="Event ID" /></DescriptionItem>
            <DescriptionItem label="Occurred">{event.occurredAt ? <time dateTime={event.occurredAt}>{event.occurredAt}</time> : 'Not reported'}</DescriptionItem>
            <DescriptionItem label="Ingested">{event.ingestedAt ? <time dateTime={event.ingestedAt}>{event.ingestedAt}</time> : 'Not reported'}</DescriptionItem>
          </DescriptionList>
        </Panel>
        <Panel headingLevel={3} title="Safe summary" description="Normalized public-safe fields reported by the durable event projection." bodyPadding="compact-top">
          {summary.length ? (
            <DescriptionList>
              {summary.map(([key, value]) => (
                <DescriptionItem key={key} label={humanizeToken(key)} mono valueClassName="break-all">{summaryValue(value)}</DescriptionItem>
              ))}
            </DescriptionList>
          ) : <StateNotice kind="empty" title="No summary" detail="This event contains no normalized summary fields." />}
        </Panel>
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
  const historyState = !enabled ? 'paused' : events.isFetching ? 'refreshing' : events.error ? 'degraded' : 'active';
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
        empty={Boolean(events.data) && items.length === 0 && enabled && !events.error}
        emptyDetail={route.type ? `No durable events have the exact type “${route.type}”.` : 'No durable event history has been retained yet.'}
        items={items}
        selectedId={route.event}
        onOpen={(id) => setParam('event', id)}
        cursor={route.cursor}
        nextCursor={events.data?.resource.pagination.nextCursor ?? undefined}
        onCursor={(v) => setParam('cursor', v)}
        generatedInfo={events.data ? `Generated ${relativeTime(events.data.meta.generatedAt) || 'at an unreported time'}` : undefined}
        historyState={historyState}
      />
      {selected ? <EventInspector event={selected} onClose={() => setParam('event')} /> : null}
    </>
  );
}
