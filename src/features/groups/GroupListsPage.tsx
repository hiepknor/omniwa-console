import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useApiSession } from '@/api/ApiProvider';
import { useServerCapabilities } from '@/api/CapabilitiesProvider';
import { ApiFailureNotice } from '@/components/ApiFailureNotice';
import type { CommandResult, ProjectionMeta } from '@/api/envelopes';
import { GroupEligibilitySummary } from '@/components/GroupEligibilitySummary';
import { humanizeToken, relativeTime } from '@/lib/format';
import { omitSearchParams, withSearchParams } from '@/lib/url-search-state';
import { useInvalidCursorReset } from '@/lib/useInvalidCursorReset';
import { Button, ButtonLink, CursorPagination, DescriptionItem, DescriptionList, Dialog, Drawer, Field, FilterToolbar, IconButton, Input, PageHeader, Panel, StateNotice, Status, Table, Tabs, Td, Th, Tr } from '@/ui';
import { GroupSectionTabs } from './GroupSectionTabs';
import { groupListRouteState, setGroupListParam } from './group-list-route-state';
import { useDeleteGroupList, useGroupList, useGroupListAudit, useGroupListEligibility, useGroupListEntries, useGroupLists } from '@/api/group-list-hooks';

function Failure({ error, onRetry, stale }: { error: unknown; onRetry?: () => void; stale?: boolean }) { return <ApiFailureNotice error={error} title={stale ? 'Showing last known data' : 'Group List request failed'} onRetry={onRetry} />; }

function ProjectionNotice({ meta, resource }: { meta?: ProjectionMeta; resource: string }) {
  if (!meta?.syncStatus || meta.syncStatus === 'ready') return null;
  const labels = {
    syncing: [`${resource} syncing`, 'The returned snapshot is not yet authoritative.'],
    stale: [`Showing stale ${resource.toLowerCase()}`, 'Stored data remains visible, but it may not reflect the latest backend state.'],
    failed: [`${resource} projection failed`, 'No live WhatsApp fallback was used. Retry after projection recovery.'],
    not_started: [`${resource} projection not ready`, 'The projection has not produced an authoritative snapshot yet.'],
  } as const;
  const [title, detail] = labels[meta.syncStatus as keyof typeof labels] ?? [`${resource} unavailable`, 'Projection status is not authoritative.'];
  return <StateNotice kind={meta.syncStatus === 'failed' ? 'error' : meta.syncStatus === 'syncing' ? 'loading' : 'empty'} title={title} detail={detail} />;
}

