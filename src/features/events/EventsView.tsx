import type { FormEvent, ReactNode } from 'react';
import type { EventResource } from '@/api/events-api';
import { relativeTime } from '@/lib/format';
import { Button, CursorPagination, Field, FilterToolbar, Input, PageHeader, Panel, StateNotice, Status, Table, Td, Th, Tr } from '@/ui';

export function retentionLabel(seconds?: number) {
  if (!seconds) return 'Retention unreported';
  const days = seconds / 86_400;
  return Number.isInteger(days) ? `${days} day retention` : `${Math.round(seconds / 3_600)} hour retention`;
}

export type EventsViewProps = {
  refreshing: boolean;
  onRefresh: () => void;
  retentionSeconds?: number;
  typeDraft: string;
  onTypeDraft: (v: string) => void;
  onApply: (e: FormEvent) => void;
  applyDisabled: boolean;
  errorSlot?: ReactNode;
  initialLoading: boolean;
  empty: boolean;
  emptyDetail?: string;
  items: EventResource[];
  selectedId?: string;
  onOpen: (id: string) => void;
  cursor?: string;
  nextCursor?: string;
  onCursor: (v?: string) => void;
  generatedInfo?: string;
};

export function EventsView(props: EventsViewProps) {
  return (
    <div className="grid gap-6 p-6 max-sm:p-4">
      <PageHeader
        eyebrow="Observability"
        title="Events"
        description="Durable normalized history for recovery and audit context; persisted before external fan-out."
        actions={<Button onClick={props.onRefresh} disabled={props.refreshing} aria-busy={props.refreshing || undefined}>{props.refreshing ? 'Refreshing…' : 'Refresh'}</Button>}
      />

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 p-3 border border-line bg-surface">
        <Status tone="ok">Polling durable history</Status>
        <Status tone="neutral">{retentionLabel(props.retentionSeconds)}</Status>
        <Status tone="neutral">No historical backfill</Status>
      </div>

      <Panel title="Event history" description="Exact type filter, opaque cursor, and selected event remain URL-addressable." bodyClassName="p-0">
        <FilterToolbar as="form" onSubmit={props.onApply}>
          <Field label="Exact event type" className="min-w-56 flex-1">{(id) => <Input id={id} type="search" maxLength={64} value={props.typeDraft} placeholder="Message" onChange={(e) => props.onTypeDraft(e.target.value)} />}</Field>
          <div className="flex items-end"><Button type="submit" disabled={props.applyDisabled}>Apply filter</Button></div>
        </FilterToolbar>

        {props.errorSlot ? <div className="p-4">{props.errorSlot}</div> : null}
        {props.initialLoading ? <div className="p-4"><StateNotice kind="loading" title="Loading events" /></div> : null}

        {props.items.length > 0 ? (
          <Table className="border-0">
            <thead><tr><Th>Type</Th><Th>Durable ID</Th><Th>Occurred</Th><Th>Ingested</Th></tr></thead>
            <tbody>
              {props.items.map((e) => (
                <Tr key={e.id} selected={e.id === props.selectedId} onClick={() => props.onOpen(e.id)}>
                  <Td className="font-mono text-xs text-fg">{e.type}</Td>
                  <Td className="font-mono text-xs text-fg-2">{e.id}</Td>
                  <Td className="text-fg-2">{relativeTime(e.occurredAt) || 'Not reported'}</Td>
                  <Td className="text-fg-2">{relativeTime(e.ingestedAt) || 'Not reported'}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        ) : props.empty ? (
          <div className="p-4"><StateNotice kind="empty" title="No events" detail={props.emptyDetail ?? 'No durable event history has been retained yet.'} /></div>
        ) : null}

        <CursorPagination cursor={props.cursor} nextCursor={props.nextCursor} onCursor={props.onCursor} info={props.generatedInfo} />
      </Panel>
    </div>
  );
}
