import { useLayoutEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { MessageResource } from '@/api/chats';
import { InlineError } from '@/components/InlineError';
import { calendarDayKey, calendarDayLabel, formatClockTime } from '@/lib/format';
import { useResilientReadState } from '@/lib/query-state';
import { useInstanceMessages } from './hooks';

function messageDirection(direction: string | undefined): 'in' | 'out' {
  const normalized = direction?.toLowerCase();
  return normalized === 'outgoing' || normalized === 'outbound' ? 'out' : 'in';
}

function hasKnownDirection(direction: string | undefined): boolean {
  const normalized = direction?.toLowerCase();
  return normalized === 'incoming' || normalized === 'inbound' || normalized === 'outgoing' || normalized === 'outbound';
}

function statusDot(status: string | undefined): string {
  switch (status?.toLowerCase()) {
    case 'delivered':
    case 'read': return 'dot-ok';
    case 'failed': return 'dot-failed';
    case 'canceled':
    case 'cancelled': return 'dot-muted';
    case 'queued':
    case 'accepted':
    case 'pending':
    case 'processing': return 'dot-pending';
    default: return 'dot-info';
  }
}

function humanizedType(type: string | undefined): string {
  if (!type?.trim()) return 'Message';
  const words = type.trim().replaceAll(/[_-]+/gu, ' ').replaceAll(/([a-z])([A-Z])/gu, '$1 $2').toLocaleLowerCase();
  const label = `${words[0]?.toLocaleUpperCase() ?? ''}${words.slice(1)}`;
  return label.endsWith(' message') ? label : `${label} message`;
}

function messageTimestamp(message: MessageResource): number {
  if (message.createdAt === undefined) return Number.POSITIVE_INFINITY;
  const timestamp = Date.parse(message.createdAt);
  return Number.isNaN(timestamp) ? Number.POSITIVE_INFINITY : timestamp;
}

function MessageBubble({ message, selected, onSelect }: {
  message: MessageResource;
  selected: boolean;
  onSelect: () => void;
}) {
  const direction = messageDirection(message.direction);
  const knownDirection = hasKnownDirection(message.direction);
  const isOutgoing = direction === 'out' && knownDirection;
  const status = message.status?.toLocaleLowerCase();
  const time = formatClockTime(message.createdAt);
  const type = humanizedType(message.type);
  const mediaLike = ['image', 'video', 'audio', 'document', 'media'].includes(message.type?.toLowerCase() ?? '');
  const directionLabel = isOutgoing ? 'Outgoing' : knownDirection ? 'Incoming' : 'Message';
  const statusLabel = isOutgoing && status ? `, ${status}` : '';

  return (
    <button
      type="button"
      className={`bubble ${direction}${isOutgoing && status === 'failed' ? ' failed' : ''}${selected ? ' selected' : ''}`}
      aria-label={`${selected ? 'Selected ' : ''}${directionLabel.toLocaleLowerCase()} ${type.toLocaleLowerCase()}${statusLabel} at ${time}`}
      aria-pressed={selected}
      onClick={onSelect}
    >
      {mediaLike
        ? <div className="media" role="img" aria-label={`${type} content unavailable in the message projection`}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M8 9h8M8 13h5M8 17h7" /></svg>
            <span className="media-copy"><span className="media-title">{type}</span><span className="media-meta">{message.id}</span></span>
          </div>
        : <p className="message-placeholder"><span>{type}</span> <span className="mono">{message.id}</span></p>}
      {isOutgoing && (
        <span className="foot"><span className={`dot ${statusDot(status)}`} aria-hidden="true" />{status ?? 'unknown'} · {time}</span>
      )}
      {!isOutgoing && knownDirection && <span className="foot">{time}</span>}
    </button>
  );
}

export function MessageTimeline({ instanceId, chatId }: { instanceId: string; chatId: string }) {
  const query = useInstanceMessages(instanceId);
  const [searchParams, setSearchParams] = useSearchParams();
  const paneRef = useRef<HTMLDivElement>(null);
  const nearBottomRef = useRef(true);
  const initialChatRef = useRef<string>();
  const previousLastMessageRef = useRef<string>();
  const pages = query.data?.pages ?? [];
  const readState = useResilientReadState(query, pages.some((page) => page.resource !== undefined));
  const unavailable = pages.some((page) => page.unavailable !== undefined);
  const messages = useMemo(() => pages
    .flatMap((page) => page.resource?.items ?? [])
    .filter((message) => message.chatId === chatId)
    .sort((left, right) => messageTimestamp(left) - messageTimestamp(right)), [chatId, pages]);
  const selectedMessageId = searchParams.get('message');
  const sections = useMemo(() => {
    const grouped = new Map<string, MessageResource[]>();
    for (const message of messages) {
      const key = calendarDayKey(message.createdAt);
      const section = grouped.get(key);
      if (section) section.push(message); else grouped.set(key, [message]);
    }
    return [...grouped.values()];
  }, [messages]);
  const lastMessageId = messages.at(-1)?.id;

  useLayoutEffect(() => {
    const pane = paneRef.current;
    if (!pane || messages.length === 0) return;
    const firstLoadForChat = initialChatRef.current !== chatId;
    const appended = previousLastMessageRef.current !== undefined && previousLastMessageRef.current !== lastMessageId;
    if (firstLoadForChat || (appended && nearBottomRef.current)) pane.scrollTop = pane.scrollHeight;
    initialChatRef.current = chatId;
    previousLastMessageRef.current = lastMessageId;
  }, [chatId, lastMessageId, messages.length]);

  const selectMessage = (messageId: string) => {
    const next = new URLSearchParams(searchParams);
    if (selectedMessageId === messageId) {
      next.delete('message');
    } else {
      next.set('message', messageId);
      next.set('pane', 'context');
    }
    setSearchParams(next);
  };

  let content: React.ReactNode;
  if (readState.isInitialError) {
    content = <InlineError error={readState.error} onRetry={() => { void query.refetch(); }} className="chat-thread-error" />;
  } else if (readState.isInitialLoading) {
    content = <div className="chat-calm-state" aria-live="polite"><span className="eyebrow">Loading</span><h2>Loading message history.</h2><p>The first instance message page is in progress.</p></div>;
  } else if (unavailable && messages.length === 0) {
    content = <div className="chat-calm-state"><span className="eyebrow">Data pending</span><h2>Message history is not available yet.</h2><p>No failure has been reported. This read remains pending.</p></div>;
  } else if (messages.length === 0) {
    content = <div className="chat-calm-state"><span className="eyebrow">0 messages</span><h2>No messages loaded for this conversation yet.</h2><p>History loads per instance, so older conversation messages may appear as more pages are loaded.</p></div>;
  } else {
    content = sections.map((section) => (
      <div className="message-day" key={calendarDayKey(section[0]?.createdAt)}>
        <div className="day-sep">{calendarDayLabel(section[0]?.createdAt)}</div>
        {section.map((message) => <MessageBubble key={message.id} message={message} selected={message.id === selectedMessageId} onSelect={() => selectMessage(message.id)} />)}
      </div>
    ));
  }

  return (
    <div
      className="timeline-pane"
      role="log"
      aria-label="Message timeline"
      aria-live="off"
      ref={paneRef}
      onScroll={(event) => {
        const pane = event.currentTarget;
        nearBottomRef.current = pane.scrollHeight - pane.scrollTop - pane.clientHeight < 80;
      }}
    >
      <div className="timeline-stack">
        {readState.isStaleError && <InlineError error={readState.error} onRetry={() => { void query.refetch(); }} className="chat-thread-error" />}
        {query.hasNextPage && !unavailable && (
          <button className="btn sm load-older" type="button" disabled={query.isFetchingNextPage} onClick={() => { void query.fetchNextPage(); }}>
            {query.isFetchingNextPage ? 'Loading older…' : 'Load older'}
          </button>
        )}
        {content}
      </div>
    </div>
  );
}
