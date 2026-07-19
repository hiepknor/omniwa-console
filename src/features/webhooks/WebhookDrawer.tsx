import { useEffect, useMemo, useState } from 'react';
import type { PublicData } from '@/api/envelopes';
import type { WebhookDeliveryResource, WebhookResource } from '@/api/webhooks';
import { InlineError } from '@/components/InlineError';
import { useFeedback } from '@/components/feedback/FeedbackProvider';
import { relativeTime } from '@/lib/format';
import {
  useActivateWebhook,
  useBulkRedrive,
  useRedriveDelivery,
  useRetireWebhook,
  useRetryDelivery,
  useSuspendWebhook,
  useUpdateWebhook,
  useWebhookDeliveries,
  useWebhookDeliveryHistory,
} from './hooks';
import { RetireWebhookDialog } from './RetireWebhookDialog';

type DeliveryStep = { status: string; timestamp?: string; detail?: string };
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value); }
function recordOf(value: unknown): Record<string, unknown> | undefined { return isRecord(value) ? value : undefined; }
function firstString(record: Record<string, unknown>, keys: readonly string[]) {
  for (const key of keys) { const value = record[key]; if (typeof value === 'string' && value.trim()) return value; }
  return undefined;
}
function deliverySteps(data: PublicData | undefined): DeliveryStep[] | undefined {
  const record = recordOf(data);
  if (!record) return undefined;
  for (const key of ['history', 'attempts', 'steps', 'events']) {
    const candidate = record[key];
    if (!Array.isArray(candidate)) continue;
    const steps = candidate.flatMap((item): DeliveryStep[] => {
      if (!isRecord(item)) return [];
      const status = firstString(item, ['status', 'state']);
      if (!status) return [];
      const timestamp = firstString(item, ['timestamp', 'createdAt', 'updatedAt', 'occurredAt', 'at', 'time']);
      const detail = firstString(item, ['reason', 'detail', 'message', 'error', 'reasonCode']);
      return [{ status, ...(timestamp ? { timestamp } : {}), ...(detail ? { detail } : {}) }];
    });
    if (steps.length) return steps;
  }
  return undefined;
}

export function webhookStatusDot(status: string | undefined) {
  switch (status?.toLowerCase()) {
    case 'active':
    case 'delivered':
    case 'succeeded': return 'dot-ok';
    case 'suspended':
    case 'pending':
    case 'retrying': return 'dot-pending';
    case 'retired': return 'dot-muted';
    case 'failed':
    case 'dead':
    case 'exhausted': return 'dot-failed';
    default: return 'dot-info';
  }
}

function DeliveryHistory({ deliveryId }: { deliveryId: string }) {
  const query = useWebhookDeliveryHistory(deliveryId);
  const steps = deliverySteps(query.data?.resource?.data);
  if (query.isLoading) return <p className="help" aria-live="polite">Loading delivery history…</p>;
  if (query.isError) return <InlineError error={query.error} onRetry={() => void query.refetch()} />;
  if (query.data?.unavailable) return <p className="help">Delivery history is unavailable for this delivery.</p>;
  if (!steps) return <div className="delivery-history-fallback"><p className="help">Delivery history is recorded but not projected in a renderable shape.</p><span className="mono">{query.data?.resource?.requestId ?? 'Request ID unavailable'}</span></div>;
  return <ol className="timeline delivery-timeline">{steps.map((step, index) => <li key={`${step.status}-${step.timestamp ?? index}`}><span className={`dot ${webhookStatusDot(step.status)}`} aria-hidden="true" /><span className="what">{step.status}{step.detail && <span className="detail">{step.detail}</span>}</span><time className="ts" dateTime={step.timestamp}>{relativeTime(step.timestamp) || '—'}</time></li>)}</ol>;
}

