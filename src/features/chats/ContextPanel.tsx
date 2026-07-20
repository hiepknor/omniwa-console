import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ChatResource, MessageResource } from '@/api/chats';
import type { PublicData } from '@/api/envelopes';
import { InlineError } from '@/components/InlineError';
import { formatClockTime } from '@/lib/format';
import { useResilientReadState } from '@/lib/query-state';
import {
  useCancelMessage,
  useInstanceContacts,
  useInstanceLabels,
  useInstanceMessages,
  useMessageDeliveryHistory,
  useRetryMessage,
} from './hooks';

type DeliveryStep = {
  status: string;
  timestamp?: string;
  detail?: string;
  retryable?: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function recordOf(value: unknown): Record<string, unknown> | undefined {
  return isRecord(value) ? value : undefined;
}

function firstString(record: Record<string, unknown>, keys: readonly string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value;
  }
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
      return [{
        status,
        ...(timestamp ? { timestamp } : {}),
        ...(detail ? { detail } : {}),
        ...(typeof item.retryable === 'boolean' ? { retryable: item.retryable } : {}),
      }];
    });
    if (steps.length > 0) return steps;
  }
  return undefined;
}

function historySaysRetryable(data: PublicData | undefined, steps: DeliveryStep[] | undefined): boolean {
  return recordOf(data)?.retryable === true || steps?.some((step) => step.retryable) === true;
}

function statusDot(status: string | undefined): string {
  switch (status?.toLocaleLowerCase()) {
    case 'delivered':
    case 'read': return 'dot-ok';
    case 'accepted': return 'dot-pending';
    case 'failed': return 'dot-failed';
    case 'canceled':
    case 'cancelled': return 'dot-muted';
    case 'queued':
    case 'pending':
    case 'processing': return 'dot-pending';
    default: return 'dot-info';
  }
}

