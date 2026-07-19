import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import type { GroupResource } from '@/api/groups';
import type { InstanceResource } from '@/api/instances';
import { InlineError } from '@/components/InlineError';
import { MobileFilterSheet } from '@/components/MobileFilterSheet';
import { PageHeader } from '@/components/PageHeader';
import { RealtimeIndicator } from '@/components/RealtimeIndicator';
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

function InstancePicker({ instances, selected, selectedId, onSelect, triggerRef }: {
  instances: InstanceResource[];
  selected: InstanceResource | undefined;
  selectedId: string | undefined;
  onSelect: (instanceId: string) => void;
  triggerRef: RefObject<HTMLButtonElement>;
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

  const pickerLabel = selected
    ? (selected.displayName ?? `Unnamed · ${selected.id}`)
    : selectedId ?? 'Select instance';
  const pickerTitle = selected
    ? `${selected.displayName ?? 'Unnamed instance'} · ${selected.id}`
    : pickerLabel;
  return (
    <div className="chat-picker groups-instance-picker max-[640px]:!w-full" ref={rootRef}>
      <button ref={triggerRef} className="instpick !min-h-11 max-[640px]:!w-full max-[640px]:!max-w-none" type="button" title={pickerTitle} aria-label={`Select instance. Current: ${pickerTitle}`} aria-haspopup="menu" aria-controls="groups-instance-picker-menu" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
        <span className={`dot instance-status-dot ${instanceStatusDot(selected?.status)}`} aria-hidden="true" />
        <span className="instpick-name">{pickerLabel}</span>
        <span className="chev" aria-hidden="true">▾</span>
      </button>
      {open && (
        <div id="groups-instance-picker-menu" className="chat-picker-menu !w-80 max-w-[calc(100vw-2rem)] !overflow-x-hidden max-[640px]:!w-full" role="menu" aria-label="Instances">
          {instances.length > 0 ? instances.map((instance) => (
            <button
              className={`${instance.id === selectedId ? 'is-selected ' : ''}!min-w-0`}
              key={instance.id}
              type="button"
              role="menuitemradio"
              aria-checked={instance.id === selectedId}
              onClick={() => { onSelect(instance.id); setOpen(false); }}
            >
              <span className={`dot ${instanceStatusDot(instance.status)}`} aria-hidden="true" />
              <span className="!min-w-0 overflow-hidden"><strong className="block overflow-hidden text-ellipsis whitespace-nowrap">{instance.displayName ?? 'Unnamed instance'}</strong><small className="mono block max-w-full overflow-hidden text-ellipsis whitespace-nowrap" title={instance.id}>{instance.id}</small></span>
            </button>
          )) : <span className="chat-picker-empty">No instances available</span>}
        </div>
      )}
    </div>
  );
}

function ScopeGate({ label, title, detail, action }: {
  label: string;
  title: string;
  detail: string;
  action?: ReactNode;
}) {
  return (
    <section className="grid min-h-28 grid-cols-[minmax(0,1fr)_auto] items-center gap-6 rounded-[var(--radius-md)] border border-[var(--border-subtle)] !px-6 !py-5 max-[640px]:grid-cols-1 max-[640px]:gap-4 max-[640px]:!px-4" aria-labelledby="groups-scope-gate-title">
      <div className="max-w-2xl">
        <span className="eyebrow">{label}</span>
        <h2 id="groups-scope-gate-title" className="!mt-1 text-[15px] leading-5 font-normal text-[var(--fg)]">{title}</h2>
        <p className="!mt-1 text-xs leading-5 text-[var(--muted)]">{detail}</p>
      </div>
      {action && <div className="flex items-center max-[640px]:w-full max-[640px]:[&>*]:w-full">{action}</div>}
    </section>
  );
}

function MetricCard({ label, value, context }: { label: string; value: number | undefined; context: string }) {
  return (
    <article className="card groups-metric-card max-[640px]:!min-h-[88px] max-[640px]:!p-3">
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
  const zeroGroups = metricsAvailable && groups.length === 0;
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
            ? <span className="groups-state-copy"><strong>No groups synced yet.</strong><span>Groups appear after this instance syncs its group directory.</span><button className="btn" type="button" disabled={refresh.isPending} onClick={() => refresh.mutate()}>{refresh.isPending ? 'Requesting sync…' : 'Refresh group sync'}</button></span>
            : <span className="groups-state-copy"><strong>No groups match these filters.</strong><span>Adjust the search or status filter.</span></span> }
          : { status: 'ready', rows: filteredGroups };
  const stateOnlyTable = tableState.status === 'empty' || tableState.status === 'unavailable' || tableState.status === 'error';
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
      {!zeroGroups && <section className="groups-metric-section max-[640px]:!mb-4" aria-labelledby="groups-posture-title">
        <div className="groups-metric-head">
          <div><h2 id="groups-posture-title">Loaded group posture</h2><span className="groups-posture-note">Counts reflect loaded pages.</span></div>
        </div>
        <div className="metrics groups-metrics max-[640px]:!grid-cols-2">
          <MetricCard label="Synced groups" value={metricsAvailable ? groups.length : undefined} context={metricsAvailable ? 'Loaded groups' : 'Data unavailable'} />
          <MetricCard label="Admins known" value={metricsAvailable ? knownAdmins : undefined} context={metricsAvailable ? `${adminCounts.length} of ${groups.length} loaded groups` : 'Data unavailable'} />
          <MetricCard label="Muted" value={metricsAvailable ? muted : undefined} context={metricsAvailable ? 'Muted locally' : 'Data unavailable'} />
          <MetricCard label="Projection stale" value={metricsAvailable ? stale : undefined} context={metricsAvailable ? 'Not updated for 7d+' : 'Data unavailable'} />
        </div>
      </section>}

      <DataTableWorkspace className="groups-workspace" aria-labelledby="groups-table-title">
        <div className="groups-section-head">
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center justify-between gap-3">
              <h2>Groups</h2>
              {list.isSuccess && !unavailable && groups.length > 0 && <span className="groups-result-count num !mt-0 min-[641px]:!hidden">{filteredGroups.length} visible</span>}
            </div>
            <span className="groups-posture-note">Group directory for this instance</span>
          </div>
          {list.isSuccess && !unavailable && groups.length > 0 && <span className="groups-result-count num max-[640px]:!hidden">{filteredGroups.length} visible</span>}
        </div>
        {groups.length > 0 && <DataTableToolbar>
          <label className="search-field">
            <span className="visually-hidden">Search groups</span>
            <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
            <input className="search" type="search" value={search} onChange={(event) => onSetParam('search', event.target.value)} placeholder="Search loaded groups" />
          </label>
          <span className="data-table-toolbar-desktop-filters"><SelectDropdown label="Status" value={status} options={statusOptions} onChange={(value) => onSetParam('status', value)} /></span>
          <DataTableFilterTrigger ref={filterTriggerRef} count={activeFilters.length} aria-expanded={filterOpen} onClick={() => setFilterOpen(true)} />
          <DataTableActiveFilters filters={activeFilters} />
        </DataTableToolbar>}
        <div className={`groups-table max-[640px]:[&_.empty]:!px-4 max-[640px]:[&_.empty]:!py-8 ${stateOnlyTable ? 'max-[1024px]:[&_.responsive-table]:!w-full max-[1024px]:[&_.responsive-table]:!min-w-0 max-[1024px]:[&_thead]:!hidden' : ''} ${zeroGroups ? '[&_.responsive-table]:!w-full [&_.responsive-table]:!min-w-0 [&_thead]:!hidden [&_.responsive-table-scroll]:!border-b-0' : ''}`}>
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
            footer={zeroGroups ? undefined : <DataTableFooter primary={tableState.status === 'ready' || tableState.status === 'empty' ? <><span className="num">{groups.length} loaded groups</span><span className="freshness">Updated {relativeTime(latestUpdate) || '—'}</span></> : <span className="num">Results —</span>} actions={<><button className="btn" type="button" disabled={refresh.isPending} title="The platform reports whether group discovery completed or continues asynchronously." onClick={() => refresh.mutate()}>Refresh sync</button>{list.hasNextPage && <button className="btn" type="button" disabled={list.isFetchingNextPage} onClick={() => void loadMore()}>{list.isFetchingNextPage ? 'Loading…' : 'Load more'}</button>}</>} />}
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
  const pickerTriggerRef = useRef<HTMLButtonElement>(null);
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
      ? <ScopeGate label="INSTANCE SCOPE" title="Loading instances…" detail="The console is loading the available instance scopes." />
      : picker.data?.unavailable
        ? <ScopeGate label="INSTANCE SCOPE" title="Instances are not available yet" detail="No failure has been reported. The instance projection is still pending." />
        : instances.length === 0
          ? <ScopeGate label="INSTANCE REQUIRED" title="No instances available" detail="Create an instance before loading a group directory." action={<Link className="btn primary" to="/instances?create=1">Create instance</Link>} />
          : <ScopeGate label="INSTANCE REQUIRED" title="Choose an instance" detail="Select an instance to load its group directory and management controls." action={<button className="btn primary" type="button" onClick={() => { pickerTriggerRef.current?.focus(); pickerTriggerRef.current?.click(); }}>Select instance</button>} />;
  }

  return (
    <div className="groups-screen">
      <PageHeader
        title="Groups"
        scope={<InstancePicker instances={instances} selected={selectedInstance} selectedId={instanceId} onSelect={chooseInstance} triggerRef={pickerTriggerRef} />}
        status={<RealtimeIndicator />}
      />
      {pickerReadState.isStaleError && <InlineError error={pickerReadState.error} onRetry={picker.refetch} className="groups-picker-error" />}
      {content}
    </div>
  );
}
