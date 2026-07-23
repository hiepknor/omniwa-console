import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { hasCapability } from '@/api/capabilities';
import { useInstanceCapabilities } from '@/api/CapabilitiesProvider';
import type { ChatResource } from '@/api/chats';
import type { MessageResource } from '@/api/messages';
import { ProjectionNotice } from '@/components/ProjectionNotice';
import { StatusIndicator } from '@/components/badges';
import { InlineError } from '@/components/InlineError';
import { formatClockTime } from '@/lib/format';
import { useResilientReadState } from '@/lib/query-state';
import {
  useContact,
  useLabel,
  useMessage,
  useInstanceMessages,
  useMessageDeliveryHistory,
} from './hooks';

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

function DeliveryHistory({ instanceId, messageId, token, enabled }: { instanceId: string; messageId: string; token: string | undefined; enabled: boolean }) {
  const query = useMessageDeliveryHistory(instanceId, messageId, token, enabled);
  const readState = useResilientReadState(query, query.data?.resource !== undefined);
  const receipts = query.data?.resource ?? [];

  if (readState.isInitialLoading) return <p className="help" aria-live="polite">Loading delivery history…</p>;
  if (readState.isInitialError) return <InlineError error={readState.error} onRetry={() => { void query.refetch(); }} className="chat-context-error" />;
  if (!enabled && query.data?.resource === undefined) return <p className="help">Delivery projection is not ready.</p>;
  if (receipts.length === 0) return <><ProjectionNotice meta={query.data?.meta} /><p className="help">No per-recipient receipts have been projected.</p></>;

  return (
    <><ProjectionNotice meta={query.data?.meta} />{readState.isStaleError && <InlineError error={readState.error} onRetry={() => { void query.refetch(); }} className="chat-context-error" />}<ol className="timeline delivery-timeline">
      {receipts.map((receipt) => (
        <li key={`${receipt.recipientJid}-${receipt.receiptType}-${receipt.receiptAt}`}>
          <span className={`dot ${statusDot(receipt.receiptType)}`} aria-hidden="true" />
          <span className="what">{receipt.receiptType}<span className="detail mono">{receipt.recipientJid}</span></span>
          <time className="ts" dateTime={receipt.receiptAt}>{formatClockTime(receipt.receiptAt)}</time>
        </li>
      ))}
    </ol></>
  );
}

function SelectedMessage({ message, instanceId, token, messagesEnabled }: { message: MessageResource; instanceId: string; token: string | undefined; messagesEnabled: boolean }) {
  const status = message.status?.toLocaleLowerCase() ?? 'unknown';

  return (
    <section className="selected-message-detail" aria-labelledby="selected-message-title">
      <div className="section-title-row">
        <div><span className="eyebrow">Persisted message</span><h3 id="selected-message-title">Selected message</h3></div>
        <span className="mono message-id" title={message.id}>{message.id}</span>
      </div>
      <dl className="kv message-facts">
        <dt>Status</dt><dd><StatusIndicator dotClass={statusDot(status)}>{status}</StatusIndicator></dd>
        <dt>Type</dt><dd>{message.type}</dd>
        <dt>Direction</dt><dd>{message.direction}</dd>
        <dt>Provenance</dt><dd>{message.provenance}</dd>
        {message.createdAt && <><dt>Created</dt><dd>{formatTimestamp(message.createdAt)}</dd></>}
        {message.deliveredAt && <><dt>Delivered</dt><dd>{formatTimestamp(message.deliveredAt)}</dd></>}
        {message.readAt && <><dt>Read</dt><dd>{formatTimestamp(message.readAt)}</dd></>}
      </dl>
      <h4>Delivery history</h4>
      <DeliveryHistory instanceId={instanceId} messageId={message.id} token={token} enabled={messagesEnabled} />
    </section>
  );
}