export function GroupListsPage() {
  const session = useApiSession();
  const capabilities = useServerCapabilities();
  const { groupListId } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const route = groupListRouteState(params);
  const [searchDraft, setSearchDraft] = useState(route.search);
  const [deleteAck, setDeleteAck] = useState<{ name: string; result: CommandResult }>();
  const readEnabled = session.keyKind === 'api' && (capabilities.data?.capabilities.includes('group_lists') ?? false);
  const commandsEnabled = readEnabled && !capabilities.isPending && !capabilities.isError;
  const eligibilityEnabled = capabilities.data?.capabilities.includes('group_list_eligibility') ?? false;
  const query = useGroupLists(route.search, route.cursor, readEnabled);
  const items = useMemo(() => query.data?.items ?? [], [query.data]);
  const setParam = (key: string, value?: string) => setParams(setGroupListParam(params, key, value), { replace: true });
  useInvalidCursorReset(query.error, route.cursor, () => setParam('cursor'));
  useEffect(() => setSearchDraft(route.search), [route.search]);
  const directoryParams = omitSearchParams(params, ['tab', 'groupCursor', 'auditCursor', 'notice']);
  const directoryUrl = withSearchParams('/groups/lists', directoryParams);

  if (session.keyKind !== 'api' || capabilities.isPending || (!readEnabled && !query.data)) {
    const detail = session.keyKind !== 'api' ? 'Group Lists requires an instance credential.' : capabilities.isPending ? 'Discovering Group List capability.' : 'The backend does not advertise group_lists. Enable the complete backend feature before managing campaign targets.';
    return <div className="grid gap-6 p-6 max-sm:p-4"><PageHeader eyebrow="Messaging" title="Group Lists" description="Build and maintain reusable group targets for campaigns." /><GroupSectionTabs /><StateNotice kind="empty" title="Group Lists unavailable" detail={detail} /></div>;
  }

  return (
    <>
      <div className="grid gap-6 p-6 max-sm:p-4">
        <PageHeader eyebrow="Messaging" title="Group Lists" description="Build and maintain reusable group targets for campaigns." secondaryActions={<IconButton icon="refresh" label="Refresh Group Lists" busy={query.isFetching} onClick={() => query.refetch()} />} primaryAction={commandsEnabled ? <ButtonLink to={withSearchParams('/groups/lists/new', directoryParams)} variant="primary">New group list</ButtonLink> : <Button variant="primary" disabled>New group list</Button>} />
        <GroupSectionTabs />
        {deleteAck ? <StateNotice kind="info" title={`${deleteAck.name} deleted`} detail={deleteAck.result.message || 'The server completed the deletion. Existing campaign snapshots remain unchanged.'} /> : null}
        {!commandsEnabled && query.data ? <StateNotice kind={capabilities.isError ? 'error' : 'empty'} title={capabilities.isError ? 'Showing last known capabilities' : 'Capability changed'} detail="Keeping the last usable list page visible; create, edit, and delete commands remain unavailable until capability discovery is authoritative." /> : null}
        <Panel title="Group List directory" description="Name search, cursor, and selected list remain URL-addressable." bodyPadding="none">
          <FilterToolbar as="form" onSubmit={(event) => { event.preventDefault(); setParam('search', searchDraft.trim()); }}>
            <Field label="Prefix search" className="min-w-56 flex-1">{(id) => <Input id={id} type="search" value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} />}</Field>
            <div className="flex items-end"><IconButton type="submit" icon="search" label="Apply Group List search" disabled={searchDraft.trim() === route.search || query.isFetching} /></div>
          </FilterToolbar>
          {query.error ? <div className="p-4"><Failure error={query.error} stale={Boolean(query.data)} onRetry={() => query.refetch()} /></div> : null}
          {query.isPending ? <div className="p-4"><StateNotice kind="loading" title="Loading Group Lists" /></div> : null}
          {query.data?.meta?.syncStatus && query.data.meta.syncStatus !== 'ready' ? <div className="px-4 pt-4"><ProjectionNotice meta={query.data.meta} resource="Group List directory" /></div> : null}
          {items.length ? (
            <Table className="border-0">
              <thead><tr><Th>Group List</Th><Th className="text-right">Groups</Th><Th priority="detail">Authorization</Th><Th priority="detail">Updated</Th><Th priority="supporting" className="text-right">Version</Th></tr></thead>
              <tbody>{items.map((item) => (
                <Tr key={item.id} selected={item.id === groupListId} onClick={() => navigate(withSearchParams(`/groups/lists/${encodeURIComponent(item.id)}`, directoryParams))}>
                  <Td mobileLabel="Group List"><div className="grid gap-0.5"><strong className="font-medium">{item.name}</strong><small className="text-xs text-fg-3">{item.description || item.id}</small></div></Td>
                  <Td mobileLabel="Groups" className="text-right font-mono tabular-nums">{item.groupCount ?? '—'}</Td>
                  <Td mobileLabel="Authorization" priority="detail">{humanizeToken(item.authorizationSource ?? 'unreported')}</Td>
                  <Td mobileLabel="Updated" priority="detail" className="text-fg-2">{relativeTime(item.updatedAt) || 'Not reported'}</Td>
                  <Td mobileLabel="Version" priority="supporting" className="text-right font-mono">{item.version ?? '—'}</Td>
                </Tr>
              ))}</tbody>
            </Table>
          ) : query.data && query.data.meta?.syncStatus && query.data.meta.syncStatus !== 'ready' ? null : query.data ? <div className="p-4"><StateNotice kind="empty" title="No Group Lists" detail={route.search ? 'No Group List matches this prefix.' : 'Create a Group List before creating a campaign.'} /></div> : null}
          <CursorPagination cursor={route.cursor} nextCursor={query.data?.nextCursor ?? undefined} onCursor={(value) => setParam('cursor', value)} />
        </Panel>
      </div>
      {groupListId ? <GroupListInspector id={groupListId} readEnabled={readEnabled} commandsEnabled={commandsEnabled} eligibilityEnabled={eligibilityEnabled} directoryParams={directoryParams} route={route} setParam={setParam} onDeleted={(name, result) => { setDeleteAck({ name, result }); navigate(directoryUrl); }} onClose={() => navigate(directoryUrl)} /> : null}
    </>
  );
}

