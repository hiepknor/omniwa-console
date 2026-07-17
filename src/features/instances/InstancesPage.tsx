import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { instanceKeys } from '@/api/keys';
import { InlineError } from '@/components/InlineError';
import { PageHeader } from '@/components/PageHeader';
import { SelectDropdown } from '@/components/SelectDropdown';
import { relativeTime } from '@/lib/format';
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
  const [createOpen, setCreateOpen] = useState(false);
  const [acceptance, setAcceptance] = useState<string>();
  const search = searchParams.get('search') ?? '';
  const status = searchParams.get('status') ?? '';
  const initialCursor = searchParams.get('cursor') ?? undefined;
  const list = useInstances(initialCursor);
  const detail = useInstance(instanceId);
  const create = useCreateInstance();
  const pages = list.data?.pages ?? [];
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

  return (
    <>
      <PageHeader
        title="Instances"
        actions={
          <>
            <span className="live"><span className="dot"></span>polling</span>
            <button className="btn" type="button" onClick={refresh}>Refresh</button>
            <button className="btn primary" type="button" onClick={() => { create.reset(); setCreateOpen(true); }}>New instance</button>
          </>
        }
      />

      {acceptance && <div className="overview-error" role="status">{acceptance}</div>}
      <section className="instances-workspace" aria-labelledby="instances-table-title">
        <div className="instances-toolbar">
          <div className="instances-toolbar-primary">
            <label className="search-field">
              <span className="visually-hidden">Search instances</span>
              <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
              <input className="search" type="search" value={search} onChange={(event) => setParam('search', event.target.value)} placeholder="Search name or instance ID" />
            </label>
            <SelectDropdown
              label="Status"
              value={status}
              options={[
                { value: '', label: 'All statuses', description: 'Do not filter the table' },
                ...statuses.map((item) => ({
                  value: item,
                  label: item,
                  meta: String(instances.filter((instance) => instance.status === item).length),
                })),
              ]}
              onChange={(nextStatus) => setParam('status', nextStatus)}
            />
          </div>
          <div className="instances-toolbar-meta">
            <span><span className="num">{Number(Boolean(search)) + Number(Boolean(status))}</span> filters active</span>
            <span className="toolbar-separator" aria-hidden="true"></span>
            <span>Updated <span className="num">{relativeTime(latestUpdate) || '—'}</span></span>
          </div>
        </div>

        <div className="tablewrap instances-table" tabIndex={0} role="region" aria-labelledby="instances-table-title">
          {unavailable ? (
            <div className="empty">No instance data yet.</div>
          ) : list.isError ? (
            <InlineError error={list.error} onRetry={list.refetch} />
          ) : list.isLoading ? (
            <div className="empty">—</div>
          ) : filteredInstances.length === 0 ? (
            <div className="empty">{instances.length === 0 ? 'No instances yet.' : 'No instances match these filters.'}</div>
          ) : (
            <>
              <table>
                <caption id="instances-table-title" className="visually-hidden">Instance lifecycle and recent activity</caption>
                <thead><tr><th scope="col">Name</th><th scope="col">ID</th><th scope="col">Status</th><th scope="col" className="r">Msgs 24h</th><th scope="col">Updated</th></tr></thead>
                <tbody>{filteredInstances.map((instance) => (
                  <tr
                    key={instance.id}
                    className={instance.id === instanceId ? 'selected open' : undefined}
                    tabIndex={0}
                    aria-selected={instance.id === instanceId}
                    onClick={() => openInstance(instance.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        openInstance(instance.id);
                      }
                    }}
                  >
                    <td><span className="resource-name">{instance.displayName ?? '—'}</span>{instance.id === instanceId && <span className="row-state">Open</span>}</td>
                    <td><span className="mono">{instance.id}</span></td>
                    <td><span className="status"><span className={`dot ${statusDot(instance.status)}`}></span>{instance.status ?? '—'}</span></td>
                    <td className="num r">—</td>
                    <td className="ts" title={instance.updatedAt}>{relativeTime(instance.updatedAt) || '—'}</td>
                  </tr>
                ))}</tbody>
              </table>
              <div className="table-foot">
                <div><span className="num">{filteredInstances.length} loaded instances</span><span className="freshness">Updated {relativeTime(latestUpdate) || '—'}</span></div>
                <div className="pagination">
                  {list.hasNextPage && <button className="btn" type="button" disabled={list.isFetchingNextPage} onClick={() => void list.fetchNextPage()}>{list.isFetchingNextPage ? 'Loading…' : 'Load more'}</button>}
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {instanceId && (
        detail.data?.resource ? (
          <InstanceDrawer instance={detail.data.resource} onClose={() => navigate(listLocation)} onDestroyed={() => { setAcceptance('Destroy accepted. The list refreshes automatically.'); navigate(listLocation); }} />
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
          onCancel={() => setCreateOpen(false)}
          onCreate={(displayName) => create.mutate(displayName, { onSuccess: () => { setCreateOpen(false); setAcceptance('Create accepted. The new instance will appear after the platform records it.'); } })}
        />
      )}
    </>
  );
}
