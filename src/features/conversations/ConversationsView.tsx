import type { ConversationResource } from '@/api/conversations';
import type { ContactResource } from '@/api/contacts';
import type { LabelResource } from '@/api/labels';
import type { MessageResource } from '@/api/messages';
import { useId, type ReactNode } from 'react';
import { humanizeToken, relativeTime } from '@/lib/format';
import { CountBadge, DescriptionItem, DescriptionList, Status } from '@/ui';
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

export function ConversationFacts({ conversation }: { conversation: ConversationResource }) {
  const headingId = useId();
  const nameSource = conversation.displayNameSource ? humanizeToken(conversation.displayNameSource) : 'Source unreported';
  const projectedState = [
    conversation.archived === undefined ? 'Archive unreported' : conversation.archived ? 'Archived' : 'Not archived',
    conversation.pinned === undefined ? 'Pin unreported' : conversation.pinned ? 'Pinned' : 'Not pinned',
  ].join(' · ');
  const disappearingPolicy = conversation.disappearingTimer === undefined ? 'Timer unreported' : `Disappearing ${conversation.disappearingTimer.toLocaleString('en-US')}s`;
  return (
    <section className="border-b border-line bg-recessed px-4 py-2" aria-labelledby={headingId}>
      <h2 id={headingId} className="mb-1 text-[11px] font-medium uppercase tracking-[0.08em] text-fg-3">Conversation facts</h2>
      <DescriptionList className="grid-cols-2 gap-x-4">
        <DescriptionItem label="Name provenance" className="col-span-2">
          {nameSource} · {conversation.displayNameUpdatedAt ? <time title={conversation.displayNameUpdatedAt}>updated {relativeTime(conversation.displayNameUpdatedAt) || conversation.displayNameUpdatedAt}</time> : 'update unreported'}
        </DescriptionItem>
        <DescriptionItem label="Contact ID" mono className="col-span-2">{conversation.contactId ?? 'Not reported'}</DescriptionItem>
        <DescriptionItem label="Command target">{conversation.addressingJid ? 'Available' : 'Not reported'}</DescriptionItem>
        <DescriptionItem label="Provider aliases">{conversation.aliasesReported ? `${conversation.aliases.length.toLocaleString('en-US')} reported` : 'Not reported'}</DescriptionItem>
        <DescriptionItem label="Projected state" className="col-span-2">{projectedState}</DescriptionItem>
        <DescriptionItem label="Message policy" className="col-span-2">
          {conversation.mutedUntil ? <time title={conversation.mutedUntil}>Muted until {relativeTime(conversation.mutedUntil) || conversation.mutedUntil}</time> : 'Mute unreported'} · {disappearingPolicy}
        </DescriptionItem>
      </DescriptionList>
    </section>
  );
}

export function ContactList({ items, selectedId, onSelect }: { items: ContactResource[]; selectedId?: string; onSelect: (id: string) => void }) {
  return (
    <ul className="grid">
      {items.map((item) => (
        <ResourceButton
          key={item.id}
          selected={item.id === selectedId}
          onClick={() => onSelect(item.id)}
          primary={item.displayName ?? 'Unknown contact'}
          secondary={item.identityStatus === 'legacy' ? 'Legacy identity' : `${humanizeToken(item.identityStatus)} identity`}
          trailing={<Status tone={item.found === true ? 'ok' : 'neutral'}>{item.found === undefined ? 'Unreported' : item.found ? 'Found' : 'Not found'}</Status>}
        />
      ))}
    </ul>
  );
}

export function LabelList({ items, selectedId, onSelect }: { items: LabelResource[]; selectedId?: string; onSelect: (id: string) => void }) {
  return (
    <ul className="grid">
      {items.map((item) => (
        <ResourceButton
          key={item.id}
          selected={item.id === selectedId}
          onClick={() => onSelect(item.id)}
          primary={item.name ?? 'Unnamed label'}
          secondary={item.id}
          trailing={<span className="text-xs text-fg-3">{item.color ?? 'Color unreported'}</span>}
        />
      ))}
    </ul>
  );
}

export function MessageTimeline({ items, selectedId, onSelect, renderMedia }: { items: MessageResource[]; selectedId?: string; onSelect: (id: string) => void; renderMedia?: (message: MessageResource) => ReactNode }) {
  return (
    <ol className="grid gap-3 p-4" aria-label="Projected message history">
      {items.map((item) => {
        const outgoing = item.direction === 'outgoing';
        const failed = item.status === 'failed';
        return (
          <li key={item.id} className={cn('flex', outgoing ? 'justify-end' : 'justify-start')}>
            <button
              type="button"
              onClick={() => onSelect(item.id)}
              className={cn(
                'grid gap-1.5 w-fit max-w-[78%] p-3 text-left border',
                outgoing ? 'bg-fg text-bg border-fg' : 'bg-recessed text-fg border-line',
                item.id === selectedId && 'outline outline-2 outline-offset-2 outline-fg-3',
                failed && 'border-l-2 border-l-fg-3',
              )}
            >
              {item.mediaAssetId || item.mediaType === 'image' ? renderMedia?.(item) : null}
              <span className="text-[13px] break-words">{item.contentText ?? item.caption ?? item.contentSummary ?? `[${humanizeToken(item.type)}]`}</span>
              <small className={cn('flex items-center justify-between gap-4 text-[11px]', outgoing ? 'text-bg/70' : 'text-fg-3')}>
                <span>{item.status ? humanizeToken(item.status) : 'Status unreported'}</span>
                <time title={item.createdAt}>{relativeTime(item.createdAt) || item.createdAt}</time>
              </small>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
