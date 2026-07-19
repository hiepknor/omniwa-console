import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { CommandResult, PublicData } from '@/api/envelopes';
import type { WebhookDeliveryResource, WebhookResource } from '@/api/webhooks';
import { InlineError } from '@/components/InlineError';
import { TypedConfirmationDialog } from '@/components/TypedConfirmationDialog';
import { DetailDrawer, DetailDrawerState } from '@/components/drawer/DetailDrawer';
import { useFeedback } from '@/components/feedback/FeedbackProvider';
import { relativeTime } from '@/lib/format';
import { useResilientReadState } from '@/lib/query-state';
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
  const readState = useResilientReadState(query, query.data?.resource !== undefined);
  const steps = deliverySteps(query.data?.resource?.data);
  if (readState.isInitialLoading) return <p className="help" aria-live="polite">Loading delivery history…</p>;
  if (readState.isInitialError) return <InlineError error={readState.error} onRetry={() => void query.refetch()} />;
  if (query.data?.unavailable && query.data.resource === undefined) return <p className="help">Delivery history is unavailable for this delivery.</p>;
  if (!steps) return <div className="delivery-history-fallback"><p className="help">Delivery history is recorded but not projected in a renderable shape.</p><span className="mono">{query.data?.resource?.requestId ?? 'Request ID unavailable'}</span></div>;
  return <>{readState.isStaleError && <InlineError error={readState.error} onRetry={() => void query.refetch()} />}<ol className="timeline delivery-timeline">{steps.map((step, index) => <li key={`${step.status}-${step.timestamp ?? index}`}><span className={`dot ${webhookStatusDot(step.status)}`} aria-hidden="true" /><span className="what">{step.status}{step.detail && <span className="detail">{step.detail}</span>}</span><time className="ts" dateTime={step.timestamp}>{relativeTime(step.timestamp) || '—'}</time></li>)}</ol></>;
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

