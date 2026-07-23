import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type ReactElement,
  type ReactNode,
} from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { hasCapability } from '@/api/capabilities';
import { useInstanceCapabilities } from '@/api/CapabilitiesProvider';
import { ApiFailure } from '@/api/envelopes';
import type { InstanceResource } from '@/api/instances';
import { InlineError } from '@/components/InlineError';
import { ProjectionNotice } from '@/components/ProjectionNotice';
import { RealtimeIndicator } from '@/components/RealtimeIndicator';
import { relativeTime } from '@/lib/format';
import { cursorRecoveryAction } from '@/lib/cursor-recovery';
import { projectionCollectionState } from '@/lib/projection-collection-state';
import { useResilientReadState } from '@/lib/query-state';
import { useInstanceChats, useInstanceContacts, useInstanceLabels, usePickerInstances, useResetInstanceChats } from './hooks';

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
  trigger: (open: boolean) => ReactElement<ComponentPropsWithRef<'button'>>;
  children: (close: () => void) => ReactNode;
  label: string;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const close = (restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  };
  const childNodes = Children.toArray(children(() => close()));
  const itemCount = childNodes.filter((child) => isValidElement<ComponentPropsWithRef<'button'>>(child)
    && (child.props.role === 'menuitem' || child.props.role === 'menuitemradio')).length;
  const openAt = (index: number) => {
    setActiveIndex(itemCount > 0 ? (index + itemCount) % itemCount : 0);
    setOpen(true);
  };
  const move = (offset: number) => {
    if (itemCount > 0) setActiveIndex((current) => (current + offset + itemCount) % itemCount);
  };

  useEffect(() => {
    if (!open) return;
    itemRefs.current[activeIndex]?.focus();
    const closeOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) close();
    };
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, [activeIndex, open]);

  const triggerElement = trigger(open);
  const augmentedTrigger = cloneElement(triggerElement, {
    ref: triggerRef,
    'aria-controls': `${id}-menu`,
    onClick: (event) => {
      triggerElement.props.onClick?.(event);
      if (!event.defaultPrevented) open ? close() : openAt(0);
    },
    onKeyDown: (event) => {
      triggerElement.props.onKeyDown?.(event);
      if (event.defaultPrevented) return;
      if (event.key === 'ArrowDown') { event.preventDefault(); openAt(open ? activeIndex + 1 : 0); }
      if (event.key === 'ArrowUp') { event.preventDefault(); openAt(open ? activeIndex - 1 : itemCount - 1); }
      if (event.key === 'Home') { event.preventDefault(); openAt(0); }
      if (event.key === 'End') { event.preventDefault(); openAt(itemCount - 1); }
      if (event.key === 'Escape' && open) { event.preventDefault(); close(true); }
    },
  });

  let itemIndex = 0;
  const menuChildren = childNodes.map((child) => {
    if (!isValidElement<ComponentPropsWithRef<'button'>>(child)
      || (child.props.role !== 'menuitem' && child.props.role !== 'menuitemradio')) return child;
    const index = itemIndex;
    itemIndex += 1;
    return cloneElement(child, {
      ref: (node) => { itemRefs.current[index] = node; },
      tabIndex: open && index === activeIndex ? 0 : -1,
      onMouseEnter: (event) => {
        child.props.onMouseEnter?.(event);
        if (!event.defaultPrevented) setActiveIndex(index);
      },
      onKeyDown: (event) => {
        child.props.onKeyDown?.(event);
        if (event.defaultPrevented) return;
        if (event.key === 'ArrowDown') { event.preventDefault(); move(1); }
        if (event.key === 'ArrowUp') { event.preventDefault(); move(-1); }
        if (event.key === 'Home') { event.preventDefault(); setActiveIndex(0); }
        if (event.key === 'End') { event.preventDefault(); setActiveIndex(itemCount - 1); }
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.currentTarget.click(); }
        if (event.key === 'Escape') { event.preventDefault(); close(true); }
        if (event.key === 'Tab') close();
      },
    });
  });

  return (
    <div className="chat-picker" ref={rootRef}>
      {augmentedTrigger}
      {open && <div className="chat-picker-menu !overflow-x-hidden" id={`${id}-menu`} role="menu" aria-label={label}>{menuChildren}</div>}
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
  const pickerLabel = selected
    ? (selected.displayName ?? `Unnamed · ${selected.id}`)
    : 'Select instance';
  const pickerTitle = selected
    ? `${selected.displayName ?? 'Unnamed instance'} · ${selected.id}`
    : pickerLabel;

  return (
    <PickerPopover
      label="Instances"
      trigger={(open) => (
        <button className="instpick !min-h-11" type="button" title={`Select instance. Current: ${pickerTitle}`} aria-haspopup="menu" aria-expanded={open}>
          <span className={`dot instance-status-dot ${statusDot(selected?.status)}`} aria-hidden="true" />
          <span className="instpick-name">{pickerLabel}</span>
          <span className="chev" aria-hidden="true">▾</span>
        </button>
      )}
    >
      {(close) => instances.length > 0 ? instances.map((instance) => (
        <button
          className={`${instance.id === selected?.id ? 'is-selected ' : ''}!min-w-0`}
          key={instance.id}
          type="button"
          role="menuitemradio"
          aria-checked={instance.id === selected?.id}
          onClick={() => { onSelect(instance.id); close(); }}
        >
          <span className={`dot ${statusDot(instance.status)}`} aria-hidden="true" />
          <span className="!min-w-0 overflow-hidden"><strong className="block overflow-hidden text-ellipsis whitespace-nowrap">{instance.displayName ?? 'Unnamed instance'}</strong><small className="mono block max-w-full overflow-hidden text-ellipsis whitespace-nowrap" title={instance.id}>{instance.id}</small></span>
        </button>
      )) : <span className="chat-picker-empty">No instances available</span>}
    </PickerPopover>
  );
}

