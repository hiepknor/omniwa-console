import type { ConversationResource } from '@/api/conversations';
import type { MessageResource } from '@/api/messages';
import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';
import { calendarDayKey, calendarDayLabel, humanizeToken, relativeTime } from '@/lib/format';
import { CountBadge } from '@/ui';
import { cn } from '@/ui/cn';

export function ConversationUnreadCount({ count, context }: { count: number; context: 'directory' | 'detail' }) {
  if (context === 'directory' && count === 0) return null;
  const label = `${count.toLocaleString('en-US')} unread ${count === 1 ? 'message' : 'messages'}`;

  if (context === 'directory') {
    return <CountBadge count={count} aria-label={label} title={label} />;
  }

  return <span className="inline-flex items-center gap-1.5"><span>Unread</span><CountBadge count={count} /></span>;
}

function ResourceButton({ selected, onClick, primary, secondary, trailing }: { selected?: boolean; onClick: () => void; primary: string; secondary: string; trailing: React.ReactNode }) {
  return (
    <li className={cn('border-b border-line last:border-b-0', selected && 'bg-elevated')}>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center justify-between gap-3 min-h-[64px] px-3 text-left hover:bg-elevated"
      >
        <span className="grid min-w-0 gap-0.5">
          <strong className="truncate text-[13px] font-medium text-fg">{primary}</strong>
          <small className="truncate text-xs text-fg-3">{secondary}</small>
        </span>
        {trailing}
      </button>
    </li>
  );
}

export function ConversationList({ items, selectedId, onSelect }: { items: ConversationResource[]; selectedId?: string; onSelect: (id: string) => void }) {
  return (
    <ul className="grid">
      {items.map((item) => (
        <ResourceButton
          key={item.conversationId}
          selected={item.conversationId === selectedId}
          onClick={() => onSelect(item.conversationId)}
          primary={item.displayName ?? `Unknown ${humanizeToken(item.type)} conversation`}
          secondary={`${humanizeToken(item.type)} · ${item.lastActivityAt ? relativeTime(item.lastActivityAt) : 'activity unreported'}`}
          trailing={<ConversationUnreadCount count={item.unreadCount} context="directory" />}
        />
      ))}
    </ul>
  );
}

export function isNearScrollEnd({ scrollHeight, scrollTop, clientHeight }: Pick<HTMLElement, 'scrollHeight' | 'scrollTop' | 'clientHeight'>, threshold = 80): boolean {
  return scrollHeight - scrollTop - clientHeight <= threshold;
}

function projectedMessageContent(item: MessageResource): string {
  return item.contentText ?? item.caption ?? item.contentSummary ?? (item.type === 'text' ? 'Text content not reported' : 'Message content not reported');
}

export function MessageTimeline({ items, selectedId, onSelect, renderMedia, conversationType, scrollKey, anchorToEnd = false }: {
  items: MessageResource[];
  selectedId?: string;
  onSelect: (id: string) => void;
  renderMedia?: (message: MessageResource) => ReactNode;
  conversationType?: ConversationResource['type'];
  scrollKey?: string;
  anchorToEnd?: boolean;
}) {
  const timelineRef = useRef<HTMLOListElement>(null);
  const nearEndRef = useRef(true);
  const previousScrollKey = useRef<string>();
  const previousItemCount = useRef(0);

  useEffect(() => {
    const scroller = timelineRef.current?.parentElement;
    if (!scroller) return;
    const update = () => { nearEndRef.current = isNearScrollEnd(scroller); };
    update();
    scroller.addEventListener('scroll', update, { passive: true });
    return () => scroller.removeEventListener('scroll', update);
  }, []);

  useLayoutEffect(() => {
    const scroller = timelineRef.current?.parentElement;
    const keyChanged = previousScrollKey.current !== scrollKey;
    const appended = items.length > previousItemCount.current;
    if (scroller && anchorToEnd && (keyChanged || (appended && nearEndRef.current))) {
      scroller.scrollTop = scroller.scrollHeight;
      nearEndRef.current = true;
    }
    previousScrollKey.current = scrollKey;
    previousItemCount.current = items.length;
  }, [anchorToEnd, items.length, scrollKey]);

  return (
    <ol ref={timelineRef} className="grid w-full gap-3 p-4" aria-label="Projected message history">
      {items.map((item, index) => {
        const outgoing = item.direction === 'outgoing';
        const failed = item.status === 'failed';
        const content = projectedMessageContent(item);
        const hasMedia = Boolean(item.mediaAssetId || item.mediaType === 'image');
        const reportedContent = item.contentText ?? item.caption ?? item.contentSummary;
        const accessibleContent = reportedContent ?? (hasMedia ? `${humanizeToken(item.type)} attachment` : content);
        const showDay = index === 0 || calendarDayKey(items[index - 1]?.createdAt) !== calendarDayKey(item.createdAt);
        const directionLabel = humanizeToken(item.direction);
        const statusLabel = item.status ? humanizeToken(item.status) : 'Unreported';
        const unidentifiedGroupParticipant = conversationType === 'group' && item.direction === 'incoming';
        return (
          <li key={item.id} className="grid gap-3">
            {showDay ? (
              <div role="separator" aria-label={calendarDayLabel(item.createdAt)} className="flex items-center gap-3 py-1 text-[11px] text-fg-3">
                <span className="h-px min-w-4 flex-1 bg-line" />
                <time dateTime={item.createdAt}>{calendarDayLabel(item.createdAt)}</time>
                <span className="h-px min-w-4 flex-1 bg-line" />
              </div>
            ) : null}
            <div className={cn('flex', outgoing ? 'justify-end' : item.direction === 'incoming' ? 'justify-start' : 'justify-center')}>
              <button
                type="button"
                aria-label={`${directionLabel}${unidentifiedGroupParticipant ? ' group' : ''} message${unidentifiedGroupParticipant ? ' from unidentified participant' : ''}: ${accessibleContent} Status: ${statusLabel}. Time: ${relativeTime(item.createdAt) || item.createdAt}`}
                onClick={() => onSelect(item.id)}
                className={cn(
                  'grid w-fit max-w-[min(78%,42rem)] gap-1.5 border p-3 text-left',
                  outgoing ? 'border-fg bg-fg text-bg' : item.direction === 'incoming' ? 'border-line bg-recessed text-fg' : 'border-line-strong bg-surface text-fg',
                  item.id === selectedId && 'outline outline-2 outline-offset-2 outline-fg-3',
                  failed && 'border-l-2 border-l-fg-3',
                )}
              >
                {unidentifiedGroupParticipant ? <small className="text-[11px] text-fg-3">Participant not identified</small> : null}
                {hasMedia ? renderMedia?.(item) : null}
                {!hasMedia || item.contentText || item.caption || item.contentSummary ? <span className="break-words text-[13px]">{content}</span> : null}
                <small className={cn('flex items-center justify-between gap-4 text-[11px]', outgoing ? 'text-bg/70' : 'text-fg-3')}>
                  <span>{directionLabel} · {statusLabel}</span>
                  <time dateTime={item.createdAt} title={item.createdAt}>{relativeTime(item.createdAt) || item.createdAt}</time>
                </small>
              </button>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
