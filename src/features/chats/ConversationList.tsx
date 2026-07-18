import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { InstanceResource } from '@/api/instances';
import { InlineError } from '@/components/InlineError';
import { relativeTime } from '@/lib/format';
import { useInstanceChats, useInstanceLabels, usePickerInstances } from './hooks';

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

function initials(name: string | undefined) {
  if (!name?.trim()) return '—';
  const words = name.trim().split(/\s+/u);
  return `${words[0]?.[0] ?? ''}${words.length > 1 ? words.at(-1)?.[0] ?? '' : ''}`.toUpperCase();
}

function PickerPopover({
  trigger,
  children,
  label,
}: {
  trigger: (open: boolean) => React.ReactNode;
  children: (close: () => void) => React.ReactNode;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeEscape);
    };
  }, [open]);

  return (
    <div className="chat-picker" ref={rootRef}>
      <div onClick={() => setOpen((current) => !current)}>{trigger(open)}</div>
      {open && <div className="chat-picker-menu" role="menu" aria-label={label}>{children(() => setOpen(false))}</div>}
    </div>
  );
}

function InstancePicker({
  instances,
  selected,
  onSelect,
}: {
  instances: InstanceResource[];
  selected: InstanceResource | undefined;
  onSelect: (instanceId: string) => void;
}) {
  return (
    <PickerPopover
      label="Instances"
      trigger={(open) => (
        <button className="instpick" type="button" aria-label="Select instance" aria-haspopup="menu" aria-expanded={open}>
          <span className={`dot instance-status-dot ${statusDot(selected?.status)}`} aria-hidden="true" />
          <span>{selected?.displayName ?? selected?.id ?? 'Select instance'}</span>
          <span className="chev" aria-hidden="true">▾</span>
        </button>
      )}
    >
      {(close) => instances.length > 0 ? instances.map((instance) => (
        <button
          className={instance.id === selected?.id ? 'is-selected' : undefined}
          key={instance.id}
          type="button"
          role="menuitemradio"
          aria-checked={instance.id === selected?.id}
          onClick={() => { onSelect(instance.id); close(); }}
        >
          <span className={`dot ${statusDot(instance.status)}`} aria-hidden="true" />
          <span><strong>{instance.displayName ?? instance.id}</strong><small className="mono">{instance.id}</small></span>
        </button>
      )) : <span className="chat-picker-empty">No instances available</span>}
    </PickerPopover>
  );
}

