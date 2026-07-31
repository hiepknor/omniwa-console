import type { ConversationResource } from '@/api/conversations';
import type { MessageResource } from '@/api/messages';
import { useEffect, useLayoutEffect, useRef, useState, type MutableRefObject, type ReactNode } from 'react';
import { calendarDayKey, calendarDayLabel, humanizeToken, relativeTime } from '@/lib/format';
import { Button, CountBadge, CursorPagination, Status, WorkspacePaneHeader } from '@/ui';
import { cn } from '@/ui/cn';

export function ConversationUnreadCount({ count, authoritative }: { count: number; authoritative: boolean }) {
  if (!authoritative) return <Status tone="pending">Unread syncing</Status>;
  if (count === 0) return null;
  const label = `${count.toLocaleString('en-US')} unread ${count === 1 ? 'message' : 'messages'}`;
  return <CountBadge count={count} aria-label={label} title={label} />;
}

export function SelectedConversationHeader({ conversation, projectionAttention, onDetails, className }: {
  conversation: ConversationResource;
  projectionAttention?: ReactNode;
  onDetails: () => void;
  className?: string;
}) {
  const name = conversation.displayName ?? `Unknown ${humanizeToken(conversation.type)} conversation`;
  const activity = conversation.lastActivityAt ? relativeTime(conversation.lastActivityAt) : 'unreported';
  return (
    <WorkspacePaneHeader
      className={className}
      title={name}
      description={`${humanizeToken(conversation.type)} · Last activity ${activity}`}
      actions={<>{projectionAttention}<Button className="@min-[1560px]/responsive-inspector:hidden" onClick={onDetails}>Details</Button></>}
    />
  );
}

function ResourceButton({ selected, onClick, primary, secondary, trailing }: { selected?: boolean; onClick: () => void; primary: string; secondary: string; trailing: React.ReactNode }) {
  return (
    <li className={cn('border-b border-b-line border-l-2 last:border-b-0', selected ? 'border-l-line-strong bg-elevated' : 'border-l-transparent')}>
      <button
        type="button"
        aria-current={selected ? 'page' : undefined}
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
          trailing={<ConversationUnreadCount count={item.unreadCount} authoritative={item.unreadAuthoritative} />}
        />
      ))}
    </ul>
  );
}

export function ConversationMessagePagination({ itemCount, cursor, nextCursor, onCursor }: {
  itemCount: number;
  cursor?: string;
  nextCursor?: string;
  onCursor: (cursor?: string) => void;
}) {
  if (itemCount === 0 && !cursor && !nextCursor) return null;

  return (
    <div className="mt-auto">
      <CursorPagination
        cursor={cursor}
        nextCursor={nextCursor}
        resetLabel="Newest"
        nextLabel="Older messages"
        info="Showing one bounded message page."
        compactOnSmall
        onCursor={onCursor}
      />
    </div>
  );
}

export function isNearScrollEnd({ scrollHeight, scrollTop, clientHeight }: Pick<HTMLElement, 'scrollHeight' | 'scrollTop' | 'clientHeight'>, threshold = 80): boolean {
  return scrollHeight - scrollTop - clientHeight <= threshold;
}

export function appendedMessageScrollAction({ anchorToEnd, keyChanged, previousNewestAt, nextNewestAt, nearEnd }: {
  anchorToEnd: boolean;
  keyChanged: boolean;
  previousNewestAt?: number;
  nextNewestAt?: number;
  nearEnd: boolean;
}): 'follow' | 'offer-latest' | 'none' {
  if (!anchorToEnd || keyChanged || previousNewestAt === undefined || nextNewestAt === undefined || nextNewestAt <= previousNewestAt) return 'none';
  return nearEnd ? 'follow' : 'offer-latest';
}

export function shouldAnchorInitialMessagePage({ anchorToEnd, keyChanged, initialLatestPending, itemCount }: {
  anchorToEnd: boolean;
  keyChanged: boolean;
  initialLatestPending: boolean;
  itemCount: number;
}): boolean {
  return anchorToEnd && itemCount > 0 && (keyChanged || initialLatestPending);
}

function newestMessageTimestamp(items: MessageResource[]): number | undefined {
  if (!items.length) return undefined;
  return Math.max(...items.map((item) => Date.parse(item.createdAt)));
}

function projectedMessageContent(item: MessageResource): string {
  return item.contentText ?? item.caption ?? item.contentSummary ?? (item.type === 'text' ? 'Text content not reported' : 'Message content not reported');
}

export function MessageTimeline({ items, selectedId, onSelect, renderMedia, conversationType, scrollKey, scrollContainerRef, anchorToEnd = false }: {
  items: MessageResource[];
  selectedId?: string;
  onSelect: (id: string) => void;
  renderMedia?: (message: MessageResource) => ReactNode;
  conversationType?: ConversationResource['type'];
  scrollKey?: string;
  scrollContainerRef?: MutableRefObject<HTMLDivElement | null>;
  anchorToEnd?: boolean;
}) {
  const timelineRef = useRef<HTMLOListElement>(null);
  const nearEndRef = useRef(true);
  const previousScrollKey = useRef<string | undefined | null>(null);
  const previousNewestAt = useRef<number>();
  const initialLatestPending = useRef(false);
  const [hasNewerItems, setHasNewerItems] = useState(false);

  useEffect(() => {
    const scroller = scrollContainerRef?.current;
    if (!scroller) return;
    const update = () => {
      nearEndRef.current = isNearScrollEnd(scroller);
      if (nearEndRef.current) setHasNewerItems(false);
    };
    update();
    scroller.addEventListener('scroll', update, { passive: true });
    return () => scroller.removeEventListener('scroll', update);
  }, [scrollContainerRef]);

  useLayoutEffect(() => {
    const scroller = scrollContainerRef?.current;
    const keyChanged = previousScrollKey.current !== scrollKey;
    const nextNewestAt = newestMessageTimestamp(items);
    const action = appendedMessageScrollAction({ anchorToEnd, keyChanged, previousNewestAt: previousNewestAt.current, nextNewestAt, nearEnd: nearEndRef.current });
    if (keyChanged) {
      initialLatestPending.current = anchorToEnd;
      nearEndRef.current = anchorToEnd;
      setHasNewerItems(false);
    }
    if (scroller && shouldAnchorInitialMessagePage({ anchorToEnd, keyChanged, initialLatestPending: initialLatestPending.current, itemCount: items.length })) {
      scroller.scrollTop = scroller.scrollHeight;
      initialLatestPending.current = false;
      nearEndRef.current = true;
      setHasNewerItems(false);
    } else if (!keyChanged && scroller && action === 'follow') {
      scroller.scrollTop = scroller.scrollHeight;
      nearEndRef.current = true;
      setHasNewerItems(false);
    } else if (!keyChanged && action === 'offer-latest') {
      setHasNewerItems(true);
    }
    previousScrollKey.current = scrollKey;
    previousNewestAt.current = nextNewestAt;
  }, [anchorToEnd, items, scrollContainerRef, scrollKey]);

  return (
    <>
      <ol ref={timelineRef} className={cn('grid w-full gap-3 p-4', anchorToEnd && 'mt-auto')} aria-label="Projected message history">
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
      {hasNewerItems ? <div className="sticky bottom-3 z-10 flex justify-center px-4" aria-live="polite"><Button onClick={() => {
        const scroller = scrollContainerRef?.current;
        if (scroller) scroller.scrollTop = scroller.scrollHeight;
        nearEndRef.current = true;
        setHasNewerItems(false);
      }}>Latest messages</Button></div> : null}
    </>
  );
}
