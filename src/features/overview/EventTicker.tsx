import { relativeTime } from '@/lib/format';

export type OverviewEvent = {
  type: string;
  resourceId?: string;
  updatedAt?: string;
};

function eventDot(type: string): string {
  if (type.endsWith('delivered') || type.endsWith('connected')) return 'dot-ok';
  if (type.endsWith('failed')) return 'dot-failed';
  if (type.endsWith('queued')) return 'dot-pending';
  return 'dot-info';
}

export function EventTicker({ events = [] }: { events?: OverviewEvent[] }) {
  return (
    <section className="overview-events" aria-labelledby="overview-events-title">
      <div className="overview-section-label"><span>Event capability</span><span>{events.length > 0 ? 'Connected' : 'Not connected'}</span></div>
      {events.length === 0 ? (
        <div className="overview-event-state">
          <span className="overview-event-glyph" aria-hidden="true"><i></i><i></i><i></i></span>
          <div>
            <h2 id="overview-events-title">Realtime event stream is not connected.</h2>
            <p>No events are shown. Page-level metrics continue to refresh every <span className="num">15 seconds</span>; this event surface does not populate through polling.</p>
          </div>
        </div>
      ) : (
        <div className="overview-event-feed" role="region" aria-label="Live event stream">
          <h2 id="overview-events-title" className="visually-hidden">Realtime event stream</h2>
          {events.map((event, index) => (
            <div className="overview-event-row" key={`${event.type}-${event.resourceId ?? ''}-${event.updatedAt ?? index}`}>
              <span className={`dot ${eventDot(event.type)}`}></span>
              <span className="mono">{event.type}</span>
              <span className="mono">{event.resourceId ?? '—'}</span>
              <span className="ts">{relativeTime(event.updatedAt) || '—'}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
