import type { FormEvent, ReactNode } from 'react';
import type { GroupResource } from '@/api/groups';
import { humanizeToken, relativeTime } from '@/lib/format';
import { Button, CursorPagination, Field, FilterToolbar, Input, MetricGrid, PageHeader, Panel, StateNotice, Status, Table, Td, Th, Tr } from '@/ui';

export type GroupsViewProps = {
  refreshing: boolean;
  onRefresh: () => void;
  onNew: () => void;
  commandsEnabled?: boolean;
  ack?: ReactNode;
  metrics?: { loaded: number; members: number; admins: number; announce: number };
  searchDraft: string;
  onSearchDraft: (v: string) => void;
  onApply: (e: FormEvent) => void;
  applyDisabled: boolean;
  projectionStatus?: ReactNode;
  notices?: ReactNode;
  initialLoading: boolean;
  empty: boolean;
  emptyDetail?: string;
  groups: GroupResource[];
  selectedId?: string;
  onOpen: (id: string) => void;
  cursor?: string;
  nextCursor?: string;
  onCursor: (v?: string) => void;
};

export function GroupsView(props: GroupsViewProps) {
  return (
    <div className="grid gap-6 p-6 max-sm:p-4">
      <PageHeader
        eyebrow="Messaging"
        title="Groups"
        description="Projection-backed group directory and explicit provider commands in the active instance scope."
        actions={
          <>
            <Button onClick={props.onRefresh} disabled={props.refreshing} aria-busy={props.refreshing || undefined}>{props.refreshing ? 'Refreshing…' : 'Refresh'}</Button>
            <Button variant="primary" disabled={props.commandsEnabled === false} onClick={props.onNew}>New group</Button>
          </>
        }
      />

      {props.ack}

      {props.metrics ? (
        <MetricGrid
          columns={4}
          metrics={[
            { label: 'Loaded groups', value: String(props.metrics.loaded) },
            { label: 'Members', value: String(props.metrics.members) },
            { label: 'Known admins', value: String(props.metrics.admins) },
            { label: 'Announcement only', value: String(props.metrics.announce) },
          ]}
        />
      ) : null}

      <Panel title="Group directory" description="Applied prefix search, opaque cursor, and selected group remain URL-addressable." bodyClassName="p-0">
        <FilterToolbar as="form" onSubmit={props.onApply}>
          <Field label="Prefix search" className="min-w-56 flex-1">{(id) => <Input id={id} type="search" value={props.searchDraft} placeholder="Group name or JID prefix" onChange={(e) => props.onSearchDraft(e.target.value)} />}</Field>
          <div className="flex items-end"><Button type="submit" disabled={props.applyDisabled}>Apply search</Button></div>
        </FilterToolbar>

        {props.projectionStatus ? <div className="px-4">{props.projectionStatus}</div> : null}
        {props.notices ? <div className="p-4">{props.notices}</div> : null}
        {props.initialLoading ? <div className="p-4"><StateNotice kind="loading" title="Loading groups" /></div> : null}

        {props.groups.length > 0 ? (
          <Table className="border-0">
            <thead>
              <tr><Th>Group</Th><Th>Status</Th><Th className="text-right">Members</Th><Th className="text-right">Admins</Th><Th>Updated</Th></tr>
            </thead>
            <tbody>
              {props.groups.map((g) => (
                <Tr key={g.id} selected={g.id === props.selectedId} onClick={props.commandsEnabled === false ? undefined : () => props.onOpen(g.id)}>
                  <Td>
                    <div className="grid gap-0.5">
                      <span className="font-medium">{g.subject ?? g.id}</span>
                      <small className="font-mono text-xs text-fg-3">{g.id}</small>
                    </div>
                  </Td>
                  <Td><Status tone={g.status === 'active' ? 'ok' : 'degraded'}>{humanizeToken(g.status ?? 'unreported')}</Status></Td>
                  <Td className="text-right font-mono tabular-nums">{g.memberCount ?? '—'}</Td>
                  <Td className="text-right font-mono tabular-nums">{g.adminCount ?? '—'}</Td>
                  <Td className="text-fg-2" title={g.updatedAt}>{relativeTime(g.updatedAt) || 'Not reported'}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        ) : props.empty ? (
          <div className="p-4"><StateNotice kind="empty" title="No groups" detail={props.emptyDetail ?? 'The ready group projection contains no groups.'} /></div>
        ) : null}

        <CursorPagination cursor={props.cursor} nextCursor={props.nextCursor} onCursor={props.onCursor} info={props.cursor ? 'Opaque cursor page' : `${props.groups.length} groups on first page`} />
      </Panel>
    </div>
  );
}
