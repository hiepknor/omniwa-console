import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useApiSession } from '@/api/ApiProvider';
import { useServerCapabilities } from '@/api/CapabilitiesProvider';
import { humanizeToken } from '@/lib/format';
import { createSearchParams, omitSearchParams, updateSearchParams, withSearchParams } from '@/lib/url-search-state';
import { useInvalidCursorReset } from '@/lib/useInvalidCursorReset';
import { Button, CursorPagination, Field, FilterToolbar, Input, PageHeader, StateNotice, Status, Tabs } from '@/ui';
import { cn } from '@/ui/cn';
import { Composer } from './Composer';
import { ChatList, ContactList, LabelList, MessageTimeline } from './ConversationsView';
import { DirectoryInspector, MessageInspector } from './Details';
import { useChat, useChats, useContact, useContacts, useLabel, useLabels, useMessages } from './hooks';
import { conversationRouteState, setConversationParam, type ConversationView } from './route-state';
import { FailureNotice, ProjectionStatus } from './ui';

function BlockedPage({ detail, title }: { detail: string; title: string }) {
  return (
    <div className="grid gap-6 p-6 max-sm:p-4">
      <PageHeader eyebrow="Messaging" title="Conversations" description="Projection-backed chats, messages, contacts, labels, and bounded sends." />
      <StateNotice kind="empty" title={title} detail={detail} />
    </div>
  );
}

