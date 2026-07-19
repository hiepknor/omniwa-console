import { relativeTime } from '@/lib/format';

export type OverviewEvent = {
  id?: string;
  type: string;
  resourceId?: string;
  updatedAt?: string;
};

export type EventConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

function eventDot(type: string): string {
  if (type.endsWith('delivered') || type.endsWith('connected')) return 'dot-ok';
  if (type.endsWith('failed')) return 'dot-failed';
  if (type.endsWith('queued')) return 'dot-pending';
  return 'dot-info';
}

const connectionCopy: Record<EventConnectionState, { label: string; title: string; detail: string }> = {
  connecting: {
    label: 'Connecting',
    title: 'Realtime event stream is connecting.',
    detail: 'No live events are available until the stream connection completes.',
  },
  connected: {
    label: 'Connected',
    title: 'Realtime event stream is connected.',
    detail: 'The stream is ready. No events have been received in this browser session yet.',
  },
  disconnected: {
    label: 'Not connected',
    title: 'Realtime event stream is not connected.',
    detail: 'No live events are shown. Page-level metrics continue to refresh every 15 seconds; this surface does not populate through polling.',
  },
  error: {
    label: 'Connection failed',
    title: 'Realtime event stream could not connect.',
    detail: 'No live events are shown. Page-level metrics continue to refresh independently.',
  },
};

export function EventTicker({
  events = [],
  connectionState,
}: {
  events?: OverviewEvent[];
  connectionState: EventConnectionState;
}) {
  const connection = connectionCopy[connectionState];
  return (
    <section className="overview-events" aria-labelledby="overview-events-title">
      <div className="overview-section-label"><span>Live tail</span><span>{connection.label}</span></div>
      {events.length === 0 ? (
        <div className="overview-event-state">
          <span className="overview-event-glyph" aria-hidden="true"><i></i><i></i><i></i></span>
          <div>
            <h2 id="overview-events-title">{connection.title}</h2>
            <p>{connection.detail}</p>
          </div>
        </div>
      ) : (
        <div className="overview-event-feed" role="region" aria-label="Live event stream">
          <h2 id="overview-events-title" className="visually-hidden">Realtime event stream</h2>
          {events.map((event, index) => (
            <div className="overview-event-row max-[640px]:!grid-cols-[8px_minmax(0,1fr)_auto] max-[640px]:!gap-x-3 max-[640px]:!py-2" key={event.id ?? `${event.type}-${event.resourceId ?? ''}-${event.updatedAt ?? index}`}>
              <span className={`dot ${eventDot(event.type)}`}></span>
              <span className="mono min-w-0 truncate">{event.type}</span>
              <span className="mono min-w-0 truncate max-[640px]:!col-start-2 max-[640px]:!row-start-2">{event.resourceId ?? '—'}</span>
              <span className="ts !text-[var(--fg-2)] max-[640px]:!col-start-3 max-[640px]:!row-start-1 max-[640px]:!row-span-2">{relativeTime(event.updatedAt) || '—'}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
