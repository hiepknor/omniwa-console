import type { EventResource } from '@/api/events-api';
import { DetailDrawer, DrawerIdentifier, DrawerTechnicalValue } from '@/components/drawer/DetailDrawer';

function Fact({ label, value }: { label: string; value: string | undefined }) {
  return <><dt>{label}</dt><dd><DrawerTechnicalValue value={value} /></dd></>;
}

export function EventInspector({ event, onClose }: { event: EventResource; onClose: () => void }) {
  return (
    <DetailDrawer titleId="event-inspector-title" eyebrow="Event fact" title={event.type ?? 'Event'} titleClassName="mono" subtitle={<DrawerIdentifier value={event.id} label="Copy event identifier" />} className="event-inspector" closeLabel="Close event details" onClose={onClose}>
      <section aria-labelledby="event-facts-title">
        <h3 id="event-facts-title">Normalized facts</h3>
        <dl className="kv event-facts">
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
    </DetailDrawer>
  );
}
