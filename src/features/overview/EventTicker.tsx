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
    <section className="section overview-events" aria-labelledby="overview-events-title">
      <div className="overview-section-head">
        <h2 id="overview-events-title">Live events</h2>
        <span className="live"><span className="dot"></span>polling</span>
      </div>
      <div className="ticker">
        <header><span>Stream</span><span className="ticker-label">Event · Resource · Age</span></header>
        <div className="event-list" tabIndex={0} role="region" aria-label="Live event stream">
          {events.length === 0 ? (
            <div className="empty">Live events appear when the realtime stream connects. Data refreshes every 15s meanwhile.</div>
          ) : events.map((event, index) => (
            <div className="event" key={`${event.type}-${event.resourceId ?? ''}-${event.updatedAt ?? index}`}>
              <span className={`dot ${eventDot(event.type)}`}></span>
              <span className="type">{event.type}</span>
              <span className="mono">{event.resourceId ?? '—'}</span>
              <span className="ts">{relativeTime(event.updatedAt) || '—'}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
