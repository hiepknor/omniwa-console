import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useApiSession } from '@/api/ApiProvider';
import { useServerCapabilities } from '@/api/CapabilitiesProvider';
import type { ChatResource } from '@/api/chats';
import type { ContactResource } from '@/api/contacts';
import type { LabelResource } from '@/api/labels';
import type { MessageResource } from '@/api/messages';
import { Button, Field, PageHeader, StateNotice, Status, Surface, Tabs } from '@/components/v2';
import { humanizeToken, relativeTime } from '@/lib/format';
import { ComposerV2 } from './ComposerV2';
import { DirectoryInspectorV2, MessageInspectorV2 } from './DetailsV2';
import { useChatV2, useChatsV2, useContactV2, useContactsV2, useLabelV2, useLabelsV2, useMessagesV2 } from './hooks';
import { conversationRouteState, setConversationParam, type ConversationViewV2 } from './route-state';
import { FailureNoticeV2, ProjectionStatusV2 } from './ui';

export function ConversationsPageV2() {
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
  const chats = useChatsV2(route.cursor, route.view === 'chats' && chatsReady);
  const chat = useChatV2(activeChatId, chatsReady);
  const messages = useMessagesV2(activeChatId, route.messageCursor, messagesReady);
  const contacts = useContactsV2(route.search, route.cursor, route.view === 'contacts' && contactsReady);
  const labels = useLabelsV2(route.view === 'labels' && labelsReady);
  const contact = useContactV2(route.view === 'contacts' ? route.selected : undefined, contactsReady);
  const label = useLabelV2(route.view === 'labels' ? route.selected : undefined, labelsReady);
  const loadedChats = chats.data?.resource.items ?? [];
  const filteredChats = useMemo(() => { const term = route.search.trim().toLocaleLowerCase(); return loadedChats.filter((item) => !term || item.id.toLocaleLowerCase().includes(term) || item.displayName?.toLocaleLowerCase().includes(term)); }, [loadedChats, route.search]);
  const loadedLabels = labels.data?.resource ?? [];
  const filteredLabels = useMemo(() => { const term = route.search.trim().toLocaleLowerCase(); return loadedLabels.filter((item) => !term || item.id.toLocaleLowerCase().includes(term) || item.name?.toLocaleLowerCase().includes(term)); }, [loadedLabels, route.search]);
  const loadedMessages = useMemo(() => [...(messages.data?.resource.items ?? [])].sort((a, b) => a.createdAt.localeCompare(b.createdAt)), [messages.data]);
  const selectedChat = chat.data?.resource;

  const replaceParams = (next: URLSearchParams) => setSearchParams(next, { replace: true });
  const switchView = (view: ConversationViewV2) => {
    const next = new URLSearchParams(); if (view !== 'chats') next.set('view', view);
    navigate(`/chats${next.size ? `?${next}` : ''}`);
  };
  const openChat = (id: string) => {
    const next = new URLSearchParams(searchParams); next.delete('message'); next.delete('messageCursor'); next.delete('selected');
    navigate(`/chats/${encodeURIComponent(id)}${next.size ? `?${next}` : ''}`);
  };
  const closeChat = () => { const next = new URLSearchParams(searchParams); next.delete('message'); next.delete('messageCursor'); navigate(`/chats${next.size ? `?${next}` : ''}`); };
  const applySearch = () => { const next = setConversationParam(searchParams, 'search', searchDraft.trim()); next.delete('cursor'); next.delete('selected'); replaceParams(next); };
  const currentQuery = route.view === 'chats' ? chats : route.view === 'contacts' ? contacts : labels;
  const currentMeta = currentQuery.data?.meta;
  const currentAuthoritative = currentMeta?.syncStatus === undefined || currentMeta.syncStatus === 'ready';
  const routeRefreshing = currentQuery.isFetching || (Boolean(activeChatId) && (chat.isFetching || messages.isFetching));
  const refresh = () => {
    void currentQuery.refetch();
    if (activeChatId) { void chat.refetch(); if (messagesReady) void messages.refetch(); }
  };

  if (!instanceScope) return <BlockedPage detail="Conversations requires an instance credential. Admin scope cannot read token-scoped projections, and no request was sent." state="invalid" />;
  if (capabilities.isPending) return <BlockedPage detail="Discovering instance capabilities before enabling projection reads." state="discovering" />;
  if (capabilities.isError) return <BlockedPage detail="Capability discovery failed. Conversation projections remain disabled; no fallback read was sent." state="unsupported" />;

  const viewSupported = route.view === 'chats' ? chatsReady : route.view === 'contacts' ? contactsReady : labelsReady;
  return <div className="ui-v2-page">
    <PageHeader eyebrow="Messaging" title="Conversations" description="Projection-backed chats, messages, contacts, labels, and bounded sends in the active instance scope." actions={<Button disabled={!viewSupported || routeRefreshing} onClick={refresh}>{routeRefreshing ? 'Refreshing…' : 'Refresh'}</Button>} />
    <div className="ui-v2-page__content">
      <div className="ui-v2-conversation-workspace" data-has-chat={Boolean(activeChatId) || undefined}>
        <Surface title="Directory" description="Selection, search, and opaque cursor remain URL-backed." className="ui-v2-conversation-directory">
          <Tabs label="Conversation resources" selectedId={route.view} items={[{ id: 'chats', label: 'Chats' }, { id: 'contacts', label: 'Contacts' }, { id: 'labels', label: 'Labels' }]} onSelect={(id) => switchView(id as ConversationViewV2)} />
          <form className="ui-v2-conversation-search" onSubmit={(event) => { event.preventDefault(); applySearch(); }}><Field label="Search" type="search" value={searchDraft} placeholder={route.view === 'contacts' ? 'Server prefix search' : 'Filter loaded page'} onChange={(event) => setSearchDraft(event.target.value)} /><Button type="submit" disabled={searchDraft === route.search}>Apply</Button></form>
          {!viewSupported ? <StateNotice value={{ axis: 'capability', state: 'unsupported' }} detail={`The backend does not advertise ${route.view === 'chats' ? 'chats_projection' : route.view === 'contacts' ? 'contacts_projection' : 'labels_projection'}. No live WhatsApp fallback is used.`} /> : null}
          {viewSupported && currentQuery.isPending ? <StateNotice value={{ axis: 'resource', state: 'initial-loading' }} /> : null}
          {viewSupported && currentQuery.error && !currentQuery.data ? <FailureNoticeV2 error={currentQuery.error} onRetry={() => refresh()} /> : null}
          {viewSupported && currentQuery.data ? <>{currentQuery.error ? <FailureNoticeV2 error={currentQuery.error} stale onRetry={refresh} /> : null}<ProjectionStatusV2 meta={'meta' in currentQuery.data ? currentQuery.data.meta : undefined} />{route.view === 'chats' ? <ChatList items={filteredChats} selectedId={activeChatId} onSelect={openChat} /> : route.view === 'contacts' ? <ContactList items={contacts.data?.resource.items ?? []} selectedId={route.selected} onSelect={(id) => replaceParams(setConversationParam(searchParams, 'selected', id))} /> : <LabelList items={filteredLabels} selectedId={route.selected} onSelect={(id) => replaceParams(setConversationParam(searchParams, 'selected', id))} />}</> : null}
          {viewSupported && currentQuery.data && currentAuthoritative && ((route.view === 'chats' && filteredChats.length === 0) || (route.view === 'contacts' && (contacts.data?.resource.items.length ?? 0) === 0) || (route.view === 'labels' && filteredLabels.length === 0)) ? <StateNotice value={{ axis: 'resource', state: 'empty' }} detail={route.search ? 'No projected item matches the URL-backed search.' : 'The ready projection contains no items.'} /> : null}
          {route.view !== 'labels' && viewSupported && currentQuery.data ? <Pagination cursor={route.cursor} nextCursor={route.view === 'chats' ? chats.data?.resource.pagination.nextCursor : contacts.data?.resource.pagination.nextCursor} onCursor={(value) => { const next = setConversationParam(searchParams, 'cursor', value); next.delete('selected'); replaceParams(next); }} /> : null}
        </Surface>

        <Surface title={selectedChat?.displayName ?? selectedChat?.id ?? 'Message timeline'} description={activeChatId ? 'Persisted projection history; newest page is selected by an opaque URL cursor.' : 'Select a projected chat to inspect its history.'} actions={activeChatId ? <Button className="ui-v2-conversation-back" onClick={closeChat}>Back to list</Button> : undefined} className="ui-v2-conversation-thread">
          {!activeChatId ? <StateNotice value={{ axis: 'resource', state: 'empty' }} detail="Select a chat from the projected directory." /> : !chatsReady ? <StateNotice value={{ axis: 'capability', state: 'unsupported' }} /> : chat.isPending ? <StateNotice value={{ axis: 'resource', state: 'initial-loading' }} detail="Reading projected chat details." /> : chat.error && !selectedChat ? <FailureNoticeV2 error={chat.error} onRetry={() => chat.refetch()} /> : selectedChat ? <><ProjectionStatusV2 meta={chat.data?.meta} />{chat.error ? <FailureNoticeV2 error={chat.error} stale onRetry={() => chat.refetch()} /> : null}<div className="ui-v2-chat-facts"><Status tone={selectedChat.unreadCount ? 'pending' : 'neutral'}>{selectedChat.unreadCount} unread</Status><span>{humanizeToken(selectedChat.type)}</span><span className="ui-v2-mono">{selectedChat.id}</span></div>{!messagesReady ? <StateNotice value={{ axis: 'capability', state: 'unsupported' }} detail="The backend does not advertise messages_projection. No live history fallback is used." /> : messages.isPending ? <StateNotice value={{ axis: 'resource', state: 'initial-loading' }} detail="Reading projected messages." /> : messages.error && !messages.data ? <FailureNoticeV2 error={messages.error} onRetry={() => messages.refetch()} /> : messages.data ? <><ProjectionStatusV2 meta={messages.data.meta} />{messages.error ? <FailureNoticeV2 error={messages.error} stale onRetry={() => messages.refetch()} /> : null}<MessageTimelineV2 items={loadedMessages} selectedId={route.message} onSelect={(id) => replaceParams(setConversationParam(searchParams, 'message', id))} />{loadedMessages.length === 0 && (messages.data.meta?.syncStatus === undefined || messages.data.meta.syncStatus === 'ready') ? <StateNotice value={{ axis: 'resource', state: 'empty' }} detail="The ready message projection contains no messages." /> : null}<Pagination cursor={route.messageCursor} nextCursor={messages.data.resource.pagination.nextCursor} onCursor={(value) => { const next = setConversationParam(searchParams, 'messageCursor', value); next.delete('message'); replaceParams(next); }} /></> : null}<ComposerV2 chatId={selectedChat.id} chatName={selectedChat.displayName ?? selectedChat.id} enabled={messagesReady && outboundReady} /></> : <StateNotice value={{ axis: 'resource', state: 'empty' }} detail="The projected chat detail was not returned." />}
        </Surface>
      </div>
    </div>
    {route.message && activeChatId && messagesReady ? <MessageInspectorV2 messageId={route.message} loadedChat={selectedChat} enabled onClose={() => replaceParams(setConversationParam(searchParams, 'message'))} /> : null}
    {route.selected && route.view !== 'chats' && viewSupported ? <DirectoryInspectorV2 contact={contact.data?.resource} label={label.data?.resource} error={route.view === 'contacts' ? contact.error : label.error} loading={route.view === 'contacts' ? contact.isPending : label.isPending} onRetry={() => route.view === 'contacts' ? contact.refetch() : label.refetch()} onClose={() => replaceParams(setConversationParam(searchParams, 'selected'))} /> : null}
  </div>;
}