function ContextPanelDetails({ instanceId, token, contactsEnabled, messagesEnabled, chat, onBack }: {
  instanceId: string | undefined;
  token: string | undefined;
  contactsEnabled: boolean;
  messagesEnabled: boolean;
  chat: ChatResource;
  onBack: () => void;
}) {
  const [searchParams] = useSearchParams();
  const selectedMessageId = searchParams.get('message');
  const contactQuery = useContact(instanceId, chat.type === 'direct' ? chat.id : undefined, token, contactsEnabled);
  const contactReadState = useResilientReadState(contactQuery, contactQuery.data?.resource !== undefined);
  const messagesQuery = useInstanceMessages(instanceId, chat.id, token, messagesEnabled);
  const loadedMessages = useMemo(() => (messagesQuery.data?.pages ?? []).flatMap((page) => page.resource?.items ?? []), [messagesQuery.data?.pages]);
  const selectedMessageQuery = useMessage(instanceId, selectedMessageId ?? undefined, token, messagesEnabled);
  const selectedMessage = selectedMessageQuery.data?.resource
    ?? loadedMessages.find((message) => message.id === selectedMessageId && message.chatId === chat.id);
  const contact = contactQuery.data?.resource;

  return (
    <aside className={`context${selectedMessageId ? ' context--message' : ' context--contact'}`} id="chat-context" aria-label="Contact and selected message context">
      <header className="context-head">
        <div><span className="eyebrow">{selectedMessageId ? 'Message' : 'Context'}</span><h2>{selectedMessageId ? 'Message details' : 'Conversation details'}</h2></div>
        <button className="btn sm context-close chat-icon-action" type="button" data-pane-target="thread" aria-label={selectedMessageId ? 'Close message details' : 'Back to conversation'} aria-controls="chat-thread" onClick={onBack}>
          <svg viewBox="0 0 24 24" aria-hidden="true">{selectedMessageId ? <path d="m7 7 10 10M17 7 7 17" /> : <path d="m15 18-6-6 6-6" />}</svg>
        </button>
      </header>
      <ProjectionNotice meta={contactQuery.data?.meta} />
      <section aria-labelledby="contact-facts-title">
        <h3 id="contact-facts-title">Conversation</h3>
        <dl className="kv">
          <dt>Name</dt><dd>{chat.displayName ?? '—'}</dd>
          {chat.type === 'direct' && <><dt>Contact</dt><dd><span className="mono context-technical-value" title={contact?.id}>{contactQuery.isLoading ? 'Loading…' : contact?.id ?? '—'}</span></dd></>}
          <dt>Chat</dt><dd><span className="mono context-technical-value" title={chat.id}>{chat.id}</span></dd>
          <dt>Type</dt><dd>{chat.type}</dd>
          <dt>Unread</dt><dd>{chat.unreadCount}</dd>
        </dl>
        <p className="help read-only-note !text-[var(--fg-2)]">Labels are synced from WhatsApp — read-only here.</p>
        {contactReadState.isError && <InlineError error={contactReadState.error} onRetry={() => { void contactQuery.refetch(); }} className="chat-context-error" />}
      </section>
      {selectedMessage && instanceId
        ? <><ProjectionNotice meta={selectedMessageQuery.data?.meta} /><SelectedMessage message={selectedMessage} instanceId={instanceId} token={token} messagesEnabled={messagesEnabled} /></>
        : <section><p className="help">{selectedMessageId ? 'The selected message is not in the loaded history. Load older messages in the timeline.' : 'Select a message in the timeline to inspect delivery.'}</p></section>}
      {selectedMessageQuery.isError && <InlineError error={selectedMessageQuery.error} onRetry={() => { void selectedMessageQuery.refetch(); }} className="chat-context-error" />}
    </aside>
  );
}