function DeliveryRow({ delivery, selected, checked, busy, onSelect, onCheck, onRetry, onRedrive }: {
  delivery: WebhookDeliveryResource; selected: boolean; checked: boolean; busy: boolean;
  onSelect: () => void; onCheck: (checked: boolean) => void; onRetry: () => void; onRedrive: () => void;
}) {
  const terminalFailure = ['failed', 'dead', 'exhausted'].includes(delivery.status?.toLowerCase() ?? '');
  const retryTitle = terminalFailure ? undefined : 'Retry is available for failed deliveries.';
  const redriveTitle = terminalFailure ? undefined : 'Redrive is available for failed deliveries.';
  return <article className={`delivery-record${selected ? ' selected' : ''}`}>
    <dl>
      <dt>Delivery</dt><dd><button className="webhook-delivery-link mono" type="button" title={delivery.id} onClick={onSelect}>{delivery.id}</button></dd>
      <dt>Event</dt><dd><span className="mono">{delivery.eventType ?? '—'}</span></dd>
      <dt>Status</dt><dd><span className="status sm"><span className={`dot ${webhookStatusDot(delivery.status)}`} />{delivery.status ?? '—'}</span></dd>
      <dt>Attempts</dt><dd className="num">{delivery.attemptCount ?? '—'}</dd>
      <dt>Updated</dt><dd><span className="ts" title={delivery.updatedAt}>{relativeTime(delivery.updatedAt) || '—'}</span></dd>
    </dl>
    <div className="delivery-record-actions">
      {terminalFailure && <label className="delivery-check"><input type="checkbox" checked={checked} onChange={(event) => onCheck(event.target.checked)} aria-label={`Select failed delivery ${delivery.id}`} /><span>Select for bulk recovery</span></label>}
      <div className="actions webhook-delivery-actions"><button className="btn sm" type="button" disabled={busy || !terminalFailure} title={retryTitle} onClick={onRetry}>Retry</button><button className="btn sm" type="button" disabled={busy || !terminalFailure} title={redriveTitle} onClick={onRedrive}>Redrive</button></div>
    </div>
  </article>;
}

