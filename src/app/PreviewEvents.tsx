import { useState } from 'react';
import { EventsView } from '@/features/events-v2/EventsView';
import { EventInspectorV2 } from '@/features/events-v2/EventsPageV2';
import { eventDetailFixture, eventsFixture } from './preview-fixtures';

/** Dev-only: Events history + an open event inspector with sample data. */
export function PreviewEvents() {
  const [open, setOpen] = useState(true);
  return (
    <div className="min-h-dvh bg-bg">
      <EventsView
        refreshing={false}
        onRefresh={() => {}}
        retentionSeconds={604_800}
        typeDraft=""
        onTypeDraft={() => {}}
        onApply={(e) => e.preventDefault()}
        applyDisabled
        initialLoading={false}
        empty={false}
        items={eventsFixture}
        selectedId={eventDetailFixture.id}
        onOpen={() => setOpen(true)}
        cursor={undefined}
        nextCursor="cursor_next"
        onCursor={() => {}}
        generatedInfo="Generated just now"
      />
      {open ? <EventInspectorV2 event={eventDetailFixture} onClose={() => setOpen(false)} /> : null}
    </div>
  );
}
