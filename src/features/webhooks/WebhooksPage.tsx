import { useMemo, useRef, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { opsKeys } from '@/api/keys';
import { InlineError } from '@/components/InlineError';
import { useFeedback } from '@/components/feedback/FeedbackProvider';
import { MobileFilterSheet } from '@/components/MobileFilterSheet';
import { PageHeader } from '@/components/PageHeader';
import { SelectDropdown, type SelectDropdownOption } from '@/components/SelectDropdown';
import {
  DataTable, DataTableActiveFilters, DataTableFilterTrigger, DataTableFooter, DataTableToolbar, DataTableWorkspace,
  type DataTableColumn, type DataTableState,
} from '@/components/data-table';
import { relativeTime } from '@/lib/format';
import { RegisterWebhookDialog } from './RegisterWebhookDialog';
import { WebhookDrawer, webhookStatusDot } from './WebhookDrawer';
import { useRegisterWebhook, useWebhook, useWebhookDeliveries, useWebhooks } from './hooks';

function MetricCard({ label, value, context, attention }: { label: string; value: number | undefined; context: string; attention?: boolean }) {
  return <article className={`card webhook-metric-card${attention ? ' webhook-metric-action' : ''}`}><span className="label">{label}</span><strong className={`value${value === undefined ? ' webhook-value-unavailable' : ' num'}`}>{value ?? 'Loading…'}</strong><span className={`ctx${attention ? ' bad' : ''}`}>{context}</span></article>;
}

function EventChips({ events }: { events: string[] | undefined }) {
  const shown = (events ?? []).slice(0, 2);
  return shown.length ? <div className="capchips webhook-event-chips">{shown.map((event) => <span className="chip" key={event}>{event}</span>)}{(events?.length ?? 0) > 2 && <span className="chip">+{(events?.length ?? 0) - 2}</span>}</div> : <span>—</span>;
}

function DrawerState({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return <aside className="drawer webhook-drawer" aria-label="Webhook details"><header className="drawer-head"><div className="drawer-identity"><span className="eyebrow">Webhook management</span><div className="drawer-title-row"><h2>Webhook details</h2></div></div><button className="close" type="button" aria-label="Close webhook details" onClick={onClose}>✕</button></header><div className="drawer-scroll">{children}</div></aside>;
}

export function WebhooksPage() {
  const { webhookId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const feedback = useFeedback();
  const [registerOpen, setRegisterOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterTriggerRef = useRef<HTMLButtonElement>(null);
  const search = searchParams.get('search') ?? '';
  const status = searchParams.get('status') ?? '';
  const list = useWebhooks();
  const deliveriesQuery = useWebhookDeliveries();
  const detail = useWebhook(webhookId);
  const register = useRegisterWebhook();
  const pages = list.data?.pages ?? [];
  const webhooks = useMemo(() => pages.flatMap((page) => page.resource?.items ?? []), [pages]);
  const deliveries = useMemo(() => (deliveriesQuery.data?.pages ?? []).flatMap((page) => page.resource?.items ?? []), [deliveriesQuery.data?.pages]);
  const unavailable = pages.some((page) => page.unavailable !== undefined);
  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return webhooks.filter((webhook) => (!needle || webhook.id.toLowerCase().includes(needle) || webhook.eventTypes?.some((event) => event.toLowerCase().includes(needle))) && (!status || webhook.status === status));
  }, [search, status, webhooks]);
  const statuses = [...new Set(webhooks.map((webhook) => webhook.status).filter((value): value is string => Boolean(value)))].sort();
  const latestUpdate = webhooks.map((webhook) => webhook.updatedAt).filter((value): value is string => value !== undefined).sort().at(-1);
  const failedDeliveries = deliveries.filter((delivery) => delivery.status?.toLowerCase() === 'failed').length;

  const setParam = (name: string, value: string) => { const next = new URLSearchParams(searchParams); if (value) next.set(name, value); else next.delete(name); setSearchParams(next, { replace: true }); };
  const querySuffix = searchParams.size ? `?${searchParams.toString()}` : '';
  const closeDrawer = () => navigate(`/webhooks${querySuffix}`);
  const refresh = () => { void queryClient.invalidateQueries({ queryKey: opsKeys.webhooks }); void queryClient.invalidateQueries({ queryKey: opsKeys.webhookDeliveries }); };
  type WebhookRow = (typeof webhooks)[number];
  const columns: DataTableColumn<WebhookRow>[] = [
    { id: 'id', header: 'ID', size: 'lg', kind: 'identifier', sticky: 'identity', mobile: 'identity', cell: (webhook) => <><span className="mono" title={webhook.id}>{webhook.id}</span>{webhook.id === webhookId && <span className="row-state">Open</span>}</> },
    { id: 'status', header: 'Status', size: 'md', kind: 'status', mobile: 'secondary', cell: (webhook) => <span className="status"><span className={`dot ${webhookStatusDot(webhook.status)}`} />{webhook.status ?? '—'}</span> },
    { id: 'events', header: 'Event types', size: 'xl', mobile: 'identifier', cell: (webhook) => <EventChips events={webhook.eventTypes} /> },
    { id: 'created', header: 'Created', size: 'md', kind: 'date', mobile: 'hidden', cell: (webhook) => <span className="ts" title={webhook.createdAt}>{relativeTime(webhook.createdAt) || '—'}</span> },
    { id: 'updated', header: 'Updated', size: 'md', kind: 'date', mobile: 'meta', cell: (webhook) => <span className="ts" title={webhook.updatedAt}>{relativeTime(webhook.updatedAt) || '—'}</span>, mobileCell: (webhook) => relativeTime(webhook.updatedAt) || undefined },
  ];
  const tableState: DataTableState<WebhookRow> = unavailable ? { status: 'unavailable', message: 'Webhook data is not available yet.' } : list.isError ? { status: 'error', error: list.error, onRetry: list.refetch } : list.isLoading ? { status: 'loading', skeletonRows: 6 } : filtered.length === 0 ? { status: 'empty', message: webhooks.length ? 'No webhooks match these filters.' : 'No webhooks registered.' } : { status: 'ready', rows: filtered };
  const statusOptions: SelectDropdownOption[] = [{ value: '', label: 'All statuses', description: 'Do not filter the table' }, ...statuses.map((item) => ({ value: item, label: item, meta: String(webhooks.filter((webhook) => webhook.status === item).length) }))];
  const activeFilters = status ? [{ id: 'status', label: `Status: ${status}`, onRemove: () => setParam('status', '') }] : [];

  return <>
    <PageHeader title="Webhooks" actions={<><button className="btn" type="button" onClick={refresh}>Refresh</button><button className="btn primary" type="button" onClick={() => { register.reset(); setRegisterOpen(true); }}>Register webhook</button></>} />
    <section className="webhook-metric-section" aria-labelledby="webhook-posture-title"><div className="webhook-metric-head"><div><h2 id="webhook-posture-title">Loaded endpoint posture</h2><span className="webhook-posture-note">Counts reflect loaded webhook and delivery pages.</span></div></div><div className="metrics webhook-metrics"><MetricCard label="Registered" value={list.isLoading ? undefined : webhooks.length} context="Loaded endpoints" /><MetricCard label="Active" value={list.isLoading ? undefined : webhooks.filter((item) => item.status === 'active').length} context="Accepting deliveries" /><MetricCard label="Suspended" value={list.isLoading ? undefined : webhooks.filter((item) => item.status === 'suspended').length} context="Delivery paused" /><MetricCard label="Failed deliveries" value={deliveriesQuery.isLoading ? undefined : failedDeliveries} context={failedDeliveries ? 'Operator action may be required' : 'None in loaded data'} attention={failedDeliveries > 0} /></div>{deliveriesQuery.isError && <InlineError error={deliveriesQuery.error} onRetry={deliveriesQuery.refetch} className="webhook-metric-error" />}{(deliveriesQuery.data?.pages ?? []).some((page) => page.unavailable) && <div className="empty webhook-metric-error">Delivery posture is not available yet.</div>}</section>
    <DataTableWorkspace className="webhooks-workspace" aria-labelledby="webhooks-table-title"><div className="webhook-section-head"><div><h2>Webhook endpoints</h2><span className="webhook-posture-note">Select an endpoint to manage lifecycle and delivery recovery.</span></div><span className="webhook-result-count num">{filtered.length} visible</span></div><DataTableToolbar><label className="search-field"><span className="visually-hidden">Search webhooks</span><svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg><input className="search" type="search" value={search} onChange={(event) => setParam('search', event.target.value)} placeholder="Search ID or event type" /></label><span className="data-table-toolbar-desktop-filters"><SelectDropdown label="Status" value={status} options={statusOptions} onChange={(value) => setParam('status', value)} /></span><DataTableFilterTrigger ref={filterTriggerRef} count={activeFilters.length} aria-expanded={filterOpen} onClick={() => setFilterOpen(true)} /><DataTableActiveFilters filters={activeFilters} /></DataTableToolbar><DataTable caption="Registered webhook endpoints" captionId="webhooks-table-title" layout="wide" attached columns={columns} state={tableState} getRowKey={(webhook) => webhook.id} getRowState={(webhook) => ({ active: webhook.id === webhookId })} getRowActionLabel={(webhook) => `Open webhook ${webhook.id}`} getRowProps={(webhook) => ({ className: 'responsive-table-actionable', tabIndex: 0, onClick: () => navigate(`/webhooks/${encodeURIComponent(webhook.id)}${querySuffix}`), onKeyDown: (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); navigate(`/webhooks/${encodeURIComponent(webhook.id)}${querySuffix}`); } } })} footer={<DataTableFooter primary={tableState.status === 'ready' || tableState.status === 'empty' ? <><span className="num">{filtered.length} loaded webhooks</span><span className="freshness">Updated {relativeTime(latestUpdate) || '—'}</span></> : <span className="num">Results —</span>} actions={list.hasNextPage ? <button className="btn" type="button" disabled={list.isFetchingNextPage} onClick={() => void list.fetchNextPage()}>{list.isFetchingNextPage ? 'Loading…' : 'Load more'}</button> : undefined} />}/></DataTableWorkspace>
    <MobileFilterSheet open={filterOpen} title="Filter webhooks" onClose={() => setFilterOpen(false)} returnFocusRef={filterTriggerRef}><section className="mobile-filter-section" aria-labelledby="webhook-status-filter"><h3 id="webhook-status-filter">Status</h3><div className="mobile-filter-options">{statusOptions.map((option) => <button key={option.value} className={option.value === status ? 'is-selected' : undefined} type="button" aria-pressed={option.value === status} onClick={() => setParam('status', option.value)}><span className="filter-option-check" aria-hidden="true">✓</span><span>{option.label}</span>{option.meta && <span className="num">{option.meta}</span>}</button>)}</div></section><button className="btn primary mobile-filter-done" type="button" onClick={() => setFilterOpen(false)}>Done</button></MobileFilterSheet>
    {webhookId && (detail.data?.resource ? <WebhookDrawer webhook={detail.data.resource} onClose={closeDrawer} onRetired={() => { feedback.accepted({ title: 'Retire webhook accepted', detail: 'The list refreshes automatically.', dedupeKey: `webhook:${webhookId}:retire` }); closeDrawer(); }} /> : detail.data?.unavailable ? <DrawerState onClose={closeDrawer}><div className="empty">Webhook data is not available yet.</div></DrawerState> : detail.isError ? <DrawerState onClose={closeDrawer}><InlineError error={detail.error} onRetry={detail.refetch} /></DrawerState> : <DrawerState onClose={closeDrawer}><div className="empty">Loading webhook details…</div></DrawerState>)}
    {registerOpen && <RegisterWebhookDialog error={register.error} isPending={register.isPending} onCancel={() => setRegisterOpen(false)} onRegister={(body) => register.mutate(body, { onSuccess: () => { setRegisterOpen(false); feedback.accepted({ title: 'Register webhook accepted', detail: 'The webhook will appear after the platform records it.', dedupeKey: 'webhook:register' }); } })} />}
  </>;
}
