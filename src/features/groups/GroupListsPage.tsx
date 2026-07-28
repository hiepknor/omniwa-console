import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useApiSession } from '@/api/ApiProvider';
import { useServerCapabilities } from '@/api/CapabilitiesProvider';
import { ApiFailureNotice } from '@/components/ApiFailureNotice';
import { GroupEligibilitySummary } from '@/components/GroupEligibilitySummary';
import { humanizeToken, relativeTime } from '@/lib/format';
import { useInvalidCursorReset } from '@/lib/useInvalidCursorReset';
import { Button, ButtonLink, CursorPagination, DescriptionItem, DescriptionList, Dialog, Drawer, Field, FilterToolbar, Input, PageHeader, Panel, StateNotice, Status, Table, Tabs, Td, Th, Tr } from '@/ui';
import { GroupSectionTabs } from './GroupSectionTabs';
import { groupListRouteState, setGroupListParam } from './group-list-route-state';
import { useDeleteGroupList, useGroupList, useGroupListAudit, useGroupListEligibility, useGroupListEntries, useGroupLists } from '@/api/group-list-hooks';

function Failure({ error, onRetry }: { error: unknown; onRetry?: () => void }) { return <ApiFailureNotice error={error} title="Group List request failed" onRetry={onRetry} />; }

export function GroupListsPage() {
  const session = useApiSession();
  const capabilities = useServerCapabilities();
  const { groupListId } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const route = groupListRouteState(params);
  const [searchDraft, setSearchDraft] = useState(route.search);
  const enabled = session.keyKind === 'api' && (capabilities.data?.capabilities.includes('group_lists') ?? false);
  const eligibilityEnabled = capabilities.data?.capabilities.includes('group_list_eligibility') ?? false;
  const query = useGroupLists(route.search, route.cursor, enabled);
  const items = useMemo(() => query.data?.items ?? [], [query.data]);
  const setParam = (key: string, value?: string) => setParams(setGroupListParam(params, key, value), { replace: true });
  useInvalidCursorReset(query.error, route.cursor, () => setParam('cursor'));
  useEffect(() => setSearchDraft(route.search), [route.search]);

  if (session.keyKind !== 'api' || capabilities.isPending || (!enabled && !query.data)) {
    const detail = session.keyKind !== 'api' ? 'Group Lists requires an instance credential.' : capabilities.isPending ? 'Discovering Group List capability.' : 'The backend does not advertise group_lists. Enable the complete backend feature before managing campaign targets.';
    return <div className="grid gap-6 p-6 max-sm:p-4"><PageHeader eyebrow="Messaging / Groups" title="Group Lists" description="Reusable, server-owned group targets for campaigns." /><GroupSectionTabs /><StateNotice kind="empty" title="Group Lists unavailable" detail={detail} /></div>;
  }

  return (
    <>
      <div className="grid gap-6 p-6 max-sm:p-4">
        <PageHeader eyebrow="Messaging / Groups" title="Group Lists" description="Versioned sets of WhatsApp groups with backend-owned send eligibility." actions={<><Button disabled={query.isFetching} onClick={() => query.refetch()}>{query.isFetching ? 'Refreshing…' : 'Refresh'}</Button><ButtonLink to="/groups/lists/new" variant="primary">New group list</ButtonLink></>} />
        <GroupSectionTabs />
        {!enabled ? <StateNotice kind="empty" title="Capability changed" detail="Keeping the last usable list page visible; mutations remain unavailable." /> : null}
        <Panel title="Group List directory" description="Name search, cursor, and selected list remain URL-addressable." bodyPadding="none">
          <FilterToolbar as="form" onSubmit={(event) => { event.preventDefault(); setParam('search', searchDraft.trim()); }}>
            <Field label="Prefix search" className="min-w-56 flex-1">{(id) => <Input id={id} type="search" value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} />}</Field>
            <div className="flex items-end"><Button type="submit" disabled={searchDraft.trim() === route.search || query.isFetching}>Apply search</Button></div>
          </FilterToolbar>
          {query.error ? <div className="p-4"><Failure error={query.error} onRetry={() => query.refetch()} /></div> : null}
          {query.isPending ? <div className="p-4"><StateNotice kind="loading" title="Loading Group Lists" /></div> : null}
          {items.length ? (
            <Table className="border-0">
              <thead><tr><Th>Group List</Th><Th className="text-right">Groups</Th><Th priority="detail">Authorization</Th><Th priority="detail">Updated</Th><Th priority="supporting" className="text-right">Version</Th></tr></thead>
              <tbody>{items.map((item) => (
                <Tr key={item.id} selected={item.id === groupListId} onClick={() => navigate(`/groups/lists/${encodeURIComponent(item.id)}${params.size ? `?${params}` : ''}`)}>
                  <Td mobileLabel="Group List"><div className="grid gap-0.5"><strong className="font-medium">{item.name}</strong><small className="text-xs text-fg-3">{item.description || item.id}</small></div></Td>
                  <Td mobileLabel="Groups" className="text-right font-mono tabular-nums">{item.groupCount}</Td>
                  <Td mobileLabel="Authorization" priority="detail">{humanizeToken(item.authorizationSource ?? 'unreported')}</Td>
                  <Td mobileLabel="Updated" priority="detail" className="text-fg-2">{relativeTime(item.updatedAt) || 'Not reported'}</Td>
                  <Td mobileLabel="Version" priority="supporting" className="text-right font-mono">{item.version}</Td>
                </Tr>
              ))}</tbody>
            </Table>
          ) : query.data && !query.error ? <div className="p-4"><StateNotice kind="empty" title="No Group Lists" detail={route.search ? 'No Group List matches this prefix.' : 'Create a Group List before creating a campaign.'} /></div> : null}
          <CursorPagination cursor={route.cursor} nextCursor={query.data?.nextCursor ?? undefined} onCursor={(value) => setParam('cursor', value)} />
        </Panel>
      </div>
      {groupListId ? <GroupListInspector id={groupListId} enabled={enabled} eligibilityEnabled={eligibilityEnabled} route={route} setParam={setParam} onClose={() => navigate(`/groups/lists${route.search ? `?search=${encodeURIComponent(route.search)}` : ''}`)} /> : null}
    </>
  );
}

