import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import type { GroupResource } from '@/api/groups';
import type { InstanceResource } from '@/api/instances';
import { InlineError } from '@/components/InlineError';
import { MobileFilterSheet } from '@/components/MobileFilterSheet';
import { PageHeader } from '@/components/PageHeader';
import { isTransportError } from '@/components/feedback/feedback-policy';
import { SelectDropdown, type SelectDropdownOption } from '@/components/SelectDropdown';
import {
  DataTable,
  DataTableActiveFilters,
  DataTableFilterTrigger,
  DataTableFooter,
  DataTableToolbar,
  DataTableWorkspace,
  type DataTableColumn,
  type DataTableState,
} from '@/components/data-table';
import { formatCount, relativeTime } from '@/lib/format';
import { useResilientReadState } from '@/lib/query-state';
import { GroupDrawer } from './GroupDrawer';
import { useInstanceGroups, usePickerInstances, useRefreshGroups } from './hooks';

function statusDot(status: string | undefined) {
  switch (status?.toLowerCase()) {
    case 'active':
    case 'synced': return 'dot-ok';
    case 'syncing':
    case 'pending': return 'dot-pending';
    case 'failed': return 'dot-failed';
    case 'archived': return 'dot-muted';
    default: return 'dot-info';
  }
}

function instanceStatusDot(status: string | undefined) {
  switch (status?.toLowerCase()) {
    case 'connected': return 'dot-ok';
    case 'pairing':
    case 'connecting': return 'dot-pending';
    case 'failed':
    case 'disconnected': return 'dot-failed';
    default: return 'dot-info';
  }
}

