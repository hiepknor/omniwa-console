import type { FormEvent, ReactNode } from 'react';
import type { GroupResource } from '@/api/groups';
import { humanizeToken, relativeTime } from '@/lib/format';
import { Button, CursorPagination, Field, FilterToolbar, Input, PageHeader, Panel, StateNotice, Status, Table, Td, Th, Tr } from '@/ui';

export type GroupsViewProps = {
  refreshing: boolean;
  onRefresh: () => void;
  onNew: () => void;
  commandsEnabled?: boolean;
  ack?: ReactNode;
  searchDraft: string;
  onSearchDraft: (v: string) => void;
  onApply: (e: FormEvent) => void;
  applyDisabled: boolean;
  projectionStatus?: ReactNode;
  notices?: ReactNode;
  sectionNav?: ReactNode;
  initialLoading: boolean;
  emptyState?: { kind: 'empty' | 'loading' | 'error'; title: string; detail: string };
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

      {props.sectionNav}

      {props.ack}

      <Panel title="Group directory" description="Applied prefix search, opaque cursor, and selected group remain URL-addressable." bodyClassName="p-0">
        <FilterToolbar as="form" onSubmit={props.onApply}>
          <Field label="Prefix search" className="min-w-56 flex-1">{(id) => <Input id={id} type="search" value={props.searchDraft} placeholder="Group name or JID prefix" onChange={(e) => props.onSearchDraft(e.target.value)} />}</Field>
          <div className="flex items-end"><Button type="submit" disabled={props.applyDisabled}>Apply search</Button></div>
        </FilterToolbar>

        {props.projectionStatus ? <div className="px-4">{props.projectionStatus}</div> : null}
        <div className="px-4 pb-3 text-xs text-fg-3">Group state and send mode are projected WhatsApp facts. They do not establish this account&apos;s management permission or campaign eligibility.</div>
        {props.notices ? <div className="p-4">{props.notices}</div> : null}
        {props.initialLoading ? <div className="p-4"><StateNotice kind="loading" title="Loading groups" /></div> : null}

        {props.groups.length > 0 ? (
          <Table className="border-0">
            <thead>
              <tr><Th>Group</Th><Th>Type</Th><Th>Group state</Th><Th>Send mode</Th><Th className="text-right">Members</Th><Th>Updated</Th></tr>
            </thead>
            <tbody>
              {props.groups.map((g) => (
                <Tr key={g.id} selected={g.id === props.selectedId} onClick={() => props.onOpen(g.id)}>
                  <Td>
                    <div className="grid gap-0.5">
                      <span className="font-medium">{g.subject ?? g.id}</span>
                      <small className="font-mono text-xs text-fg-3">{g.id}</small>
                    </div>
                  </Td>
                  <Td>{humanizeToken(g.groupType ?? 'unreported')}</Td>
                  <Td><Status tone={g.status === 'active' ? 'ok' : 'degraded'}>{humanizeToken(g.status ?? 'unreported')}</Status></Td>
                  <Td>{g.sendMode ? humanizeToken(g.sendMode) : 'Not reported'}</Td>
                  <Td className="text-right font-mono tabular-nums">{g.memberCount ?? '—'}</Td>
                  <Td className="text-fg-2" title={g.updatedAt}>{relativeTime(g.updatedAt) || 'Not reported'}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        ) : props.emptyState ? (
          <div className="p-4">
            {props.emptyState.kind === 'loading' ? <StateNotice kind="loading" title={props.emptyState.title} detail={props.emptyState.detail} />
              : props.emptyState.kind === 'error' ? <StateNotice kind="error" title={props.emptyState.title} detail={props.emptyState.detail} />
                : <StateNotice kind="empty" title={props.emptyState.title} detail={props.emptyState.detail} />}
          </div>
        ) : null}

        <CursorPagination cursor={props.cursor} nextCursor={props.nextCursor} onCursor={props.onCursor} info={props.cursor ? 'Opaque cursor page' : `${props.groups.length} groups on first page`} />
      </Panel>
    </div>
  );
}
