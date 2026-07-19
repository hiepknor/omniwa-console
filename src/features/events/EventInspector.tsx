import { useRef } from 'react';
import type { EventResource } from '@/api/events-api';
import { useDrawerFocus } from '@/components/useDrawerFocus';
import { relativeTime } from '@/lib/format';

function Fact({ label, value }: { label: string; value: string | undefined }) {
  return <><dt>{label}</dt><dd className="mono" title={value}>{value ?? '—'}</dd></>;
}

export function EventInspector({ event, onClose }: { event: EventResource; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useDrawerFocus({ onClose, closeRef });

  return (
    <aside className="drawer event-inspector" aria-labelledby="event-inspector-title">
      <header className="drawer-head">
        <div className="drawer-identity">
          <span className="eyebrow">Event fact</span>
          <div className="drawer-title-row"><h2 className="mono" id="event-inspector-title">{event.type ?? 'Event'}</h2></div>
          <time className="event-inspector-time" dateTime={event.timestamp} title={event.timestamp}>{relativeTime(event.timestamp) || 'Time unavailable'}</time>
        </div>
        <button ref={closeRef} className="close" type="button" aria-label="Close event details" onClick={onClose}>✕</button>
      </header>
      <div className="drawer-scroll">
        <section aria-labelledby="event-facts-title">
          <h3 id="event-facts-title">Normalized facts</h3>
          <dl className="kv event-facts">
            <Fact label="ID" value={event.id} />
            <Fact label="Type" value={event.type} />
            <Fact label="Source" value={event.source} />
            <Fact label="Resource" value={event.resourceRef} />
            <Fact label="Correlation" value={event.correlationId} />
            <Fact label="Timestamp" value={event.timestamp} />
          </dl>
        </section>
        <section aria-labelledby="event-payload-title">
          <h3 id="event-payload-title">Payload</h3>
          <p className="drawer-note">Payload contents are not part of the public event projection. This inspector shows only normalized envelope facts.</p>
        </section>
      </div>
    </aside>
  );
}