function InstancePicker({ instances, selected, selectedId, onSelect }: {
  instances: InstanceResource[];
  selected: InstanceResource | undefined;
  selectedId: string | undefined;
  onSelect: (instanceId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeEscape);
    };
  }, [open]);

  const pickerLabel = selected?.displayName ?? selected?.id ?? selectedId ?? 'Select instance';
  return (
    <div className="chat-picker groups-instance-picker" ref={rootRef}>
      <button className="instpick" type="button" title={pickerLabel} aria-label="Select instance" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
        <span className={`dot instance-status-dot ${instanceStatusDot(selected?.status)}`} aria-hidden="true" />
        <span className="instpick-name">{pickerLabel}</span>
        <span className="chev" aria-hidden="true">▾</span>
      </button>
      {open && (
        <div className="chat-picker-menu" role="menu" aria-label="Instances">
          {instances.length > 0 ? instances.map((instance) => (
            <button
              className={instance.id === selectedId ? 'is-selected' : undefined}
              key={instance.id}
              type="button"
              role="menuitemradio"
              aria-checked={instance.id === selectedId}
              onClick={() => { onSelect(instance.id); setOpen(false); }}
            >
              <span className={`dot ${instanceStatusDot(instance.status)}`} aria-hidden="true" />
              <span><strong>{instance.displayName ?? instance.id}</strong><small className="mono">{instance.id}</small></span>
            </button>
          )) : <span className="chat-picker-empty">No instances available</span>}
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, context }: { label: string; value: number | undefined; context: string }) {
  return (
    <article className="card groups-metric-card">
      <div className="label">{label}</div>
      <div className="value num">{value === undefined ? '—' : formatCount(value)}</div>
      <div className="ctx">{context}</div>
    </article>
  );
}

function LocalState({ group }: { group: GroupResource }) {
  const states = [group.muted && 'muted', group.archived && 'archived', group.pinned && 'pinned'].filter((value): value is string => Boolean(value));
  if (states.length === 0) return <>—</>;
  return <span className="groups-local-state">{states.map((state) => <span className="chip" key={state}>{state}</span>)}</span>;
}

function GroupsWorkbench({ instanceId, groupId, onSetParam }: {
  instanceId: string;
  groupId: string | undefined;
  onSetParam: (name: string, value: string) => void;
}) {
  const [searchParams] = useSearchParams();
  const [filterOpen, setFilterOpen] = useState(false);
  const filterTriggerRef = useRef<HTMLButtonElement>(null);
  const initialCursor = searchParams.get('cursor') ?? undefined;
  const list = useInstanceGroups(instanceId, initialCursor);
  const refresh = useRefreshGroups(instanceId);
  const pages = list.data?.pages ?? [];
  const readState = useResilientReadState(list, pages.some((page) => page.resource !== undefined));
  const unavailable = pages.some((page) => page.unavailable !== undefined);
  const groups = useMemo(() => pages.flatMap((page) => page.resource?.items ?? []), [pages]);
  const search = searchParams.get('search') ?? '';
  const status = searchParams.get('status') ?? '';
  const filteredGroups = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return groups.filter((group) => {
      const matchesSearch = !needle || group.id.toLowerCase().includes(needle) || group.subject?.toLowerCase().includes(needle);
      return matchesSearch && (!status || group.status === status);
    });
  }, [groups, search, status]);
  const statuses = [...new Set(groups.map((group) => group.status).filter((value): value is string => Boolean(value)))].sort();
  const latestUpdate = groups.map((group) => group.updatedAt).filter((value): value is string => value !== undefined).sort().at(-1);
  const adminCounts = groups.filter((group) => group.adminCount !== undefined);
  const knownAdmins = adminCounts.reduce((total, group) => total + (group.adminCount ?? 0), 0);
  const muted = groups.filter((group) => group.muted).length;
  const staleCutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const stale = groups.filter((group) => group.updatedAt !== undefined && new Date(group.updatedAt).getTime() < staleCutoff).length;
  const metricsAvailable = !readState.isInitialLoading && !readState.isInitialError && !(unavailable && groups.length === 0);
  const selectedGroup = groups.find((group) => group.id === groupId);

  const columns: DataTableColumn<GroupResource>[] = [
    {
      id: 'group', header: 'Group', size: 'xl', kind: 'identity', sticky: 'identity', mobile: 'identity',
      cell: (group) => <span className="groups-namecell"><span><span className="resource-name">{group.subject ?? <span className="mono">{group.id}</span>}</span><span className="row-id mono">{group.id}</span></span></span>,
    },
    { id: 'members', header: 'Members', size: 'sm', kind: 'numeric', align: 'end', mobile: 'secondary', cell: (group) => <span className="num">{group.memberCount ?? '—'}</span> },
    { id: 'admins', header: 'Admins', size: 'sm', kind: 'numeric', align: 'end', mobile: 'hidden', cell: (group) => <span className="num">{group.adminCount ?? '—'}</span> },
    { id: 'local', header: 'Local state', size: 'lg', mobile: 'hidden', cell: (group) => <LocalState group={group} /> },
    { id: 'status', header: 'Status', size: 'md', kind: 'status', mobile: 'secondary', cell: (group) => <span className="status"><span className={`dot ${statusDot(group.status)}`} />{group.status ?? '—'}</span> },
    { id: 'updated', header: 'Updated', size: 'md', kind: 'date', align: 'end', mobile: 'meta', cell: (group) => <span className="ts" title={group.updatedAt}>{relativeTime(group.updatedAt) || '—'}</span>, mobileCell: (group) => relativeTime(group.updatedAt) || undefined },
  ];
  const tableState: DataTableState<GroupResource> = readState.isInitialError
    ? { status: 'error', error: readState.error, onRetry: list.refetch }
    : readState.isInitialLoading
      ? { status: 'loading', skeletonRows: 6 }
      : unavailable && groups.length === 0
        ? { status: 'unavailable', message: <span className="groups-state-copy"><strong>Group data is not available yet.</strong><span>No failure has been reported. This read remains pending.</span></span> }
        : filteredGroups.length === 0
          ? { status: 'empty', message: groups.length === 0
            ? <span className="groups-state-copy"><strong>No groups synced yet.</strong><span>Groups appear after a connected instance syncs its group directory.</span></span>
            : <span className="groups-state-copy"><strong>No groups match these filters.</strong><span>Adjust the search or status filter.</span></span> }
          : { status: 'ready', rows: filteredGroups };
  const statusOptions: SelectDropdownOption[] = [
    { value: '', label: 'All statuses', description: 'Do not filter the table' },
    ...statuses.map((item) => ({ value: item, label: item, meta: String(groups.filter((group) => group.status === item).length) })),
  ];
  const activeFilters = status ? [{ id: 'status', label: `Status: ${status}`, onRemove: () => onSetParam('status', '') }] : [];
  const closeGroup = () => {
    const activeRow = document.querySelector<HTMLElement>('.groups-table tr[data-active="true"]');
    onSetParam('group', '');
    window.requestAnimationFrame(() => activeRow?.focus());
  };
  const loadMore = async () => {
    const nextCursor = pages.at(-1)?.resource?.pagination?.nextCursor;
    if (!nextCursor) return;
    const result = await list.fetchNextPage();
    if (!result.isError) onSetParam('cursor', nextCursor);
  };

  return (
    <>
      <section className="groups-metric-section" aria-labelledby="groups-posture-title">
        <div className="groups-metric-head">
          <div><h2 id="groups-posture-title">Loaded group posture</h2><span className="groups-posture-note">Counts reflect loaded pages.</span></div>
        </div>
        <div className="metrics groups-metrics">
          <MetricCard label="Synced groups" value={metricsAvailable ? groups.length : undefined} context={metricsAvailable ? 'Loaded groups' : 'Data unavailable'} />
          <MetricCard label="Admins known" value={metricsAvailable ? knownAdmins : undefined} context={metricsAvailable ? `${adminCounts.length} of ${groups.length} loaded groups` : 'Data unavailable'} />
          <MetricCard label="Muted" value={metricsAvailable ? muted : undefined} context={metricsAvailable ? 'Muted locally' : 'Data unavailable'} />
          <MetricCard label="Projection stale" value={metricsAvailable ? stale : undefined} context={metricsAvailable ? 'Not updated for 7d+' : 'Data unavailable'} />
        </div>
      </section>

      <DataTableWorkspace className="groups-workspace" aria-labelledby="groups-table-title">
        <div className="groups-section-head"><div><h2>Groups</h2><span className="groups-posture-note">Group directory for this instance</span></div>{list.isSuccess && !unavailable && <span className="groups-result-count num">{filteredGroups.length} visible</span>}</div>
        <DataTableToolbar>
          <label className="search-field">
            <span className="visually-hidden">Search groups</span>
            <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
            <input className="search" type="search" value={search} onChange={(event) => onSetParam('search', event.target.value)} placeholder="Search loaded groups" />
          </label>
          <span className="data-table-toolbar-desktop-filters"><SelectDropdown label="Status" value={status} options={statusOptions} onChange={(value) => onSetParam('status', value)} /></span>
          <DataTableFilterTrigger ref={filterTriggerRef} count={activeFilters.length} aria-expanded={filterOpen} onClick={() => setFilterOpen(true)} />
          <DataTableActiveFilters filters={activeFilters} />
        </DataTableToolbar>
        <div className="groups-table">
          <DataTable
            caption="Groups with membership counts, local state, status, and update time"
            captionId="groups-table-title"
            layout="wide"
            attached
            columns={columns}
            state={tableState}
            refreshIssue={readState.isStaleError ? { error: readState.error, onRetry: list.refetch } : undefined}
            getRowKey={(group) => group.id}
            getRowState={(group) => ({ active: group.id === groupId })}
            getRowActionLabel={(group) => `Open group ${group.subject ?? group.id}`}
            getRowProps={(group) => ({
              className: 'responsive-table-actionable',
              tabIndex: 0,
              onClick: () => onSetParam('group', group.id),
              onKeyDown: (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onSetParam('group', group.id);
                }
              },
            })}
            footer={<DataTableFooter primary={tableState.status === 'ready' || tableState.status === 'empty' ? <><span className="num">{groups.length} loaded groups</span><span className="freshness">Updated {relativeTime(latestUpdate) || '—'}</span></> : <span className="num">Results —</span>} actions={<><button className="btn" type="button" disabled={refresh.isPending} title="The platform refreshes group projections asynchronously." onClick={() => refresh.mutate()}>Refresh sync</button>{list.hasNextPage && <button className="btn" type="button" disabled={list.isFetchingNextPage} onClick={() => void loadMore()}>{list.isFetchingNextPage ? 'Loading…' : 'Load more'}</button>}</>} />}
          />
        </div>
      </DataTableWorkspace>

      <MobileFilterSheet open={filterOpen} title="Filter groups" onClose={() => setFilterOpen(false)} returnFocusRef={filterTriggerRef}>
        <section className="mobile-filter-section" aria-labelledby="group-status-filter"><h3 id="group-status-filter">Status</h3><div className="mobile-filter-options">
          {statusOptions.map((option) => <button key={option.value} className={option.value === status ? 'is-selected' : undefined} type="button" aria-pressed={option.value === status} onClick={() => onSetParam('status', option.value)}><span className="filter-option-check" aria-hidden="true">✓</span><span>{option.label}</span>{option.meta && <span className="num">{option.meta}</span>}</button>)}
        </div></section>
        <button className="btn primary mobile-filter-done" type="button" onClick={() => setFilterOpen(false)}>Done</button>
      </MobileFilterSheet>

      {groupId && <GroupDrawer groupId={groupId} subject={selectedGroup?.subject} onClose={closeGroup} />}
    </>
  );
}