function GroupListInspector({ id, readEnabled, commandsEnabled, eligibilityEnabled, directoryParams, route, setParam, onDeleted, onClose }: { id: string; readEnabled: boolean; commandsEnabled: boolean; eligibilityEnabled: boolean; directoryParams: URLSearchParams; route: ReturnType<typeof groupListRouteState>; setParam: (key: string, value?: string) => void; onDeleted: (name: string, result: CommandResult) => void; onClose: () => void }) {
  const navigate = useNavigate();
  const detail = useGroupList(id, readEnabled);
  const entries = useGroupListEntries(id, route.groupCursor, readEnabled && route.tab === 'groups');
  const audit = useGroupListAudit(id, route.auditCursor, readEnabled && route.tab === 'audit');
  const remove = useDeleteGroupList(id);
  const [confirm, setConfirm] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  useInvalidCursorReset(entries.error, route.groupCursor, () => setParam('groupCursor'));
  useInvalidCursorReset(audit.error, route.auditCursor, () => setParam('auditCursor'));
  const item = detail.data;
  const assessment = useGroupListEligibility(id, item?.version, readEnabled && eligibilityEnabled && Boolean(item));
  return <>
    <Drawer open onClose={onClose} closeDisabled={remove.isPending} title={item?.name ?? 'Group List'} subtitle={id} footer={item ? <Button disabled={!commandsEnabled} onClick={() => navigate(withSearchParams(`/groups/lists/${encodeURIComponent(id)}/edit`, directoryParams))}>Edit Group List</Button> : undefined}>
      {detail.isPending ? <StateNotice kind="loading" title="Loading Group List" /> : !item ? <Failure error={detail.error ?? new Error('Group List unavailable.')} onRetry={() => detail.refetch()} /> : (
        <div className="grid gap-4">
          {route.notice ? <StateNotice kind="info" title={route.notice === 'created' ? 'Group List created' : 'New Group List version created'} detail={`${item.name} · version ${item.version ?? 'not reported'} · ${item.groupCount ?? '—'} targets`} /> : null}
          {detail.error ? <Failure error={detail.error} stale onRetry={() => detail.refetch()} /> : null}
          <Panel title="Group List facts" description="Server-owned identity and immutable version facts.">
            <DescriptionList>
              <DescriptionItem label="Group List ID" mono>{item.id}</DescriptionItem>
              <DescriptionItem label="Version">{item.version ?? 'Not reported'}</DescriptionItem>
              <DescriptionItem label="Groups">{item.groupCount ?? 'Not reported'}</DescriptionItem>
              <DescriptionItem label="Description">{item.description || 'Not reported'}</DescriptionItem>
              <DescriptionItem label="Authorization">{humanizeToken(item.authorizationSource ?? 'unreported')}</DescriptionItem>
              <DescriptionItem label="Authorized"><span title={item.authorizedAt}>{relativeTime(item.authorizedAt) || 'Not reported'}</span></DescriptionItem>
              <DescriptionItem label="Created"><span title={item.createdAt}>{relativeTime(item.createdAt) || 'Not reported'}</span></DescriptionItem>
              <DescriptionItem label="Updated"><span title={item.updatedAt}>{relativeTime(item.updatedAt) || 'Not reported'}</span></DescriptionItem>
            </DescriptionList>
          </Panel>

          <Panel title="Target eligibility" description="Advisory status for the complete current list version.">
            {eligibilityEnabled ? assessment.isPending ? <StateNotice kind="loading" title="Checking target eligibility" /> : assessment.error && !assessment.data ? <Failure error={assessment.error} onRetry={() => assessment.refetch()} /> : assessment.data ? <><ProjectionNotice meta={assessment.data.meta} resource="Target eligibility" />{assessment.error ? <Failure error={assessment.error} stale onRetry={() => assessment.refetch()} /> : null}<GroupEligibilitySummary value={assessment.data.aggregate} /></> : null : <StateNotice kind="info" title="Eligibility summary unavailable" detail="This backend validates eligibility only when a command is submitted." />}
          </Panel>

          <Tabs active={route.tab} onChange={(tab) => setParam('tab', tab === 'groups' ? undefined : tab)} tabs={[{ id: 'groups', label: 'Groups', count: item.groupCount }, { id: 'audit', label: 'Audit' }]} />

          {route.tab === 'groups' ? (
            <Panel title="Target groups" description="Current projected name and eligibility for each snapshotted Group.">
              <div className="grid gap-3">
                {entries.isPending ? <StateNotice kind="loading" title="Loading target groups" /> : entries.error && !entries.data ? <Failure error={entries.error} onRetry={() => entries.refetch()} /> : entries.data ? <>
                  <ProjectionNotice meta={entries.data.meta} resource="Target groups" />
                  {entries.error ? <Failure error={entries.error} stale onRetry={() => entries.refetch()} /> : null}
                  {entries.data.items.length ? <ul className="grid min-w-0">{entries.data.items.map((entry) => <li key={entry.groupJid} className="grid min-w-0 gap-1 border-b border-line py-3 last:border-b-0"><div className="flex min-w-0 items-center justify-between gap-3"><strong className="min-w-0 truncate text-sm">{entry.currentName ?? entry.snapshotName ?? entry.groupJid}</strong><Status tone={entry.eligibility === 'eligible' ? 'ok' : entry.eligibility === 'unavailable' ? 'failed' : 'degraded'}>{humanizeToken(entry.eligibility)}</Status></div><code className="min-w-0 truncate text-xs text-fg-3">{entry.groupJid}</code>{entry.currentName && entry.snapshotName && entry.currentName !== entry.snapshotName ? <small className="min-w-0 truncate text-xs text-fg-3">Previously: {entry.snapshotName}</small> : null}{entry.eligibilityReason ? <small className="min-w-0 break-words text-xs text-danger">{humanizeToken(entry.eligibilityReason)}</small> : null}</li>)}</ul> : !entries.data.meta?.syncStatus || entries.data.meta.syncStatus === 'ready' ? <StateNotice kind="empty" title="No groups" /> : null}
                  <CursorPagination cursor={route.groupCursor} nextCursor={entries.data.nextCursor ?? undefined} onCursor={(value) => setParam('groupCursor', value)} />
                </> : null}
              </div>
            </Panel>
          ) : (
            <Panel title="Group List audit" description="Newest-first version history; current Group List facts remain authoritative.">
              <div className="grid gap-3">
                {audit.isPending ? <StateNotice kind="loading" title="Loading audit" /> : audit.error && !audit.data ? <Failure error={audit.error} onRetry={() => audit.refetch()} /> : audit.data ? <>
                  <ProjectionNotice meta={audit.data.meta} resource="Group List audit" />
                  {audit.error ? <Failure error={audit.error} stale onRetry={() => audit.refetch()} /> : null}
                  {audit.data.items.length ? <ol className="grid">{audit.data.items.map((event) => <li key={event.id} className="grid gap-1 border-b border-line py-3 last:border-b-0"><div className="flex justify-between gap-3"><strong className="text-sm">{humanizeToken(event.eventType)}</strong><span className="text-xs text-fg-3">{relativeTime(event.occurredAt) || 'Time unreported'}</span></div><small className="text-xs text-fg-3">{event.fromVersion || '—'} → {event.toVersion || '—'} · {humanizeToken(event.actorType)}</small></li>)}</ol> : !audit.data.meta?.syncStatus || audit.data.meta.syncStatus === 'ready' ? <StateNotice kind="empty" title="No audit events" /> : null}
                  <CursorPagination cursor={route.auditCursor} nextCursor={audit.data.nextCursor ?? undefined} onCursor={(value) => setParam('auditCursor', value)} />
                </> : null}
              </div>
            </Panel>
          )}

          <Panel title="Danger zone" description="Deletion leaves existing campaign snapshots unchanged."><Button variant="danger" disabled={!commandsEnabled} onClick={() => { setConfirm(''); setDeleteOpen(true); }}>Delete Group List…</Button></Panel>
        </div>
      )}
    </Drawer>
    <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} closeDisabled={remove.isPending} title="Delete Group List?" footer={<><Button disabled={remove.isPending} onClick={() => setDeleteOpen(false)}>Cancel</Button><Button variant="danger" disabled={remove.isPending || confirm !== item?.name} onClick={() => remove.mutate(undefined, { onSuccess: (result) => { setDeleteOpen(false); if (item) onDeleted(item.name, result); } })}>{remove.isPending ? 'Deleting…' : 'Delete Group List'}</Button></>}>
      <div className="grid gap-3"><p className="text-sm text-fg-2">Campaign snapshots remain unchanged. Type the exact list name to confirm.</p><Field label="Group List name">{(fieldId) => <Input id={fieldId} value={confirm} onChange={(event) => setConfirm(event.target.value)} />}</Field>{remove.error ? <Failure error={remove.error} /> : null}</div>
    </Dialog>
  </>;
}