function formatTimestamp(value: string | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function DeliveryHistory({ messageId }: { messageId: string }) {
  const query = useMessageDeliveryHistory(messageId);
  const readState = useResilientReadState(query, query.data?.resource !== undefined);
  const steps = deliverySteps(query.data?.resource?.data);

  if (readState.isInitialLoading) return <p className="help" aria-live="polite">Loading delivery history…</p>;
  if (readState.isInitialError) return <InlineError error={readState.error} onRetry={() => { void query.refetch(); }} className="chat-context-error" />;
  if (query.data?.unavailable && query.data.resource === undefined) return <p className="help">Delivery history is unavailable for this message.</p>;
  if (!steps) {
    return (
      <div className="delivery-history-fallback">
        <p className="help">Delivery history is recorded but not projected in a renderable shape.</p>
        <span className="mono">{query.data?.resource?.requestId ?? 'Request ID unavailable'}</span>
      </div>
    );
  }

  return (
    <>{readState.isStaleError && <InlineError error={readState.error} onRetry={() => { void query.refetch(); }} className="chat-context-error" />}<ol className="timeline delivery-timeline">
      {steps.map((step, index) => (
        <li key={`${step.status}-${step.timestamp ?? index}`}>
          <span className={`dot ${statusDot(step.status)}`} aria-hidden="true" />
          <span className="what">{step.status}{step.detail && <span className="detail">{step.detail}</span>}</span>
          <time className="ts" dateTime={step.timestamp}>{step.timestamp ? formatClockTime(step.timestamp) : '—'}</time>
        </li>
      ))}
    </ol></>
  );
}

function SelectedMessage({ message, instanceId }: { message: MessageResource; instanceId: string }) {
  const retry = useRetryMessage(instanceId);
  const cancel = useCancelMessage(instanceId);
  const history = useMessageDeliveryHistory(message.id);
  const steps = deliverySteps(history.data?.resource?.data);
  const status = message.status?.toLocaleLowerCase() ?? 'unknown';
  const retryable = historySaysRetryable(history.data?.resource?.data, steps);
  const canRetry = status === 'failed';
  const canCancel = ['accepted', 'queued', 'pending', 'processing'].includes(status);

  return (
    <section className="selected-message-detail" aria-labelledby="selected-message-title">
      <div className="section-title-row">
        <div><span className="eyebrow">Message actions</span><h3 id="selected-message-title">Selected message</h3></div>
        <span className="mono message-id" title={message.id}>{message.id}</span>
      </div>
      <dl className="kv message-facts">
        <dt>Status</dt><dd><span className="status"><span className={`dot ${statusDot(status)}`} aria-hidden="true" />{status}{retryable ? ' · retryable' : ''}</span></dd>
        <dt>Type</dt><dd>{message.type ?? '—'}</dd>
        {message.createdAt && <><dt>Created</dt><dd>{formatTimestamp(message.createdAt)}</dd></>}
        {message.deliveredAt && <><dt>Delivered</dt><dd>{formatTimestamp(message.deliveredAt)}</dd></>}
        {message.readAt && <><dt>Read</dt><dd>{formatTimestamp(message.readAt)}</dd></>}
      </dl>
      <h4>Delivery history</h4>
      <DeliveryHistory messageId={message.id} />
      {retry.isError && <InlineError error={retry.error} onRetry={() => retry.mutate(message.id)} className="chat-context-error" announce />}
      {cancel.isError && <InlineError error={cancel.error} onRetry={() => cancel.mutate(message.id)} className="chat-context-error" announce />}
      <div className="actions message-actions" aria-label="Selected message actions">
        <button className="btn" type="button" disabled={!canRetry || retry.isPending || cancel.isPending} title={canRetry ? undefined : 'Retry is available for failed messages.'} onClick={() => retry.mutate(message.id)}>{retry.isPending ? 'Retrying…' : 'Retry'}</button>
        <button className="btn danger" type="button" disabled={!canCancel || retry.isPending || cancel.isPending} title={canCancel ? undefined : 'Cancel is available for in-flight messages.'} onClick={() => cancel.mutate(message.id)}>{cancel.isPending ? 'Cancelling…' : 'Cancel'}</button>
      </div>
    </section>
  );
}

function ContextPanelDetails({ instanceId, chat, onBack }: {
  instanceId: string | undefined;
  chat: ChatResource;
  onBack: () => void;
}) {
  const [searchParams] = useSearchParams();
  const selectedMessageId = searchParams.get('message');
  const contacts = useInstanceContacts(instanceId);
  const labels = useInstanceLabels(instanceId);
  const contactsReadState = useResilientReadState(contacts, contacts.data?.resource !== undefined);
  const labelsReadState = useResilientReadState(labels, labels.data?.resource !== undefined);
  const messagesQuery = useInstanceMessages(instanceId);
  const loadedMessages = useMemo(() => (messagesQuery.data?.pages ?? []).flatMap((page) => page.resource?.items ?? []), [messagesQuery.data?.pages]);
  const selectedMessage = loadedMessages.find((message) => message.id === selectedMessageId && message.chatId === chat.id);
  const contact = chat.displayName
    ? contacts.data?.resource?.items.find((item) => item.displayName === chat.displayName)
    : undefined;
  const labelNames = new Map((labels.data?.resource?.items ?? []).map((label) => [label.id, label.name ?? label.id]));

  return (
    <aside className="context" id="chat-context" aria-label="Contact and selected message context">
      <header className="context-head">
        <div><span className="eyebrow">Context</span><h2>Contact details</h2></div>
        <button className="btn sm context-close" type="button" data-pane-target="thread" aria-controls="chat-thread" onClick={onBack}>Back to thread</button>
      </header>
      <section aria-labelledby="contact-facts-title">
        <h3 id="contact-facts-title">Contact</h3>
        <dl className="kv">
          <dt>Name</dt><dd>{chat.displayName ?? '—'}</dd>
          <dt>Contact</dt><dd><span className="mono context-technical-value" title={contact?.id}>{contacts.isLoading ? 'Loading…' : contact?.id ?? '—'}</span></dd>
          <dt>Chat</dt><dd><span className="mono context-technical-value" title={chat.id}>{chat.id}</span></dd>
          <dt>Labels</dt><dd>{chat.labelIds?.length ? chat.labelIds.map((labelId) => <span className="chip label-chip" key={labelId}>{labelNames.get(labelId) ?? labelId}</span>) : '—'}</dd>
        </dl>
        <p className="help read-only-note">Labels are synced from WhatsApp — read-only here.</p>
        {contactsReadState.isError && <InlineError error={contactsReadState.error} onRetry={() => { void contacts.refetch(); }} className="chat-context-error" />}
        {labelsReadState.isError && <InlineError error={labelsReadState.error} onRetry={() => { void labels.refetch(); }} className="chat-context-error" />}
      </section>
      {selectedMessage && instanceId
        ? <SelectedMessage message={selectedMessage} instanceId={instanceId} />
        : <section><p className="help">{selectedMessageId ? 'The selected message is not in the loaded history. Load older messages in the timeline.' : 'Select a message in the timeline to inspect delivery.'}</p></section>}
    </aside>
  );
}

export function ContextPanel({ instanceId, chat, onBack }: {
  instanceId: string | undefined;
  chat: ChatResource | undefined;
  onBack: () => void;
}) {
  if (!chat) {
    return (
      <aside className="context" id="chat-context" aria-label="Contact and selected message context">
        <header className="context-head">
          <div><span className="eyebrow">Context</span><h2>Contact details</h2></div>
          <button className="btn sm context-close" type="button" data-pane-target="thread" aria-controls="chat-thread" onClick={onBack}>Back to thread</button>
        </header>
        <section className="chat-calm-state">
          <span className="eyebrow">Context</span>
          <h2>Select a conversation</h2>
          <p>Choose a direct chat to inspect its contact and delivery context.</p>
        </section>
      </aside>
    );
  }

  return <ContextPanelDetails instanceId={instanceId} chat={chat} onBack={onBack} />;
}