function GroupListInspector({ id, enabled, eligibilityEnabled, route, setParam, onClose }: { id: string; enabled: boolean; eligibilityEnabled: boolean; route: ReturnType<typeof groupListRouteState>; setParam: (key: string, value?: string) => void; onClose: () => void }) {
  const navigate = useNavigate();
  const detail = useGroupList(id, enabled);
  const entries = useGroupListEntries(id, route.groupCursor, enabled && route.tab === 'groups');
  const audit = useGroupListAudit(id, route.auditCursor, enabled && route.tab === 'audit');
  const remove = useDeleteGroupList(id);
  const [confirm, setConfirm] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  useInvalidCursorReset(entries.error, route.groupCursor, () => setParam('groupCursor'));
  useInvalidCursorReset(audit.error, route.auditCursor, () => setParam('auditCursor'));
  const item = detail.data;
  const assessment = useGroupListEligibility(id, item?.version, enabled && eligibilityEnabled && Boolean(item));
  return <>
    <Drawer open onClose={onClose} closeDisabled={remove.isPending} title={item?.name ?? 'Group List'} subtitle={id}>
      {detail.isPending ? <StateNotice kind="loading" title="Loading Group List" /> : detail.error || !item ? <Failure error={detail.error ?? new Error('Group List unavailable.')} onRetry={() => detail.refetch()} /> : (
        <div className="grid gap-4">
          <Panel title="Group List facts" description="Server-owned identity and immutable version facts.">
            <DescriptionList>
              <DescriptionItem label="Group List ID" mono>{item.id}</DescriptionItem>
              <DescriptionItem label="Version">{item.version}</DescriptionItem>
              <DescriptionItem label="Groups">{item.groupCount}</DescriptionItem>
              <DescriptionItem label="Authorization">{humanizeToken(item.authorizationSource ?? 'unreported')}</DescriptionItem>
              <DescriptionItem label="Updated">{relativeTime(item.updatedAt) || 'Not reported'}</DescriptionItem>
            </DescriptionList>
          </Panel>

          <Panel title="Target eligibility" description="Advisory status for the complete current list version.">
            {eligibilityEnabled ? assessment.isPending ? <StateNotice kind="loading" title="Checking target eligibility" /> : assessment.error ? <Failure error={assessment.error} onRetry={() => assessment.refetch()} /> : assessment.data ? <GroupEligibilitySummary value={assessment.data.aggregate} /> : null : <StateNotice kind="info" title="Eligibility summary unavailable" detail="This backend validates eligibility only when a command is submitted." />}
          </Panel>

          <Tabs active={route.tab} onChange={(tab) => setParam('tab', tab === 'groups' ? undefined : tab)} tabs={[{ id: 'groups', label: 'Groups', count: item.groupCount }, { id: 'audit', label: 'Audit' }]} />

          {route.tab === 'groups' ? (
            <Panel title="Target groups" description="Current projected name and eligibility for each snapshotted Group.">
              <div className="grid gap-3">
                {entries.isPending ? <StateNotice kind="loading" title="Loading target groups" /> : entries.error && !entries.data ? <Failure error={entries.error} onRetry={() => entries.refetch()} /> : entries.data ? <>
                  {entries.data.items.length ? <ul className="grid">{entries.data.items.map((entry) => <li key={entry.groupJid} className="grid gap-1 border-b border-line py-3 last:border-b-0"><div className="flex items-center justify-between gap-3"><strong className="truncate text-sm">{entry.currentName ?? entry.snapshotName ?? entry.groupJid}</strong><Status tone={entry.eligibility === 'eligible' ? 'ok' : entry.eligibility === 'unavailable' ? 'failed' : 'degraded'}>{humanizeToken(entry.eligibility)}</Status></div><code className="truncate text-xs text-fg-3">{entry.groupJid}</code>{entry.currentName && entry.snapshotName && entry.currentName !== entry.snapshotName ? <small className="text-xs text-fg-3">Previously: {entry.snapshotName}</small> : null}{entry.eligibilityReason ? <small className="text-xs text-danger">{humanizeToken(entry.eligibilityReason)}</small> : null}</li>)}</ul> : <StateNotice kind="empty" title="No groups" />}
                  <CursorPagination cursor={route.groupCursor} nextCursor={entries.data.nextCursor ?? undefined} onCursor={(value) => setParam('groupCursor', value)} />
                </> : null}
              </div>
            </Panel>
          ) : (
            <Panel title="Group List audit" description="Newest-first version history; current Group List facts remain authoritative.">
              <div className="grid gap-3">
                {audit.isPending ? <StateNotice kind="loading" title="Loading audit" /> : audit.error && !audit.data ? <Failure error={audit.error} onRetry={() => audit.refetch()} /> : audit.data ? <>
                  {audit.data.items.length ? <ol className="grid">{audit.data.items.map((event) => <li key={event.id} className="grid gap-1 border-b border-line py-3 last:border-b-0"><div className="flex justify-between gap-3"><strong className="text-sm">{humanizeToken(event.eventType)}</strong><span className="text-xs text-fg-3">{relativeTime(event.occurredAt) || 'Time unreported'}</span></div><small className="text-xs text-fg-3">{event.fromVersion || '—'} → {event.toVersion || '—'} · {humanizeToken(event.actorType)}</small></li>)}</ol> : <StateNotice kind="empty" title="No audit events" />}
                  <CursorPagination cursor={route.auditCursor} nextCursor={audit.data.nextCursor ?? undefined} onCursor={(value) => setParam('auditCursor', value)} />
                </> : null}
              </div>
            </Panel>
          )}

          <Panel title="List actions" description="Edit creates a new immutable version; deletion leaves campaign snapshots unchanged.">
            <div className="flex flex-wrap gap-2">
              <Button disabled={!enabled} onClick={() => navigate(`/groups/lists/${encodeURIComponent(id)}/edit`)}>Edit</Button>
              <Button variant="danger" disabled={!enabled} onClick={() => { setConfirm(''); setDeleteOpen(true); }}>Delete…</Button>
            </div>
          </Panel>
        </div>
      )}
    </Drawer>
    <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} closeDisabled={remove.isPending} title="Delete Group List?" footer={<><Button disabled={remove.isPending} onClick={() => setDeleteOpen(false)}>Cancel</Button><Button variant="danger" disabled={remove.isPending || confirm !== item?.name} onClick={() => remove.mutate(undefined, { onSuccess: () => { setDeleteOpen(false); onClose(); } })}>{remove.isPending ? 'Deleting…' : 'Delete Group List'}</Button></>}>
      <div className="grid gap-3"><p className="text-sm text-fg-2">Campaign snapshots remain unchanged. Type the exact list name to confirm.</p><Field label="Group List name">{(fieldId) => <Input id={fieldId} value={confirm} onChange={(event) => setConfirm(event.target.value)} />}</Field>{remove.error ? <Failure error={remove.error} /> : null}</div>
    </Dialog>
  </>;
}