export function ConversationList({ instanceId, chatId, onOpenThread }: {
  instanceId: string | undefined;
  chatId: string | undefined;
  onOpenThread: () => void;
}) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const picker = usePickerInstances();
  const chatsQuery = useInstanceChats(instanceId);
  const labelsQuery = useInstanceLabels(instanceId);
  const search = searchParams.get('search') ?? '';
  const activeLabelIds = searchParams.getAll('label');
  const instances = picker.data?.resource?.items ?? [];
  const selectedInstance = instances.find((instance) => instance.id === instanceId);
  const pages = chatsQuery.data?.pages ?? [];
  const chats = useMemo(() => pages.flatMap((page) => page.resource?.items ?? []), [pages]);
  const labels = labelsQuery.data?.resource?.items ?? [];
  const labelNames = useMemo(() => new Map(labels.map((label) => [label.id, label.name ?? label.id])), [labels]);
  const filteredChats = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase();
    return chats.filter((chat) => {
      const matchesSearch = !needle
        || chat.id.toLocaleLowerCase().includes(needle)
        || chat.displayName?.toLocaleLowerCase().includes(needle);
      const matchesLabels = activeLabelIds.every((labelId) => chat.labelIds?.includes(labelId));
      return matchesSearch && matchesLabels;
    });
  }, [activeLabelIds, chats, search]);
  const unavailable = pages.some((page) => page.unavailable !== undefined);
  const labelsAvailable = labelsQuery.data?.unavailable === undefined && labels.length > 0;
  const remainingLabels = labels.filter((label) => !activeLabelIds.includes(label.id));

  const routeSearchParams = new URLSearchParams(searchParams);
  routeSearchParams.delete('message');
  const querySuffix = routeSearchParams.size > 0 ? `?${routeSearchParams.toString()}` : '';
  const chooseInstance = (nextInstanceId: string) => navigate(`/chats/${encodeURIComponent(nextInstanceId)}${querySuffix}`);
  const chooseChat = (nextChatId: string) => {
    if (!instanceId) return;
    navigate(`/chats/${encodeURIComponent(instanceId)}/${encodeURIComponent(nextChatId)}${querySuffix}`);
    onOpenThread();
  };
  const setSearch = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set('search', value); else next.delete('search');
    setSearchParams(next, { replace: true });
  };
  const removeLabel = (labelId: string) => {
    const next = new URLSearchParams(searchParams);
    next.delete('label');
    activeLabelIds.filter((id) => id !== labelId).forEach((id) => next.append('label', id));
    setSearchParams(next, { replace: true });
  };
  const addLabel = (labelId: string) => {
    const next = new URLSearchParams(searchParams);
    next.append('label', labelId);
    setSearchParams(next, { replace: true });
  };

  let listContent: React.ReactNode;
  if (!instanceId) {
    listContent = picker.isError ? (
      <InlineError error={picker.error} onRetry={() => { void picker.refetch(); }} className="chat-list-error" />
    ) : (
      <div className="chat-calm-state"><span className="eyebrow">Instance required</span><h2>Select an instance</h2><p>Choose an instance to review its direct conversations.</p></div>
    );
  } else if (unavailable) {
    listContent = <div className="chat-calm-state"><span className="eyebrow">Data pending</span><h2>Conversations are not available yet.</h2><p>No failure has been reported. This read remains pending.</p></div>;
  } else if (chatsQuery.isError && chats.length === 0) {
    listContent = <InlineError error={chatsQuery.error} onRetry={() => { void chatsQuery.refetch(); }} className="chat-list-error" />;
  } else if (chatsQuery.isLoading) {
    listContent = <div className="chat-calm-state" aria-live="polite"><span className="eyebrow">Loading</span><h2>Loading conversations.</h2><p>The first conversation read is in progress.</p></div>;
  } else if (filteredChats.length === 0) {
    listContent = (
      <div className="chat-calm-state"><span className="eyebrow">0 chats</span><h2>{chats.length === 0 ? 'No direct conversations yet.' : 'No conversations match these filters.'}</h2><p>{chats.length === 0 ? 'New direct conversations will appear here.' : 'Adjust the search or remove a label filter.'}</p></div>
    );
  } else {
    listContent = filteredChats.map((chat) => (
      <button
        className={`convo${chat.id === chatId ? ' selected' : ''}`}
        key={chat.id}
        type="button"
        aria-current={chat.id === chatId ? 'page' : undefined}
        onClick={() => chooseChat(chat.id)}
      >
        <span className="avatar" aria-hidden="true">{initials(chat.displayName)}</span>
        <span className="meta">
          <span className="name">{chat.displayName ?? chat.id}</span>
          <span className="sub">
            {chat.labelIds?.map((labelId) => <span className="chip label-chip" key={labelId}>{labelNames.get(labelId) ?? labelId}</span>)}
            <span className="mono chat-id">{chat.id}</span>
          </span>
        </span>
        <span className="right">
          <span className="when">{relativeTime(chat.lastMessageAt) || '—'}</span>
          {(chat.unreadCount ?? 0) > 0 && <span className="unread" aria-label={`${chat.unreadCount} unread ${chat.unreadCount === 1 ? 'message' : 'messages'}`}>{chat.unreadCount}</span>}
        </span>
      </button>
    ));
  }

  return (
    <aside className="convos" id="chat-conversations" aria-label="Direct conversations">
      <header className="head">
        <InstancePicker instances={instances} selected={selectedInstance} onSelect={chooseInstance} />
        <label className="chat-search-label" htmlFor="chat-search">Search direct chats</label>
        <input className="search" id="chat-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search direct chats…" disabled={!instanceId} />
        <div className="filters" aria-label="Active conversation filters">
          {activeLabelIds.map((labelId) => (
            <button className="chip filter-active" key={labelId} type="button" aria-label={`Remove label filter ${labelNames.get(labelId) ?? labelId}`} onClick={() => removeLabel(labelId)}>
              {labelNames.get(labelId) ?? labelId} <span className="x" aria-hidden="true">✕</span>
            </button>
          ))}
          {labelsAvailable && remainingLabels.length > 0 && (
            <PickerPopover label="Labels" trigger={(open) => <button className="chip add" type="button" aria-haspopup="menu" aria-expanded={open}>+ label</button>}>
              {(close) => remainingLabels.map((label) => (
                <button key={label.id} type="button" role="menuitem" onClick={() => { addLabel(label.id); close(); }}>{label.name ?? label.id}</button>
              ))}
            </PickerPopover>
          )}
        </div>
      </header>
      <nav className="list" aria-label="Direct chat results">{listContent}</nav>
      <footer className="table-foot">
        <span className="num">{chats.length} loaded chats</span>
        {chatsQuery.hasNextPage && <button className="btn sm" type="button" disabled={chatsQuery.isFetchingNextPage} onClick={() => { void chatsQuery.fetchNextPage(); }}>{chatsQuery.isFetchingNextPage ? 'Loading…' : 'More'}</button>}
      </footer>
    </aside>
  );
}