export function GroupsPage() {
  const { instanceId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const picker = usePickerInstances();
  const pickerReadState = useResilientReadState(picker, picker.data?.resource !== undefined);
  const instances = picker.data?.resource?.items ?? [];
  const selectedInstance = instances.find((instance) => instance.id === instanceId);
  const groupId = searchParams.get('group') || undefined;

  useEffect(() => {
    if (instanceId !== undefined || instances.length !== 1) return;
    const onlyInstance = instances[0];
    if (!onlyInstance) return;
    const suffix = searchParams.size > 0 ? `?${searchParams.toString()}` : '';
    navigate(`/groups/${encodeURIComponent(onlyInstance.id)}${suffix}`, { replace: true });
  }, [instanceId, instances, navigate, searchParams]);

  const chooseInstance = (nextInstanceId: string) => {
    const next = new URLSearchParams(searchParams);
    next.delete('group');
    next.delete('cursor');
    const suffix = next.size > 0 ? `?${next.toString()}` : '';
    navigate(`/groups/${encodeURIComponent(nextInstanceId)}${suffix}`);
  };
  const setParam = (name: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(name, value); else next.delete(name);
    if (name === 'search' || name === 'status') next.delete('cursor');
    setSearchParams(next, { replace: true });
  };

  let content: React.ReactNode;
  if (instanceId) {
    content = <GroupsWorkbench instanceId={instanceId} groupId={groupId} onSetParam={setParam} />;
  } else if (pickerReadState.isInitialError) {
    content = isTransportError(pickerReadState.error)
      ? <div className="empty groups-picker-state">Instances are unavailable while the API reconnects.</div>
      : <InlineError error={pickerReadState.error} onRetry={picker.refetch} />;
  } else {
    content = pickerReadState.isInitialLoading
      ? <div className="empty groups-picker-state">Loading instances…</div>
      : picker.data?.unavailable
        ? <div className="empty groups-picker-state">Instances are not available yet.</div>
        : <div className="empty groups-picker-state"><span className="groups-state-copy"><strong>Select an instance</strong><span>Choose an instance to review its synced groups.</span></span></div>;
  }

  return (
    <div className="groups-screen">
      <PageHeader title="Groups" meta={<InstancePicker instances={instances} selected={selectedInstance} selectedId={instanceId} onSelect={chooseInstance} />} />
      {pickerReadState.isStaleError && <InlineError error={pickerReadState.error} onRetry={picker.refetch} className="groups-picker-error" />}
      {content}
    </div>
  );
}