export function ContextPanel({ instanceId, token, contactId, labelId, chat, onBack }: {
  instanceId: string | undefined;
  token: string | undefined;
  contactId: string | undefined;
  labelId: string | undefined;
  chat: ChatResource | undefined;
  onBack: () => void;
}) {
  const capabilities = useInstanceCapabilities(instanceId, token);
  const contactsEnabled = hasCapability(capabilities.data, 'contacts_projection');
  const labelsEnabled = hasCapability(capabilities.data, 'labels_projection');
  const messagesEnabled = hasCapability(capabilities.data, 'messages_projection');
  const contactQuery = useContact(instanceId, contactId, token, contactsEnabled);
  const contactReadState = useResilientReadState(contactQuery, contactQuery.data?.resource !== undefined);
  const contact = contactQuery.data?.resource;

  const labelQuery = useLabel(instanceId, labelId, token, labelsEnabled);
  const labelReadState = useResilientReadState(labelQuery, labelQuery.data?.resource !== undefined);
  const label = labelQuery.data?.resource;

  if (contactId) {
    return (
      <aside className="context context--contact" id="chat-context" aria-label="Contact details">
        <header className="context-head">
          <div><span className="eyebrow">Directory</span><h2>Contact details</h2></div>
          <button className="btn sm context-close chat-icon-action" type="button" data-pane-target="conversations" aria-label="Back to contacts" aria-controls="chat-conversations" onClick={onBack}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg></button>
        </header>
        {contactReadState.isInitialLoading ? <section className="chat-calm-state" aria-live="polite"><h2>Loading contact.</h2></section>
          : contactReadState.isInitialError ? <section><InlineError error={contactReadState.error} onRetry={() => { void contactQuery.refetch(); }} className="chat-context-error" /></section>
          : contact ? <>
            <ProjectionNotice meta={contactQuery.data?.meta} />
            {contactReadState.isStaleError && <InlineError error={contactReadState.error} onRetry={() => { void contactQuery.refetch(); }} className="chat-context-error" />}
            <section aria-labelledby="projected-contact-facts-title">
              <h3 id="projected-contact-facts-title">Normalized identity</h3>
              <dl className="kv">
                <dt>Name</dt><dd>{contact.displayName ?? '—'}</dd>
                <dt>JID</dt><dd><span className="mono context-technical-value" title={contact.id}>{contact.id}</span></dd>
                <dt>Username</dt><dd>{contact.username ?? '—'}</dd>
                <dt>Phone</dt><dd>{contact.redactedPhone ?? '—'}</dd>
                <dt>Business</dt><dd>{contact.businessName ?? '—'}</dd>
                <dt>About</dt><dd>{contact.about ?? '—'}</dd>
                <dt>Known</dt><dd>{contact.found ? 'yes' : 'no'}</dd>
              </dl>
              <p className="help read-only-note !text-[var(--fg-2)]">Identity fields are normalized and redacted by OmniWA GO.</p>
            </section>
          </> : <section className="chat-calm-state"><h2>Contact details are unavailable.</h2></section>}
      </aside>
    );
  }

  if (labelId) {
    return (
      <aside className="context context--contact" id="chat-context" aria-label="Label details">
        <header className="context-head">
          <div><span className="eyebrow">Directory</span><h2>Label details</h2></div>
          <button className="btn sm context-close chat-icon-action" type="button" data-pane-target="conversations" aria-label="Back to labels" aria-controls="chat-conversations" onClick={onBack}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg></button>
        </header>
        {labelReadState.isInitialLoading ? <section className="chat-calm-state" aria-live="polite"><h2>Loading label.</h2></section>
          : labelReadState.isInitialError ? <section><InlineError error={labelReadState.error} onRetry={() => { void labelQuery.refetch(); }} className="chat-context-error" /></section>
          : label ? <>
            <ProjectionNotice meta={labelQuery.data?.meta} />
            {labelReadState.isStaleError && <InlineError error={labelReadState.error} onRetry={() => { void labelQuery.refetch(); }} className="chat-context-error" />}
            <section aria-labelledby="projected-label-facts-title">
              <h3 id="projected-label-facts-title">Projected definition</h3>
              <dl className="kv">
                <dt>Name</dt><dd>{label.name ?? '—'}</dd>
                <dt>Label ID</dt><dd><span className="mono context-technical-value" title={label.id}>{label.id}</span></dd>
                <dt>Color</dt><dd>{label.color ?? '—'}</dd>
                <dt>Predefined ID</dt><dd>{label.predefinedId ?? '—'}</dd>
              </dl>
              <p className="help read-only-note !text-[var(--fg-2)]">Label definitions are persisted and read-only here. Chat and message assignments appear with their projections.</p>
            </section>
          </> : <section className="chat-calm-state"><h2>Label details are unavailable.</h2></section>}
      </aside>
    );
  }

  if (!chat) {
    return (
      <aside className="context context--contact" id="chat-context" aria-label="Contact and selected message context">
        <header className="context-head">
          <div><span className="eyebrow">Context</span><h2>Contact details</h2></div>
          <button className="btn sm context-close chat-icon-action" type="button" data-pane-target="thread" aria-label="Back to conversation" aria-controls="chat-thread" onClick={onBack}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg></button>
        </header>
        <section className="chat-calm-state">
          <span className="eyebrow">Context</span>
          <h2>Select a conversation</h2>
          <p>Choose a projected chat to inspect its conversation and delivery context.</p>
        </section>
      </aside>
    );
  }

  return <ContextPanelDetails instanceId={instanceId} token={token} contactsEnabled={contactsEnabled} messagesEnabled={messagesEnabled} chat={chat} onBack={onBack} />;
}