export function ConversationList({ instanceId, chatId }: {
  instanceId: string | undefined;
  chatId: string | undefined;
}) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const picker = usePickerInstances();
  const pickerReadState = useResilientReadState(picker, picker.data?.resource !== undefined);
  const instances = picker.data?.resource?.items ?? [];
  const selectedInstance = instances.find((instance) => instance.id === instanceId);
  const search = searchParams.get('search')?.trim() ?? '';
  const cursor = searchParams.get('cursor') || undefined;
  const directory = searchParams.get('directory');
  const contactsMode = directory === 'contacts';
  const labelsMode = directory === 'labels';
  const directoryMode = contactsMode || labelsMode;
  const explicitChats = directory === 'chats';
  const [searchDraft, setSearchDraft] = useState(search);
  const capabilities = useInstanceCapabilities(instanceId, selectedInstance?.token);
  const chatsAdvertised = hasCapability(capabilities.data, 'chats_projection');
  const contactsAdvertised = hasCapability(capabilities.data, 'contacts_projection');
  const labelsAdvertised = hasCapability(capabilities.data, 'labels_projection');
  const chatsQuery = useInstanceChats(instanceId, selectedInstance?.token, chatsAdvertised && !directoryMode);
  const resetChats = useResetInstanceChats(instanceId);
  const pages = chatsQuery.data?.pages ?? [];
  const chats = useMemo(() => pages.flatMap((page) => page.resource.items), [pages]);
  const chatsReadState = useResilientReadState(chatsQuery, pages.length > 0);
  const contactsQuery = useInstanceContacts(instanceId, selectedInstance?.token, { search, cursor, limit: 50 }, contactsAdvertised && (contactsMode || (!explicitChats && !labelsMode && !chatsAdvertised && chats.length === 0)));
  const contactsReadState = useResilientReadState(contactsQuery, contactsQuery.data?.resource !== undefined);
  const labelsQuery = useInstanceLabels(instanceId, selectedInstance?.token, labelsAdvertised && labelsMode);
  const labelsReadState = useResilientReadState(labelsQuery, labelsQuery.data?.resource !== undefined);
  const labels = labelsQuery.data?.resource ?? [];
  const contacts = contactsQuery.data?.resource.items ?? [];
  const contactErrorCode = contactsQuery.error instanceof ApiFailure ? contactsQuery.error.code : undefined;
  const contactState = projectionCollectionState({
    errorCode: contactErrorCode,
    hasInitialError: contactsReadState.isInitialError,
    hasResource: contactsQuery.data?.resource !== undefined,
    isInitialLoading: contactsReadState.isInitialLoading,
    itemCount: contacts.length,
    projectionStatus: contactsQuery.data?.meta?.syncStatus,
    readinessAdvertised: contactsAdvertised,
    unavailable: false,
  });
  const labelState = projectionCollectionState({
    errorCode: labelsQuery.error instanceof ApiFailure ? labelsQuery.error.code : undefined,
    hasInitialError: labelsReadState.isInitialError,
    hasResource: labelsQuery.data?.resource !== undefined,
    isInitialLoading: labelsReadState.isInitialLoading,
    itemCount: labels.length,
    projectionStatus: labelsQuery.data?.meta?.syncStatus,
    readinessAdvertised: labelsAdvertised,
    unavailable: false,
  });
  const chatErrorCode = chatsQuery.error instanceof ApiFailure ? chatsQuery.error.code : undefined;
  const chatState = projectionCollectionState({
    errorCode: chatErrorCode,
    hasInitialError: chatsReadState.isInitialError,
    hasResource: pages.length > 0,
    isInitialLoading: chatsReadState.isInitialLoading,
    itemCount: chats.length,
    projectionStatus: pages[0]?.meta?.syncStatus,
    readinessAdvertised: chatsAdvertised,
    unavailable: false,
  });
  const showingContacts = contactsMode || (!explicitChats && !labelsMode && !chatsAdvertised && chats.length === 0);
  const showingLabels = labelsMode;
  const selectedContact = contactsMode ? chatId : undefined;
  const selectedLabel = labelsMode ? chatId : undefined;
  const filteredLabels = useMemo(() => {
    const needle = search.toLocaleLowerCase();
    return labels.filter((label) => !needle
      || label.id.toLocaleLowerCase().includes(needle)
      || label.name?.toLocaleLowerCase().includes(needle));
  }, [labels, search]);

  const routeSearchParams = new URLSearchParams(searchParams);
  routeSearchParams.delete('message');
  const chooseInstance = (nextInstanceId: string) => {
    routeSearchParams.delete('pane');
    routeSearchParams.delete('cursor');
    const suffix = routeSearchParams.size > 0 ? `?${routeSearchParams.toString()}` : '';
    navigate(`/chats/${encodeURIComponent(nextInstanceId)}${suffix}`);
  };
  const chooseChat = (nextChatId: string) => {
    if (!instanceId) return;
    routeSearchParams.delete('pane');
    routeSearchParams.delete('directory');
    routeSearchParams.delete('cursor');
    const suffix = routeSearchParams.size > 0 ? `?${routeSearchParams.toString()}` : '';
    navigate(`/chats/${encodeURIComponent(instanceId)}/${encodeURIComponent(nextChatId)}${suffix}`);
  };
  const chooseContact = (contactId: string) => {
    if (!instanceId) return;
    const next = new URLSearchParams(searchParams);
    next.set('directory', 'contacts');
    next.set('pane', 'context');
    next.delete('message');
    navigate(`/chats/${encodeURIComponent(instanceId)}/${encodeURIComponent(contactId)}?${next.toString()}`);
  };
  const chooseLabel = (labelId: string) => {
    if (!instanceId) return;
    const next = new URLSearchParams(searchParams);
    next.set('directory', 'labels');
    next.set('pane', 'context');
    next.delete('message');
    next.delete('cursor');
    navigate(`/chats/${encodeURIComponent(instanceId)}/${encodeURIComponent(labelId)}?${next.toString()}`);
  };
  const chooseDirectory = (nextDirectory: 'chats' | 'contacts' | 'labels') => {
    if (!instanceId) return;
    const next = new URLSearchParams();
    next.set('directory', nextDirectory);
    const suffix = next.size > 0 ? `?${next.toString()}` : '';
    navigate(`/chats/${encodeURIComponent(instanceId)}${suffix}`);
  };
  const setSearch = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set('search', value); else next.delete('search');
    next.delete('cursor');
    setSearchParams(next, { replace: true });
  };

  useEffect(() => setSearchDraft(search), [search]);
  const retryContacts = () => {
    if (cursorRecoveryAction(contactErrorCode, cursor) === 'reset') {
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        next.delete('cursor');
        return next;
      });
    } else {
      void contactsQuery.refetch();
    }
  };
  const retryChats = () => {
    const attemptedCursor = pages.at(-1)?.meta?.nextCursor;
    if (cursorRecoveryAction(chatErrorCode, attemptedCursor) === 'reset') void resetChats();
    else void chatsQuery.refetch();
  };
  let listContent: React.ReactNode;
  if (!instanceId) {
    listContent = pickerReadState.isInitialError ? (
      <InlineError error={pickerReadState.error} onRetry={() => { void picker.refetch(); }} className="chat-list-error" />
    ) : (
      <div className="chat-calm-state"><span className="eyebrow">Instance required</span><h2>Select an instance</h2><p>Choose an instance to review its projected conversations.</p></div>
    );
  } else if (showingContacts && contactState === 'error') {
    listContent = <InlineError error={contactsReadState.error} onRetry={retryContacts} className="chat-list-error" />;
  } else if (showingContacts && contactState === 'loading') {
    listContent = <div className="chat-calm-state" aria-live="polite"><span className="eyebrow">Contact directory</span><h2>Loading contacts.</h2><p>The persisted contact projection is being read.</p></div>;
  } else if (showingContacts && (contactState === 'not_ready' || contactState === 'syncing' || contactState === 'unavailable')) {
    listContent = <div className="chat-calm-state"><span className="eyebrow">Contact directory</span><h2>Contacts are not ready yet.</h2><p>No live WhatsApp lookup will be used as a fallback.</p></div>;
  } else if (showingContacts && contactState === 'empty') {
    listContent = <div className="chat-calm-state"><span className="eyebrow">0 contacts</span><h2>{search ? 'No contacts match this prefix.' : 'The ready directory is empty.'}</h2><p>{search ? 'Adjust or clear the search.' : 'Contacts appear after normalized events are projected.'}</p></div>;
  } else if (showingContacts) {
    listContent = contacts.map((contact) => (
      <button className={`convo${contact.id === selectedContact ? ' selected' : ''}`} key={contact.id} type="button" aria-current={contact.id === selectedContact ? 'page' : undefined} onClick={() => chooseContact(contact.id)}>
        <span className="avatar" aria-hidden="true">{initials(contact.displayName)}</span>
        <span className="meta"><span className="name">{contact.displayName ?? contact.id}</span><span className="sub"><span className="chat-row-summary">{contact.redactedPhone ?? contact.username ?? 'Normalized contact'}</span></span></span>
        <span className="right"><span className="when">{contact.found ? 'known' : 'unverified'}</span></span>
      </button>
    ));
  } else if (showingLabels && labelState === 'error') {
    listContent = <InlineError error={labelsReadState.error} onRetry={() => { void labelsQuery.refetch(); }} className="chat-list-error" />;
  } else if (showingLabels && labelState === 'loading') {
    listContent = <div className="chat-calm-state" aria-live="polite"><span className="eyebrow">Label directory</span><h2>Loading labels.</h2><p>The persisted label projection is being read.</p></div>;
  } else if (showingLabels && (labelState === 'not_ready' || labelState === 'syncing' || labelState === 'unavailable')) {
    listContent = <div className="chat-calm-state"><span className="eyebrow">Label directory</span><h2>Labels are not ready yet.</h2><p>No live WhatsApp lookup will be used as a fallback.</p></div>;
  } else if (showingLabels && (labelState === 'empty' || (labelState === 'ready' && filteredLabels.length === 0))) {
    listContent = <div className="chat-calm-state"><span className="eyebrow">0 labels</span><h2>{search ? 'No labels match this filter.' : 'The ready label directory is empty.'}</h2><p>{search ? 'Adjust or clear the filter.' : 'Labels appear after app-state events are projected.'}</p></div>;
  } else if (showingLabels) {
    listContent = filteredLabels.map((label) => (
      <button className={`convo${label.id === selectedLabel ? ' selected' : ''}`} key={label.id} type="button" aria-current={label.id === selectedLabel ? 'page' : undefined} onClick={() => chooseLabel(label.id)}>
        <span className="avatar" aria-hidden="true">{initials(label.name)}</span>
        <span className="meta"><span className="name">{label.name ?? label.id}</span><span className="sub"><span className="chat-row-summary">{label.predefinedId ? `Predefined ${label.predefinedId}` : 'Custom label'}</span></span></span>
        <span className="right"><span className="when">{label.color ? `color ${label.color}` : '—'}</span></span>
      </button>
    ));
  } else if (chatState === 'error') {
    listContent = <InlineError error={chatsReadState.error} onRetry={retryChats} className="chat-list-error" />;
  } else if (chatState === 'loading') {
    listContent = <div className="chat-calm-state" aria-live="polite"><span className="eyebrow">Loading</span><h2>Loading conversations.</h2><p>The first conversation read is in progress.</p></div>;
  } else if (chatState === 'not_ready' || chatState === 'syncing' || chatState === 'unavailable') {
    listContent = <div className="chat-calm-state"><span className="eyebrow">Chat projection</span><h2>Chats are not ready yet.</h2><p>No live WhatsApp lookup will be used as a fallback.</p></div>;
  } else if (chatState === 'empty') {
    listContent = (
      <div className="chat-calm-state"><span className="eyebrow">0 chats</span><h2>No conversations yet.</h2><p>New projected conversations will appear here.</p></div>
    );
  } else {
    listContent = chats.map((chat) => {
      return (
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
            <span className="chat-row-summary">{chat.type}</span>
          </span>
        </span>
        <span className="right">
          <span className="when">{relativeTime(chat.lastMessageAt) || '—'}</span>
          {(chat.unreadCount ?? 0) > 0 && <span className="unread" aria-label={`${chat.unreadCount} unread ${chat.unreadCount === 1 ? 'message' : 'messages'}`}>{chat.unreadCount}</span>}
        </span>
      </button>
      );
    });
  }

  return (
    <aside className="convos" id="chat-conversations" aria-label={showingContacts ? 'Contact directory' : showingLabels ? 'Label directory' : 'Conversations'}>
      <header className="head">
        <div className="chat-inbox-title-row"><h1>{showingContacts ? 'Contacts' : showingLabels ? 'Labels' : 'Chats'}</h1><div className="flex items-center gap-2"><PickerPopover label="Directory" trigger={(open) => <button className="btn sm" type="button" disabled={!instanceId} aria-haspopup="menu" aria-expanded={open}>{showingContacts ? 'Contacts' : showingLabels ? 'Labels' : 'Chats'}</button>}>{(close) => (['chats', 'contacts', 'labels'] as const).map((item) => <button key={item} type="button" role="menuitem" disabled={(item === 'chats' && !showingContacts && !showingLabels) || (item === 'contacts' && showingContacts) || (item === 'labels' && showingLabels)} onClick={() => { chooseDirectory(item); close(); }}>{item[0]?.toLocaleUpperCase()}{item.slice(1)}</button>)}</PickerPopover><RealtimeIndicator /></div></div>
        <InstancePicker instances={instances} selected={selectedInstance} onSelect={chooseInstance} />
        {(showingContacts || showingLabels) && <form onSubmit={(event) => { event.preventDefault(); setSearch(searchDraft.trim()); }}>
          <label className="chat-search-label" htmlFor="chat-search">Search {showingContacts ? 'contacts' : showingLabels ? 'labels' : 'chats'}</label>
          <div className="flex gap-2"><input className="search !min-h-11 min-w-0 flex-1" id="chat-search" type="search" value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} placeholder={showingContacts ? 'Name, JID, username, or phone prefix…' : showingLabels ? 'Label name or ID…' : 'Search loaded chats…'} disabled={!instanceId} /><button className="btn sm" type="submit" disabled={!instanceId || searchDraft.trim() === search}>Search</button></div>
        </form>}
      </header>
      {pickerReadState.isStaleError && <InlineError error={pickerReadState.error} onRetry={() => { void picker.refetch(); }} className="chat-list-error" />}
      {showingContacts && <ProjectionNotice meta={contactsQuery.data?.meta} className="chat-list-error" />}
      {showingLabels && <ProjectionNotice meta={labelsQuery.data?.meta} className="chat-list-error" />}
      {!showingContacts && !showingLabels && <ProjectionNotice meta={pages[0]?.meta} className="chat-list-error" />}
      <nav className="list" aria-label={showingContacts ? 'Contact results' : showingLabels ? 'Label results' : 'Chat results'}>
        {showingContacts && contactsReadState.isStaleError && <InlineError error={contactsReadState.error} onRetry={retryContacts} className="chat-list-error" />}
        {showingLabels && labelsReadState.isStaleError && <InlineError error={labelsReadState.error} onRetry={() => { void labelsQuery.refetch(); }} className="chat-list-error" />}
        {!showingContacts && !showingLabels && chatsReadState.isStaleError && <InlineError error={chatsReadState.error} onRetry={retryChats} className="chat-list-error" />}
        {listContent}
      </nav>
      <footer className="table-foot">
        <span className="num">{showingContacts ? `${contacts.length} loaded contacts` : showingLabels ? `${filteredLabels.length} of ${labels.length} labels` : `${chats.length} loaded chats`}</span>
        {showingContacts ? <span className="pagination"><button className="btn sm" type="button" disabled={!cursor || contactsQuery.isFetching} onClick={() => setSearchParams((current) => { const next = new URLSearchParams(current); next.delete('cursor'); return next; })}>First page</button><button className="btn sm" type="button" disabled={!contactsQuery.data?.resource.pagination.nextCursor || contactsQuery.isFetching} onClick={() => setSearchParams((current) => { const next = new URLSearchParams(current); next.set('cursor', contactsQuery.data?.resource.pagination.nextCursor ?? ''); return next; })}>Next page</button></span> : !showingLabels && chatsQuery.hasNextPage && <button className="btn sm" type="button" disabled={chatsQuery.isFetchingNextPage} onClick={() => { void chatsQuery.fetchNextPage(); }}>{chatsQuery.isFetchingNextPage ? 'Loading…' : 'More'}</button>}
      </footer>
    </aside>
  );
}