function BlockedPage({ detail, state }: { detail: string; state: 'invalid' | 'discovering' | 'unsupported' }) { return <div className="ui-v2-page"><PageHeader eyebrow="Messaging" title="Conversations" description="Projection-backed chats, messages, contacts, labels, and bounded sends." /><div className="ui-v2-page__content"><StateNotice value={state === 'invalid' ? { axis: 'session', state } : { axis: 'capability', state }} detail={detail} /></div></div>; }
function ChatList({ items, selectedId, onSelect }: { items: ChatResource[]; selectedId?: string; onSelect: (id: string) => void }) { return <ul className="ui-v2-resource-list">{items.map((item) => <li key={item.id} data-selected={item.id === selectedId || undefined}><button type="button" onClick={() => onSelect(item.id)}><span><strong>{item.displayName ?? item.id}</strong><small>{humanizeToken(item.type)} · {item.lastActivityAt ? relativeTime(item.lastActivityAt) : 'activity unreported'}</small></span><Status tone={item.unreadCount ? 'pending' : 'neutral'}>{item.unreadCount} unread</Status></button></li>)}</ul>; }
function ContactList({ items, selectedId, onSelect }: { items: ContactResource[]; selectedId?: string; onSelect: (id: string) => void }) { return <ul className="ui-v2-resource-list">{items.map((item) => <li key={item.id} data-selected={item.id === selectedId || undefined}><button type="button" onClick={() => onSelect(item.id)}><span><strong>{item.displayName ?? item.id}</strong><small className="ui-v2-mono">{item.id}</small></span><Status tone={item.found ? 'healthy' : 'neutral'}>{item.found ? 'Known' : 'Unknown'}</Status></button></li>)}</ul>; }
function LabelList({ items, selectedId, onSelect }: { items: LabelResource[]; selectedId?: string; onSelect: (id: string) => void }) { return <ul className="ui-v2-resource-list">{items.map((item) => <li key={item.id} data-selected={item.id === selectedId || undefined}><button type="button" onClick={() => onSelect(item.id)}><span><strong>{item.name ?? 'Unnamed label'}</strong><small className="ui-v2-mono">{item.id}</small></span><span>{item.color ?? 'Color unreported'}</span></button></li>)}</ul>; }
function MessageTimelineV2({ items, selectedId, onSelect }: { items: MessageResource[]; selectedId?: string; onSelect: (id: string) => void }) { return <ol className="ui-v2-message-list" aria-label="Projected message history">{items.map((item) => <li key={item.id} data-direction={item.direction} data-selected={item.id === selectedId || undefined}><button type="button" onClick={() => onSelect(item.id)}><span>{item.contentText ?? item.caption ?? item.contentSummary ?? `[${humanizeToken(item.type)}]`}</span><small><span>{item.status ? humanizeToken(item.status) : 'Status unreported'}</span><time title={item.createdAt}>{relativeTime(item.createdAt) || item.createdAt}</time></small></button></li>)}</ol>; }
function Pagination({ cursor, nextCursor, onCursor }: { cursor?: string; nextCursor?: string | null; onCursor: (cursor?: string) => void }) { return <div className="ui-v2-pagination"><span>{cursor ? 'Opaque cursor page' : 'First page'}</span><div>{cursor ? <Button onClick={() => onCursor()}>Start over</Button> : null}<Button disabled={!nextCursor} onClick={() => onCursor(nextCursor ?? undefined)}>Next page</Button></div></div>; }
