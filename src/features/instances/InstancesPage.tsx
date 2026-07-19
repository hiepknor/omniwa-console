import { useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { instanceKeys } from '@/api/keys';
import { InlineError } from '@/components/InlineError';
import { useFeedback } from '@/components/feedback/FeedbackProvider';
import { MobileFilterSheet } from '@/components/MobileFilterSheet';
import { PageHeader } from '@/components/PageHeader';
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
import { SelectDropdown, type SelectDropdownOption } from '@/components/SelectDropdown';
import { relativeTime } from '@/lib/format';
import { useResilientReadState } from '@/lib/query-state';
import { CreateInstanceDialog } from './CreateInstanceDialog';
import { InstanceDrawer } from './InstanceDrawer';
import { useCreateInstance, useInstance, useInstances } from './hooks';

function statusDot(status: string | undefined) {
  switch (status?.toLowerCase()) {
    case 'connected': return 'dot-ok';
    case 'pairing':
    case 'connecting': return 'dot-pending';
    case 'failed':
    case 'disconnected': return 'dot-failed';
    default: return 'dot-info';
  }
}

function DrawerState({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <aside className="drawer instances-drawer" aria-label="Instance details">
      <header className="drawer-head">
        <div className="drawer-identity"><span className="eyebrow">Instance management</span><div className="drawer-title-row"><h2>Instance details</h2></div></div>
        <button className="close" type="button" aria-label="Close instance details" onClick={onClose}>✕</button>
      </header>
      <div className="drawer-scroll">{children}</div>
    </aside>
  );
}

export function InstancesPage() {
  const { instanceId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const createOpen = searchParams.get('create') === '1';
  const [filterOpen, setFilterOpen] = useState(false);
  const filterTriggerRef = useRef<HTMLButtonElement>(null);
  const feedback = useFeedback();
  const search = searchParams.get('search') ?? '';
  const status = searchParams.get('status') ?? '';
  const initialCursor = searchParams.get('cursor') ?? undefined;
  const list = useInstances(initialCursor);
  const detail = useInstance(instanceId);
  const create = useCreateInstance();
  const pages = list.data?.pages ?? [];
  const listReadState = useResilientReadState(list, pages.some((page) => page.resource !== undefined));
  const unavailable = pages.some((page) => page.unavailable !== undefined);
  const instances = useMemo(
    () => pages.flatMap((page) => page.resource?.items ?? []),
    [pages],
  );
  const filteredInstances = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return instances.filter((instance) => {
      const matchesSearch = !normalizedSearch || instance.id.toLowerCase().includes(normalizedSearch) || instance.displayName?.toLowerCase().includes(normalizedSearch);
      const matchesStatus = !status || instance.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [instances, search, status]);
  const statuses = [...new Set(instances.map((instance) => instance.status).filter((value): value is string => Boolean(value)))].sort();
  const latestUpdate = instances
    .map((instance) => instance.updatedAt)
    .filter((value): value is string => value !== undefined)
    .sort()
    .at(-1);

  const setParam = (name: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(name, value); else next.delete(name);
    if (name !== 'cursor') next.delete('cursor');
    setSearchParams(next, { replace: true });
  };
  const listLocation = `/instances${searchParams.size ? `?${searchParams.toString()}` : ''}`;
  const openInstance = (id: string) => navigate(`/instances/${encodeURIComponent(id)}${searchParams.size ? `?${searchParams.toString()}` : ''}`);
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: instanceKeys.root });
    void queryClient.invalidateQueries({ queryKey: instanceKeys.provider });
  };
  const loadMore = async () => {
    const nextCursor = pages.at(-1)?.resource?.pagination?.nextCursor;
    if (!nextCursor) return;
    const result = await list.fetchNextPage();
    if (!result.isError) setParam('cursor', nextCursor);
  };
  type InstanceRow = (typeof instances)[number];
  const columns: DataTableColumn<InstanceRow>[] = [
    {
      id: 'name',
      header: 'Name',
      size: 'xl',
      kind: 'identity',
      sticky: 'identity',
      mobile: 'identity',
      cell: (instance) => <><span className="resource-name">{instance.displayName ?? 'Unnamed instance'}</span>{instance.id === instanceId && <span className="row-state">Open</span>}</>,
    },
    { id: 'id', header: 'ID', size: 'lg', kind: 'identifier', mobile: 'identifier', cell: (instance) => <span className="mono" title={instance.id}>{instance.id}</span> },
    {
      id: 'status',
      header: 'Status',
      size: 'md',
      kind: 'status',
      mobile: 'secondary',
      cell: (instance) => <span className="status"><span className={`dot ${statusDot(instance.status)}`}></span>{instance.status ?? '—'}</span>,
    },
    { id: 'messages', header: 'Msgs 24h', size: 'sm', kind: 'numeric', align: 'end', mobile: 'hidden', cell: () => <span className="num">—</span> },
    {
      id: 'updated',
      header: 'Updated',
      size: 'md',
      kind: 'date',
      mobile: 'meta',
      cell: (instance) => <span className="ts" title={instance.updatedAt}>{relativeTime(instance.updatedAt) || '—'}</span>,
      mobileCell: (instance) => relativeTime(instance.updatedAt) || undefined,
    },
  ];
  const tableState: DataTableState<InstanceRow> = listReadState.isInitialError
    ? { status: 'error', error: listReadState.error, onRetry: list.refetch }
    : listReadState.isInitialLoading
      ? { status: 'loading', skeletonRows: 6 }
      : unavailable && instances.length === 0
        ? { status: 'unavailable', message: 'No instance data yet.' }
        : filteredInstances.length === 0
          ? { status: 'empty', message: instances.length === 0 ? 'No instances yet.' : 'No instances match these filters.' }
          : { status: 'ready', rows: filteredInstances };
  const statusOptions: SelectDropdownOption[] = [
    { value: '', label: 'All statuses', description: 'Do not filter the table' },
    ...statuses.map((item) => ({
      value: item,
      label: item,
      meta: String(instances.filter((instance) => instance.status === item).length),
    })),
  ];
  const activeFilters = status
    ? [{ id: 'status', label: `Status: ${status}`, onRemove: () => setParam('status', '') }]
    : [];

  return (
    <>
      <PageHeader
        title="Instances"
        actions={
          <button className="btn primary" type="button" onClick={() => { create.reset(); setParam('create', '1'); }}>New instance</button>
        }
      />

      <DataTableWorkspace className="instances-workspace" aria-labelledby="instances-table-title">
        <DataTableToolbar>
          <label className="search-field">
            <span className="visually-hidden">Search instances</span>
            <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
            <input className="search" type="search" value={search} onChange={(event) => setParam('search', event.target.value)} placeholder="Search name or instance ID" />
          </label>
          <span className="data-table-toolbar-desktop-filters">
            <SelectDropdown label="Status" value={status} options={statusOptions} onChange={(nextStatus) => setParam('status', nextStatus)} />
          </span>
          <DataTableFilterTrigger
            ref={filterTriggerRef}
            count={activeFilters.length}
            aria-expanded={filterOpen}
            onClick={() => setFilterOpen(true)}
          />
          <DataTableActiveFilters filters={activeFilters} />
        </DataTableToolbar>

        <DataTable
          caption="Instance lifecycle and recent activity"
          captionId="instances-table-title"
          layout="standard"
          attached
          columns={columns}
          state={tableState}
          refreshIssue={listReadState.isStaleError ? { error: listReadState.error, onRetry: list.refetch } : undefined}
          getRowKey={(instance) => instance.id}
          getRowState={(instance) => ({ active: instance.id === instanceId })}
          getRowActionLabel={(instance) => `Open ${instance.displayName ?? instance.id}`}
          getRowProps={(instance) => ({
            className: 'responsive-table-actionable',
            tabIndex: 0,
            onClick: () => openInstance(instance.id),
            onKeyDown: (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openInstance(instance.id);
              }
            },
          })}
          footer={(
            <DataTableFooter
              primary={tableState.status === 'ready' || tableState.status === 'empty' ? <><span className="num">{filteredInstances.length} loaded instances</span><span className="freshness">Updated {relativeTime(latestUpdate) || '—'}</span></> : <span className="num">Results —</span>}
              actions={<div className="pagination"><button className="btn" type="button" onClick={refresh}>Refresh</button>{list.hasNextPage && <button className="btn" type="button" disabled={list.isFetchingNextPage} onClick={() => void loadMore()}>{list.isFetchingNextPage ? 'Loading…' : 'Load more'}</button>}</div>}
            />
          )}
        />
      </DataTableWorkspace>

      <MobileFilterSheet open={filterOpen} title="Filter instances" onClose={() => setFilterOpen(false)} returnFocusRef={filterTriggerRef}>
        <section className="mobile-filter-section" aria-labelledby="instance-status-filter">
          <h3 id="instance-status-filter">Status</h3>
          <div className="mobile-filter-options">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                className={option.value === status ? 'is-selected' : undefined}
                type="button"
                aria-pressed={option.value === status}
                onClick={() => setParam('status', option.value)}
              >
                <span className="filter-option-check" aria-hidden="true">✓</span>
                <span>{option.label}</span>
                {option.meta && <span className="num">{option.meta}</span>}
              </button>
            ))}
          </div>
        </section>
        <button className="btn primary mobile-filter-done" type="button" onClick={() => setFilterOpen(false)}>Done</button>
      </MobileFilterSheet>

      {instanceId && (
        detail.data?.resource ? (
          <InstanceDrawer instance={detail.data.resource} onClose={() => navigate(listLocation)} onDestroyed={(result) => {
            feedback.command(result.disposition, { action: 'Destroy instance', acceptedDetail: 'The platform accepted the command. The list refreshes automatically.', completedDetail: 'The platform destroyed the instance. The list refreshes automatically.', requestId: result.requestId, dedupeKey: `instance:${detail.data.resource?.id}:destroy` });
            navigate(listLocation);
          }} />
        ) : detail.data?.unavailable ? (
          <DrawerState onClose={() => navigate(listLocation)}><div className="empty">Instance data is not available yet.</div></DrawerState>
        ) : detail.isError ? (
          <DrawerState onClose={() => navigate(listLocation)}><InlineError error={detail.error} onRetry={detail.refetch} /></DrawerState>
        ) : (
          <DrawerState onClose={() => navigate(listLocation)}><div className="empty">—</div></DrawerState>
        )
      )}

      {createOpen && (
        <CreateInstanceDialog
          error={create.error}
          isPending={create.isPending}
          onCancel={() => setParam('create', '')}
          onCreate={(displayName) => create.mutate(displayName, { onSuccess: (result) => {
            setParam('create', '');
            feedback.command(result.disposition, { action: 'Create instance', acceptedDetail: 'The platform accepted the command. The instance will appear after it is recorded.', completedDetail: 'The platform created the instance.', requestId: result.requestId, dedupeKey: 'instance:create' });
          } })}
        />
      )}
    </>
  );
}