export function ConversationsPage() {
  const session = useApiSession();
  const capabilities = useServerCapabilities();
  const { chatId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const route = conversationRouteState(searchParams);
  const activeChatId = route.view === 'chats' ? chatId : undefined;
  const [searchDraft, setSearchDraft] = useState(route.search);
  useEffect(() => setSearchDraft(route.search), [route.search]);
  const instanceScope = session.keyKind === 'api';
  const cap = (name: string) => capabilities.data?.capabilities.includes(name) ?? false;
  const chatsReady = instanceScope && cap('chats_projection');
  const messagesReady = instanceScope && cap('messages_projection');
  const contactsReady = instanceScope && cap('contacts_projection');
  const labelsReady = instanceScope && cap('labels_projection');
  const outboundReady = cap('outbound_rate_limit');
  const chats = useChats(route.cursor, route.view === 'chats' && chatsReady);
  const chat = useChat(activeChatId, chatsReady);
  const messages = useMessages(activeChatId, route.messageCursor, messagesReady);
  const contacts = useContacts(route.search, route.cursor, route.view === 'contacts' && contactsReady);
  const labels = useLabels(route.view === 'labels' && labelsReady);
  const contact = useContact(route.view === 'contacts' ? route.selected : undefined, contactsReady);
  const label = useLabel(route.view === 'labels' ? route.selected : undefined, labelsReady);
  const loadedChats = chats.data?.resource.items ?? [];
  const filteredChats = useMemo(() => { const term = route.search.trim().toLocaleLowerCase(); return loadedChats.filter((i) => !term || i.id.toLocaleLowerCase().includes(term) || i.displayName?.toLocaleLowerCase().includes(term)); }, [loadedChats, route.search]);
  const loadedLabels = labels.data?.resource ?? [];
  const filteredLabels = useMemo(() => { const term = route.search.trim().toLocaleLowerCase(); return loadedLabels.filter((i) => !term || i.id.toLocaleLowerCase().includes(term) || i.name?.toLocaleLowerCase().includes(term)); }, [loadedLabels, route.search]);
  const loadedMessages = useMemo(() => [...(messages.data?.resource.items ?? [])].sort((a, b) => a.createdAt.localeCompare(b.createdAt)), [messages.data]);
  const selectedChat = chat.data?.resource;
  const chatsSupported = chatsReady || chats.data !== undefined || chat.data !== undefined;
  const messagesSupported = messagesReady || messages.data !== undefined;

  const replaceParams = (next: URLSearchParams) => setSearchParams(next, { replace: true });
  const switchView = (view: ConversationView) => navigate(withSearchParams('/chats', createSearchParams({ view: view === 'chats' ? undefined : view })));
  const openChat = (id: string) => navigate(withSearchParams(`/chats/${encodeURIComponent(id)}`, omitSearchParams(searchParams, ['message', 'messageCursor', 'selected'])));
  const closeChat = () => navigate(withSearchParams('/chats', omitSearchParams(searchParams, ['message', 'messageCursor'])));
  const applySearch = () => replaceParams(updateSearchParams(searchParams, { search: searchDraft.trim() }, ['cursor', 'selected']));
  const currentQuery = route.view === 'chats' ? chats : route.view === 'contacts' ? contacts : labels;
  const currentMeta = currentQuery.data?.meta;
  const currentAuthoritative = currentMeta?.syncStatus === undefined || currentMeta.syncStatus === 'ready';
  const routeRefreshing = currentQuery.isFetching || (Boolean(activeChatId) && (chat.isFetching || messages.isFetching));
  const refresh = () => { void currentQuery.refetch(); if (activeChatId) { void chat.refetch(); if (messagesReady) void messages.refetch(); } };
  useInvalidCursorReset(currentQuery.error, route.cursor, () => replaceParams(updateSearchParams(searchParams, { cursor: undefined }, ['selected'])));
  useInvalidCursorReset(messages.error, route.messageCursor, () => replaceParams(updateSearchParams(searchParams, { messageCursor: undefined }, ['message'])));

  if (!instanceScope) return <BlockedPage title="Instance credential required" detail="Conversations requires an instance credential. Admin scope cannot read token-scoped projections, and no request was sent." />;
  if (capabilities.isPending) return <BlockedPage title="Discovering capabilities" detail="Discovering instance capabilities before enabling projection reads." />;
  if (capabilities.isError && currentQuery.data === undefined) return <BlockedPage title="Unsupported" detail="Capability discovery failed. Conversation projections remain disabled; no fallback read was sent." />;

  const advertised = route.view === 'chats' ? chatsReady : route.view === 'contacts' ? contactsReady : labelsReady;
  const viewSupported = advertised || currentQuery.data !== undefined;
  const hasChat = Boolean(activeChatId);
  const emptyDirectory = viewSupported && currentQuery.data && currentAuthoritative && ((route.view === 'chats' && filteredChats.length === 0) || (route.view === 'contacts' && (contacts.data?.resource.items.length ?? 0) === 0) || (route.view === 'labels' && filteredLabels.length === 0));

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-6 max-sm:px-4">
        <PageHeader
          eyebrow="Messaging"
          title="Conversations"
          description="Projection-backed chats, messages, contacts, labels, and bounded sends in the active instance scope."
          actions={<Button disabled={!viewSupported || routeRefreshing} onClick={refresh}>{routeRefreshing ? 'Refreshing…' : 'Refresh'}</Button>}
        />
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-[320px_minmax(0,1fr)] border-t border-line max-[900px]:grid-cols-1">
        {/* Directory pane */}
        <section className={cn('flex flex-col min-h-0 border-r border-line', hasChat && 'max-[900px]:hidden')}>
          <div className="shrink-0 border-b border-line">
            <Tabs
              active={route.view}
              onChange={(id) => switchView(id as ConversationView)}
              tabs={[{ id: 'chats', label: 'Chats' }, { id: 'contacts', label: 'Contacts' }, { id: 'labels', label: 'Labels' }]}
            />
            <FilterToolbar as="form" className="border-b-0" onSubmit={(e) => { e.preventDefault(); applySearch(); }}>
              <Field label="Search" className="min-w-48 flex-1">
                {(id) => <Input id={id} type="search" value={searchDraft} placeholder={route.view === 'contacts' ? 'Server prefix search' : 'Filter loaded page'} onChange={(e) => setSearchDraft(e.target.value)} />}
              </Field>
              <div className="flex items-end"><Button type="submit" disabled={searchDraft === route.search}>Apply</Button></div>
            </FilterToolbar>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto">
            {!viewSupported ? <div className="p-3"><StateNotice kind="empty" title="Projection unavailable" detail={`The backend does not currently advertise ${route.view === 'chats' ? 'chats_projection' : route.view === 'contacts' ? 'contacts_projection' : 'labels_projection'}; capability polling continues because the projection may be unsupported or waiting for readiness.`} /></div> : null}
            {viewSupported && !advertised ? <div className="p-3"><StateNotice kind="empty" title="Capability changed" detail="Keeping the last usable projection snapshot visible while capability discovery no longer advertises this resource." /></div> : null}
            {viewSupported && currentQuery.isPending ? <div className="p-3"><StateNotice kind="loading" title="Loading" /></div> : null}
            {viewSupported && currentQuery.error && !currentQuery.data ? <div className="p-3"><FailureNotice error={currentQuery.error} onRetry={refresh} /></div> : null}
            {viewSupported && currentQuery.data ? (
              <>
                {currentQuery.error ? <div className="p-3"><FailureNotice error={currentQuery.error} stale onRetry={refresh} /></div> : null}
                <div className="px-3"><ProjectionStatus meta={'meta' in currentQuery.data ? currentQuery.data.meta : undefined} /></div>
                {route.view === 'chats' ? <ChatList items={filteredChats} selectedId={activeChatId} onSelect={openChat} />
                  : route.view === 'contacts' ? <ContactList items={contacts.data?.resource.items ?? []} selectedId={route.selected} onSelect={(id) => replaceParams(setConversationParam(searchParams, 'selected', id))} />
                    : <LabelList items={filteredLabels} selectedId={route.selected} onSelect={(id) => replaceParams(setConversationParam(searchParams, 'selected', id))} />}
                {emptyDirectory ? <div className="p-3"><StateNotice kind="empty" title="Empty" detail={route.search ? 'No projected item matches the URL-backed search.' : 'The ready projection contains no items.'} /></div> : null}
              </>
            ) : null}
          </div>

          {route.view !== 'labels' && viewSupported && currentQuery.data ? (
            <div className="shrink-0">
              <CursorPagination cursor={route.cursor} nextCursor={(route.view === 'chats' ? chats.data?.resource.pagination.nextCursor : contacts.data?.resource.pagination.nextCursor) ?? undefined} onCursor={(v) => replaceParams(updateSearchParams(searchParams, { cursor: v }, ['selected']))} />
            </div>
          ) : null}
        </section>

        {/* Thread pane */}
        <section className={cn('flex flex-col min-h-0', !hasChat && 'max-[900px]:hidden')}>
          <header className="shrink-0 flex items-center justify-between gap-3 min-h-[57px] px-4 border-b border-line">
            <div className="grid min-w-0">
              <strong className="truncate text-sm font-semibold text-fg">{selectedChat?.displayName ?? selectedChat?.id ?? 'Message timeline'}</strong>
              <span className="text-xs text-fg-3">{activeChatId ? 'Persisted projection history' : 'Select a projected chat to inspect its history'}</span>
            </div>
            {activeChatId ? <Button className="hidden max-[900px]:inline-flex" onClick={closeChat}>Back</Button> : null}
          </header>

          <div className="flex-1 min-h-0 overflow-y-auto">
            {!activeChatId ? (
              <div className="p-4"><StateNotice kind="empty" title="No chat selected" detail="Select a chat from the projected directory." /></div>
            ) : !chatsSupported ? (
              <div className="p-4"><StateNotice kind="empty" title="Unsupported" /></div>
            ) : chat.isPending ? (
              <div className="p-4"><StateNotice kind="loading" title="Reading chat" /></div>
            ) : chat.error && !selectedChat ? (
              <div className="p-4"><FailureNotice error={chat.error} onRetry={() => chat.refetch()} /></div>
            ) : selectedChat ? (
              <>
                <div className="px-4"><ProjectionStatus meta={chat.data?.meta} /></div>
                <div className="flex flex-wrap items-center gap-3 px-4 py-2 border-b border-line text-xs text-fg-3">
                  <Status tone={selectedChat.unreadCount ? 'pending' : 'neutral'}>{selectedChat.unreadCount} unread</Status>
                  <span>{humanizeToken(selectedChat.type)}</span>
                  <span className="font-mono text-fg-2">{selectedChat.id}</span>
                </div>
                {!messagesSupported ? (
                  <div className="p-4"><StateNotice kind="empty" title="Unsupported" detail="The backend does not advertise messages_projection." /></div>
                ) : messages.isPending ? (
                  <div className="p-4"><StateNotice kind="loading" title="Reading messages" /></div>
                ) : messages.error && !messages.data ? (
                  <div className="p-4"><FailureNotice error={messages.error} onRetry={() => messages.refetch()} /></div>
                ) : messages.data ? (
                  <>
                    <MessageTimeline items={loadedMessages} selectedId={route.message} onSelect={(id) => replaceParams(setConversationParam(searchParams, 'message', id))} />
                    {loadedMessages.length === 0 && (messages.data.meta?.syncStatus === undefined || messages.data.meta.syncStatus === 'ready') ? <div className="p-4"><StateNotice kind="empty" title="No messages" detail="The ready message projection contains no messages." /></div> : null}
                    <CursorPagination cursor={route.messageCursor} nextCursor={messages.data.resource.pagination.nextCursor ?? undefined} onCursor={(v) => replaceParams(updateSearchParams(searchParams, { messageCursor: v }, ['message']))} />
                  </>
                ) : null}
              </>
            ) : (
              <div className="p-4"><StateNotice kind="empty" title="Not returned" detail="The projected chat detail was not returned." /></div>
            )}
          </div>

          {selectedChat ? <div className="shrink-0"><Composer chatId={selectedChat.id} chatName={selectedChat.displayName ?? selectedChat.id} enabled={messagesReady && outboundReady} /></div> : null}
        </section>
      </div>

      {route.message && activeChatId && messagesSupported ? <MessageInspector messageId={route.message} loadedChat={selectedChat} enabled={messagesReady} onClose={() => replaceParams(setConversationParam(searchParams, 'message'))} /> : null}
      {route.selected && route.view !== 'chats' && viewSupported ? <DirectoryInspector contact={contact.data?.resource} label={label.data?.resource} error={route.view === 'contacts' ? contact.error : label.error} loading={route.view === 'contacts' ? contact.isPending : label.isPending} onRetry={() => route.view === 'contacts' ? contact.refetch() : label.refetch()} onClose={() => replaceParams(setConversationParam(searchParams, 'selected'))} /> : null}
    </div>
  );
}
