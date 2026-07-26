import type { FormEvent, ReactNode } from 'react';
import type { ProjectionFailure } from '@/api/recovery';
import { humanizeToken, relativeTime } from '@/lib/format';
import { Button, CursorPagination, Field, Input, PageHeader, Panel, Select, StateNotice, Table, Td, Th, Tr } from '@/ui';

export function failureIdentity(failure: ProjectionFailure): string {
  return JSON.stringify([failure.instanceId, failure.resource, failure.eventKey]);
}

export type RecoveryViewProps = {
  refreshing: boolean;
  onRefresh: () => void;
  notices?: ReactNode;
  instanceDraft: string;
  resourceDraft: string;
  onInstanceDraft: (v: string) => void;
  onResourceDraft: (v: string) => void;
  limit: number;
  onLimit: (v: string) => void;
  onApply: (e: FormEvent) => void;
  initialLoading: boolean;
  empty: boolean;
  items: ProjectionFailure[];
  selectedKey?: string;
  onSelect: (failure: ProjectionFailure) => void;
  cursor?: string;
  nextCursor?: string;
  onCursor: (cursor?: string) => void;
};

export function RecoveryView(props: RecoveryViewProps) {
  return (
    <div className="grid gap-6 p-6 max-sm:p-4">
      <PageHeader
        eyebrow="Platform"
        title="Projection recovery"
        description="Review terminal failures and submit explicit audited replay or discard commands."
        actions={<Button onClick={props.onRefresh} disabled={props.refreshing} aria-busy={props.refreshing || undefined}>{props.refreshing ? 'Refreshing…' : 'Refresh'}</Button>}
      />

      {props.notices}

      <Panel
        title="Failure queue"
        description="Filters and the opaque cursor stay in the URL; changing a filter resets pagination and selection."
        bodyClassName="p-0"
      >
        <form className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto] gap-3 p-4 border-b border-line max-[900px]:grid-cols-1" onSubmit={props.onApply}>
          <Field label="Instance ID">{(id) => <Input id={id} value={props.instanceDraft} placeholder="All instances" onChange={(e) => props.onInstanceDraft(e.target.value)} />}</Field>
          <Field label="Resource">{(id) => <Input id={id} value={props.resourceDraft} placeholder="All resources" onChange={(e) => props.onResourceDraft(e.target.value)} />}</Field>
          <Field label="Page size">{(id, labelId) => (
            <Select id={id} aria-labelledby={labelId} value={String(props.limit)} onValueChange={props.onLimit}>
              {[25, 50, 100, 200].map((n) => <option key={n} value={String(n)}>{n}</option>)}
            </Select>
          )}</Field>
          <div className="flex items-end"><Button variant="primary" type="submit" className="w-full">Apply filters</Button></div>
        </form>

        {props.initialLoading ? <div className="p-4"><StateNotice kind="loading" title="Reading projection failures" /></div> : null}
        {props.empty ? <div className="p-4"><StateNotice kind="empty" title="No terminal failures" detail="The server returned no terminal failures for this exact filter and cursor. This does not summarize other pages or scopes." /></div> : null}

        {props.items.length > 0 ? (
          <Table className="border-0">
            <thead>
              <tr>
                <Th>Event</Th>
                <Th>Instance</Th>
                <Th>Resource</Th>
                <Th>Failure</Th>
                <Th className="text-right">Attempts</Th>
                <Th>Dead-lettered</Th>
              </tr>
            </thead>
            <tbody>
              {props.items.map((f) => (
                <Tr key={failureIdentity(f)} selected={failureIdentity(f) === props.selectedKey} onClick={() => props.onSelect(f)}>
                  <Td className="font-mono text-xs text-fg-2">{f.eventKey}</Td>
                  <Td className="font-mono text-xs text-fg-2">{f.instanceId}</Td>
                  <Td>{humanizeToken(f.resource)}</Td>
                  <Td>{humanizeToken(f.lastErrorCode ?? f.failureClass)}</Td>
                  <Td className="text-right font-mono tabular-nums">{f.retryCount ?? '—'} / {f.maxAttempts ?? '—'}</Td>
                  <Td className="text-fg-2">{relativeTime(f.deadLetteredAt) || '—'}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        ) : null}

        <CursorPagination cursor={props.cursor} nextCursor={props.nextCursor} onCursor={props.onCursor} />
      </Panel>
    </div>
  );
}
