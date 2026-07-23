import type { EventResource } from '@/api/events-api';
import { DetailDrawer, DrawerIdentifier, DrawerTechnicalValue } from '@/components/drawer/DetailDrawer';

function Fact({ label, value }: { label: string; value: string | undefined }) {
  return <><dt>{label}</dt><dd><DrawerTechnicalValue value={value} /></dd></>;
}

function summaryValue(value: unknown): string {
  if (value === null) return 'null';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
}

export function EventInspector({ event, onClose }: { event: EventResource; onClose: () => void }) {
  const summary = Object.entries(event.summary).sort(([left], [right]) => left.localeCompare(right));
  return (
    <DetailDrawer titleId="event-inspector-title" eyebrow="Durable event" title={event.type} titleClassName="mono" subtitle={<DrawerIdentifier value={event.id} label="Copy event identifier" />} className="event-inspector" closeLabel="Close event details" onClose={onClose}>
      <section aria-labelledby="event-facts-title">
        <h3 id="event-facts-title">Normalized envelope</h3>
        <dl className="kv event-facts">
          <Fact label="Occurred" value={event.occurredAt} />
          <Fact label="Ingested" value={event.ingestedAt} />
        </dl>
      </section>
      <section aria-labelledby="event-summary-title">
        <h3 id="event-summary-title">Safe summary</h3>
        {summary.length === 0
          ? <p className="drawer-note">This event has no normalized summary fields.</p>
          : <dl className="kv event-facts">{summary.map(([key, value]) => <Fact key={key} label={key} value={summaryValue(value)} />)}</dl>}
        <p className="drawer-note">Raw provider payloads and message content are not stored in durable history.</p>
      </section>
    </DetailDrawer>
  );
}