export function WebhookDrawer({ webhook, onClose, onRetired }: { webhook: WebhookResource; onClose: () => void; onRetired: (result: CommandResult) => void }) {
  const [eventsValue, setEventsValue] = useState((webhook.eventTypes ?? []).join(', '));
  const [retireOpen, setRetireOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedDelivery = searchParams.get('delivery') || undefined;
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const feedback = useFeedback();
  const deliveriesQuery = useWebhookDeliveries();
  const deliveryPages = deliveriesQuery.data?.pages ?? [];
  const deliveriesReadState = useResilientReadState(deliveriesQuery, deliveryPages.some((page) => page.resource !== undefined));
  const deliveries = useMemo(() => deliveryPages.flatMap((page) => page.resource?.items ?? []).filter((item) => item.webhookId === webhook.id), [deliveryPages, webhook.id]);
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
  const unavailable = deliveryPages.some((page) => page.unavailable !== undefined);

  useEffect(() => setEventsValue((webhook.eventTypes ?? []).join(', ')), [webhook.eventTypes]);
  const commandFeedback = (result: CommandResult, action: string, key = action.toLowerCase()) => feedback.command(result.disposition, { action, acceptedDetail: 'The platform accepted the command. Webhook data refreshes automatically.', completedDetail: 'The platform completed the command. Webhook data refreshes automatically.', requestId: result.requestId, dedupeKey: `webhook:${webhook.id}:${key}` });
  const parseEvents = () => [...new Set(eventsValue.split(',').map((item) => item.trim()).filter(Boolean))];
  const selectDelivery = (deliveryId: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('delivery', deliveryId);
    setSearchParams(next, { replace: true });
  };

  return <>
    <DetailDrawer titleId="webhook-detail-title" eyebrow="Webhook management" title={webhook.id} status={<span className="status"><span className={`dot ${webhookStatusDot(webhook.status)}`} />{webhook.status ?? '—'}</span>} subtitle={<span className="mono" title={webhook.id}>{webhook.id}</span>} className="webhook-drawer" closeLabel="Close webhook details" suppressEscape={retireOpen} onClose={onClose}>
        {commandError && <InlineError error={commandError} onRetry={() => undefined} announce />}
        <section aria-labelledby="webhook-facts-title"><h3 id="webhook-facts-title" className="visually-hidden">Webhook facts</h3><dl className="kv"><dt>ID</dt><dd><span className="mono">{webhook.id}</span></dd><dt>Status</dt><dd><span className="status"><span className={`dot ${webhookStatusDot(webhook.status)}`} />{webhook.status ?? '—'}</span></dd><dt>Events</dt><dd><div className="capchips">{(webhook.eventTypes ?? []).length ? webhook.eventTypes?.map((event) => <span className="chip" key={event}>{event}</span>) : '—'}</div></dd><dt>Created</dt><dd className="ts" title={webhook.createdAt}>{relativeTime(webhook.createdAt) || '—'}</dd><dt>Updated</dt><dd className="ts" title={webhook.updatedAt}>{relativeTime(webhook.updatedAt) || '—'}</dd></dl></section>
        <section aria-labelledby="webhook-lifecycle-title"><span className="eyebrow">Endpoint controls</span><h3 id="webhook-lifecycle-title">Lifecycle</h3><div className="lifecycle-groups"><div className="action-group"><span>Lifecycle commands may complete immediately or continue asynchronously.</span><div className="actions">{webhook.status !== 'active' && webhook.status !== 'retired' && <button className="btn primary" type="button" disabled={pending} onClick={() => activate.mutate(undefined, { onSuccess: (result) => commandFeedback(result, 'Activate') })}>Activate</button>}{webhook.status === 'active' && <button className="btn" type="button" disabled={pending} onClick={() => suspend.mutate(undefined, { onSuccess: (result) => commandFeedback(result, 'Suspend') })}>Suspend</button>}</div></div>{webhook.status !== 'retired' && <div className="action-group destructive"><span>Permanently stop future deliveries after typed confirmation.</span><button className="btn danger" type="button" onClick={() => setRetireOpen(true)}>Retire…</button></div>}</div></section>
        <section aria-labelledby="webhook-events-title"><span className="eyebrow">Configuration</span><h3 id="webhook-events-title">Subscribed events</h3><form onSubmit={(event) => { event.preventDefault(); update.mutate({ eventTypes: parseEvents() }, { onSuccess: (result) => commandFeedback(result, 'Update subscriptions', 'update') }); }}><div className="field"><label htmlFor="webhook-event-types">Event types <span className="muted">comma-separated</span></label><textarea className="input webhook-event-input" id="webhook-event-types" value={eventsValue} onChange={(event) => setEventsValue(event.target.value)} disabled={pending} /><p className="help">Event types are not projected back by the platform; submitting replaces the subscription.</p></div><button className="btn" type="submit" disabled={pending || parseEvents().length === 0 || eventsValue === (webhook.eventTypes ?? []).join(', ')}>Update events</button></form></section>
        <section aria-labelledby="webhook-deliveries-title"><div className="drawer-section-head"><div><span className="eyebrow">Loaded records</span><h3 id="webhook-deliveries-title">Recent deliveries</h3></div><span className="num delivery-count">{deliveries.length}</span></div>
          {deliveriesReadState.isStaleError && <InlineError error={deliveriesReadState.error} onRetry={deliveriesQuery.refetch} />}
          {deliveriesReadState.isInitialLoading ? <div className="empty">Loading deliveries…</div> : deliveriesReadState.isInitialError ? <InlineError error={deliveriesReadState.error} onRetry={deliveriesQuery.refetch} /> : unavailable && deliveries.length === 0 ? <div className="empty">Delivery data is not available yet.</div> : deliveries.length === 0 ? <div className="empty">No loaded deliveries for this webhook.</div> : <div className="delivery-records" role="region" aria-label="Recent webhook deliveries">{deliveries.map((delivery) => <DeliveryRow key={delivery.id} delivery={delivery} selected={selectedDelivery === delivery.id} checked={checked.has(delivery.id)} busy={pending} onSelect={() => selectDelivery(delivery.id)} onCheck={(value) => setChecked((current) => { const next = new Set(current); if (value) next.add(delivery.id); else next.delete(delivery.id); return next; })} onRetry={() => retry.mutate(delivery.id, { onSuccess: (result) => commandFeedback(result, 'Retry delivery', `retry:${delivery.id}`) })} onRedrive={() => redrive.mutate(delivery.id, { onSuccess: (result) => commandFeedback(result, 'Redrive delivery', `redrive:${delivery.id}`) })} />)}</div>}
          {deliveriesQuery.hasNextPage && <button className="btn webhook-load-more" type="button" disabled={deliveriesQuery.isFetchingNextPage} onClick={() => void deliveriesQuery.fetchNextPage()}>{deliveriesQuery.isFetchingNextPage ? 'Loading…' : 'Load more deliveries'}</button>}
          {selectedDelivery && <div className="webhook-history"><div className="drawer-section-head"><h4>Delivery history</h4><span className="mono">{selectedDelivery}</span></div><DeliveryHistory deliveryId={selectedDelivery} /></div>}
        </section>
        <section className="webhook-recovery" aria-labelledby="webhook-recovery-title"><span className="eyebrow">Bulk recovery</span><h3 id="webhook-recovery-title">Failed deliveries</h3><div className="recovery-action"><span>{checked.size ? `${checked.size} selected` : `${failed.length} failed in loaded data`}</span><button className="btn" type="button" disabled={!checked.size || pending} onClick={() => bulk.mutate([...checked], { onSuccess: (result) => { commandFeedback(result, 'Bulk redrive', 'bulk-redrive'); setChecked(new Set()); } })}>{bulk.isPending ? 'Submitting…' : 'Redrive selected'}</button></div></section>
    </DetailDrawer>
    {retireOpen && <TypedConfirmationDialog title="Retire webhook" description={<p>This permanently retires the webhook and stops future deliveries. This cannot be undone.</p>} resourceId={webhook.id} confirmValue={webhook.id} confirmLabel="Retire webhook" pendingLabel="Submitting…" error={retire.error} isPending={retire.isPending} onCancel={() => { retire.reset(); setRetireOpen(false); }} onConfirm={() => retire.mutate(undefined, { onSuccess: onRetired })} />}
  </>;
}

export function WebhookDrawerState({ onClose, children, announce = false }: { onClose: () => void; children: React.ReactNode; announce?: boolean }) {
  return <DetailDrawer titleId="webhook-detail-title" eyebrow="Webhook management" title="Webhook details" className="webhook-drawer" closeLabel="Close webhook details" onClose={onClose}><DetailDrawerState announce={announce}>{children}</DetailDrawerState></DetailDrawer>;
}
