import type { FormEvent, ReactNode } from 'react';
import type { GroupDirectorySummary, GroupMembershipState, GroupMyRole, GroupResource, GroupSendMode, GroupState, GroupType } from '@/api/groups';
import { humanizeToken, relativeTime } from '@/lib/format';
import { Button, CursorPagination, Field, FilterToolbar, Input, MetricGrid, PageHeader, Panel, Select, StateNotice, Status, Table, Td, Th, Tr } from '@/ui';
import { groupMembershipStates, groupRoles, groupSendModes, groupStates, groupTypes } from './route-state';

export type GroupsViewProps = {
  refreshing: boolean;
  onRefresh: () => void;
  onNew: () => void;
  onJoin: () => void;
  joinEnabled?: boolean;
  commandsEnabled?: boolean;
  normalized: boolean;
  summary?: GroupDirectorySummary;
  summaryNotice?: ReactNode;
  ack?: ReactNode;
  searchDraft: string;
  onSearchDraft: (v: string) => void;
  onApply: (e: FormEvent) => void;
  applyDisabled: boolean;
  filters: { type?: GroupType; myRole?: GroupMyRole; sendMode?: GroupSendMode; state?: GroupState; membershipState?: GroupMembershipState };
  onFilter: (key: 'type' | 'myRole' | 'sendMode' | 'state' | 'membershipState', value?: string) => void;
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
            <Button disabled={props.joinEnabled === false} onClick={props.onJoin}>Join group</Button>
            <Button variant="primary" disabled={props.commandsEnabled === false} onClick={props.onNew}>New group</Button>
          </>
        }
      />

      {props.sectionNav}

      {props.ack}

      {props.summaryNotice}
      {props.summary ? <MetricGrid columns={6} density="compact" metrics={[
        { label: 'All groups', value: String(props.summary.total ?? '—') },
        { label: 'Active', value: String(props.summary.active ?? '—') },
        { label: 'Suspended', value: String(props.summary.suspended ?? '—') },
        { label: 'Communities', value: String(props.summary.communities ?? '—') },
        { label: 'Subgroups', value: String(props.summary.subgroups ?? '—') },
        { label: 'Admins-only send', value: String(props.summary.adminsOnlySend ?? '—') },
      ]} /> : null}

      <Panel title="Group directory" description="Applied prefix search, opaque cursor, and selected group remain URL-addressable." bodyPadding="none">
        <FilterToolbar as="form" onSubmit={props.onApply}>
          <Field label="Prefix search" className="min-w-56 flex-1">{(id) => <Input id={id} type="search" value={props.searchDraft} placeholder="Group name or JID prefix" onChange={(e) => props.onSearchDraft(e.target.value)} />}</Field>
          <div className="flex items-end"><Button type="submit" disabled={props.applyDisabled}>Apply search</Button></div>
        </FilterToolbar>
        {props.normalized ? <FilterToolbar>
          <DirectoryFilter label="Type" value={props.filters.type} values={groupTypes} onValue={(value) => props.onFilter('type', value)} />
          <DirectoryFilter label="My role" value={props.filters.myRole} values={groupRoles} onValue={(value) => props.onFilter('myRole', value)} />
          <DirectoryFilter label="Send mode" value={props.filters.sendMode} values={groupSendModes} onValue={(value) => props.onFilter('sendMode', value)} />
          <DirectoryFilter label="Group state" value={props.filters.state} values={groupStates} onValue={(value) => props.onFilter('state', value)} />
          <DirectoryFilter label="Membership" value={props.filters.membershipState} values={groupMembershipStates} onValue={(value) => props.onFilter('membershipState', value)} />
        </FilterToolbar> : null}

        {props.projectionStatus ? <div className="px-4">{props.projectionStatus}</div> : null}
        <div className="px-4 pb-3 text-xs text-fg-3">Group state and send mode are projected WhatsApp facts. They do not establish this account&apos;s management permission or campaign eligibility.</div>
        {props.notices ? <div className="p-4">{props.notices}</div> : null}
        {props.initialLoading ? <div className="p-4"><StateNotice kind="loading" title="Loading groups" /></div> : null}

        {props.groups.length > 0 ? (
          <Table className="border-0">
            <thead>
              <tr><Th>Group</Th><Th>Type</Th><Th>Group state</Th>{props.normalized ? <Th>My role</Th> : null}<Th>Send mode</Th><Th className="text-right">Members</Th><Th>Updated</Th></tr>
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
                  {props.normalized ? <Td>{humanizeToken(g.myRole ?? 'unknown')}</Td> : null}
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

function DirectoryFilter({ label, value, values, onValue }: { label: string; value?: string; values: readonly string[]; onValue: (value?: string) => void }) {
  return <Field label={label} className="min-w-40 flex-1">{(id, labelId) => <Select id={id} aria-labelledby={labelId} value={value ?? ''} onValueChange={(next) => onValue(next || undefined)}><option value="">All</option>{values.map((item) => <option key={item} value={item}>{humanizeToken(item)}</option>)}</Select>}</Field>;
}