export function WebhookDrawer({ webhook, onClose, onRetired }: { webhook: WebhookResource; onClose: () => void; onRetired: () => void }) {
  const [eventsValue, setEventsValue] = useState((webhook.eventTypes ?? []).join(', '));
  const [retireOpen, setRetireOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<string>();
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const feedback = useFeedback();
  const deliveriesQuery = useWebhookDeliveries();
  const deliveries = useMemo(() => (deliveriesQuery.data?.pages ?? []).flatMap((page) => page.resource?.items ?? []).filter((item) => item.webhookId === webhook.id), [deliveriesQuery.data?.pages, webhook.id]);
  const failed = deliveries.filter((item) => ['failed', 'dead', 'exhausted'].includes(item.status?.toLowerCase() ?? ''));
  const update = useUpdateWebhook(webhook.id);
  const activate = useActivateWebhook(webhook.id);
  const suspend = useSuspendWebhook(webhook.id);
  const retire = useRetireWebhook(webhook.id);
  const retry = useRetryDelivery();
  const redrive = useRedriveDelivery();
  const bulk = useBulkRedrive();
  const pending = update.isPending || activate.isPending || suspend.isPending || retry.isPending || redrive.isPending || bulk.isPending;
  const commandError = update.error ?? activate.error ?? suspend.error ?? retry.error ?? redrive.error ?? bulk.error;
  const unavailable = (deliveriesQuery.data?.pages ?? []).some((page) => page.unavailable !== undefined);

  useEffect(() => setEventsValue((webhook.eventTypes ?? []).join(', ')), [webhook.eventTypes]);
  useEffect(() => { const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape' && !retireOpen) onClose(); }; document.addEventListener('keydown', closeOnEscape); return () => document.removeEventListener('keydown', closeOnEscape); }, [onClose, retireOpen]);
  const accepted = (action: string, key = action.toLowerCase()) => feedback.accepted({ title: `${action} accepted`, detail: 'Webhook data refreshes automatically.', dedupeKey: `webhook:${webhook.id}:${key}` });
  const parseEvents = () => [...new Set(eventsValue.split(',').map((item) => item.trim()).filter(Boolean))];

  return <>
    <aside className="drawer webhook-drawer" aria-labelledby="webhook-detail-title">
      <header className="drawer-head"><div className="drawer-identity"><span className="eyebrow">Webhook management</span><div className="drawer-title-row"><h2 id="webhook-detail-title" title={webhook.id}>{webhook.id}</h2><span className="status"><span className={`dot ${webhookStatusDot(webhook.status)}`} />{webhook.status ?? '—'}</span></div></div><button className="close" type="button" aria-label="Close webhook details" onClick={onClose}>✕</button></header>
      <div className="drawer-scroll">
        {commandError && <InlineError error={commandError} onRetry={() => undefined} announce />}
        <section aria-labelledby="webhook-facts-title"><h3 id="webhook-facts-title" className="visually-hidden">Webhook facts</h3><dl className="kv"><dt>ID</dt><dd><span className="mono">{webhook.id}</span></dd><dt>Status</dt><dd><span className="status"><span className={`dot ${webhookStatusDot(webhook.status)}`} />{webhook.status ?? '—'}</span></dd><dt>Events</dt><dd><div className="capchips">{(webhook.eventTypes ?? []).length ? webhook.eventTypes?.map((event) => <span className="chip" key={event}>{event}</span>) : '—'}</div></dd><dt>Created</dt><dd className="ts" title={webhook.createdAt}>{relativeTime(webhook.createdAt) || '—'}</dd><dt>Updated</dt><dd className="ts" title={webhook.updatedAt}>{relativeTime(webhook.updatedAt) || '—'}</dd></dl></section>
        <section aria-labelledby="webhook-lifecycle-title"><span className="eyebrow">Endpoint controls</span><h3 id="webhook-lifecycle-title">Lifecycle</h3><div className="lifecycle-groups"><div className="action-group"><span>Lifecycle commands are accepted asynchronously.</span><div className="actions">{webhook.status !== 'active' && webhook.status !== 'retired' && <button className="btn primary" type="button" disabled={pending} onClick={() => activate.mutate(undefined, { onSuccess: () => accepted('Activate') })}>Activate</button>}{webhook.status === 'active' && <button className="btn" type="button" disabled={pending} onClick={() => suspend.mutate(undefined, { onSuccess: () => accepted('Suspend') })}>Suspend</button>}</div></div>{webhook.status !== 'retired' && <div className="action-group destructive"><span>Permanently stop future deliveries after typed confirmation.</span><button className="btn danger" type="button" onClick={() => setRetireOpen(true)}>Retire…</button></div>}</div></section>
        <section aria-labelledby="webhook-events-title"><span className="eyebrow">Configuration</span><h3 id="webhook-events-title">Subscribed events</h3><form onSubmit={(event) => { event.preventDefault(); update.mutate({ eventTypes: parseEvents() }, { onSuccess: () => accepted('Update subscriptions', 'update') }); }}><div className="field"><label htmlFor="webhook-event-types">Event types <span className="muted">comma-separated</span></label><textarea className="input webhook-event-input" id="webhook-event-types" value={eventsValue} onChange={(event) => setEventsValue(event.target.value)} disabled={pending} /><p className="help">Event types are not projected back by the platform; submitting replaces the subscription.</p></div><button className="btn" type="submit" disabled={pending || parseEvents().length === 0 || eventsValue === (webhook.eventTypes ?? []).join(', ')}>Update events</button></form></section>
        <section aria-labelledby="webhook-deliveries-title"><div className="drawer-section-head"><div><span className="eyebrow">Loaded records</span><h3 id="webhook-deliveries-title">Recent deliveries</h3></div><span className="num delivery-count">{deliveries.length}</span></div>
          {deliveriesQuery.isLoading ? <div className="empty">Loading deliveries…</div> : deliveriesQuery.isError ? <InlineError error={deliveriesQuery.error} onRetry={deliveriesQuery.refetch} /> : unavailable ? <div className="empty">Delivery data is not available yet.</div> : deliveries.length === 0 ? <div className="empty">No loaded deliveries for this webhook.</div> : <div className="delivery-records" role="region" aria-label="Recent webhook deliveries">{deliveries.map((delivery) => <DeliveryRow key={delivery.id} delivery={delivery} selected={selectedDelivery === delivery.id} checked={checked.has(delivery.id)} busy={pending} onSelect={() => setSelectedDelivery(delivery.id)} onCheck={(value) => setChecked((current) => { const next = new Set(current); if (value) next.add(delivery.id); else next.delete(delivery.id); return next; })} onRetry={() => retry.mutate(delivery.id, { onSuccess: () => accepted('Retry delivery', `retry:${delivery.id}`) })} onRedrive={() => redrive.mutate(delivery.id, { onSuccess: () => accepted('Redrive delivery', `redrive:${delivery.id}`) })} />)}</div>}
          {deliveriesQuery.hasNextPage && <button className="btn webhook-load-more" type="button" disabled={deliveriesQuery.isFetchingNextPage} onClick={() => void deliveriesQuery.fetchNextPage()}>{deliveriesQuery.isFetchingNextPage ? 'Loading…' : 'Load more deliveries'}</button>}
          {selectedDelivery && <div className="webhook-history"><div className="drawer-section-head"><h4>Delivery history</h4><span className="mono">{selectedDelivery}</span></div><DeliveryHistory deliveryId={selectedDelivery} /></div>}
        </section>
        <section className="webhook-recovery" aria-labelledby="webhook-recovery-title"><span className="eyebrow">Bulk recovery</span><h3 id="webhook-recovery-title">Failed deliveries</h3><div className="recovery-action"><span>{checked.size ? `${checked.size} selected` : `${failed.length} failed in loaded data`}</span><button className="btn" type="button" disabled={!checked.size || pending} onClick={() => bulk.mutate([...checked], { onSuccess: () => { accepted('Bulk redrive', 'bulk-redrive'); setChecked(new Set()); } })}>{bulk.isPending ? 'Submitting…' : 'Redrive selected'}</button></div></section>
      </div>
    </aside>
    {retireOpen && <RetireWebhookDialog webhookId={webhook.id} error={retire.error} isPending={retire.isPending} onCancel={() => { retire.reset(); setRetireOpen(false); }} onConfirm={() => retire.mutate(undefined, { onSuccess: onRetired })} />}
  </>;
}
