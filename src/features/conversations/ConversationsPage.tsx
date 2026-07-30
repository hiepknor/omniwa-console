import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useApiSession } from '@/api/ApiProvider';
import { useServerCapabilities } from '@/api/CapabilitiesProvider';
import { humanizeToken } from '@/lib/format';
import { createSearchParams, omitSearchParams, updateSearchParams, withSearchParams } from '@/lib/url-search-state';
import { useInvalidCursorReset } from '@/lib/useInvalidCursorReset';
import { Button, CursorPagination, Field, FilterToolbar, Input, PageHeader, SplitWorkspace, StateNotice, Tabs, useWorkspacePageFocus, WorkspacePageFrame, WorkspacePaneHeader } from '@/ui';
import { Composer } from './Composer';
import { canonicalConversationReadsEnabled, canonicalConversationRedirect, resolveConversationRecipient } from './conversation-identity';
import { ContactList, ConversationList, ConversationUnreadCount, LabelList, MessageTimeline } from './ConversationsView';
import { ConversationDetailsDrawer, DirectoryInspector, MessageInspector } from './Details';
import { ConversationMessageImage } from './Media';
import { useContact, useContacts, useConversation, useConversations, useLabel, useLabels, useMessages } from './hooks';
import { conversationRouteState, setConversationParam, type ConversationView } from './route-state';
import { FailureNotice, ProjectionStatus } from './ui';

function BlockedPage({ detail, title }: { detail: string; title: string }) {
  return (
    <div className="grid gap-6 p-6 max-sm:p-4">
      <PageHeader eyebrow="Messaging" title="Conversations" description="Review projected conversations, contacts, labels, and message history." />
      <StateNotice kind="empty" title={title} detail={detail} />
    </div>
  );
}

export function ConversationsPage() {
  const session = useApiSession();
  const capabilities = useServerCapabilities();
  const { conversationRef } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const route = conversationRouteState(searchParams);
  const activeConversationRef = route.view === 'conversations' ? conversationRef : undefined;
  const hasConversation = Boolean(activeConversationRef);
  const { compactHeadingRef, rememberFocusOrigin } = useWorkspacePageFocus(activeConversationRef);
  const [searchDraft, setSearchDraft] = useState(route.search);
  useEffect(() => setSearchDraft(route.search), [route.search]);
  const instanceScope = session.keyKind === 'api';
  const cap = (name: string) => capabilities.data?.capabilities.includes(name) ?? false;
  const conversationsReady = canonicalConversationReadsEnabled(instanceScope, capabilities.data?.capabilities ?? []);
  const messagesReady = conversationsReady && cap('messages_projection');
  const contactsReady = instanceScope && cap('contacts_projection');
  const labelsReady = instanceScope && cap('labels_projection');
  const outboundReady = cap('outbound_rate_limit');
  const canonicalIdentity = cap('canonical_contact_identity');
  const conversationMedia = cap('conversation_media_assets');
  const conversations = useConversations(route.cursor, route.view === 'conversations' && conversationsReady);
  const conversation = useConversation(activeConversationRef, conversationsReady);
  const selectedConversation = conversation.data?.resource;
  const sendRecipient = resolveConversationRecipient(selectedConversation);
  const messages = useMessages(activeConversationRef, route.messageCursor, messagesReady);
  const contacts = useContacts(route.search, route.cursor, route.view === 'contacts' && contactsReady, canonicalIdentity);
  const labels = useLabels(route.view === 'labels' && labelsReady);
  const contact = useContact(route.view === 'contacts' ? route.selected : undefined, contactsReady, canonicalIdentity);
  const label = useLabel(route.view === 'labels' ? route.selected : undefined, labelsReady);
  const loadedConversations = conversations.data?.resource.items ?? [];
  const filteredConversations = useMemo(() => { const term = route.search.trim().toLocaleLowerCase(); return loadedConversations.filter((i) => !term || i.conversationId.toLocaleLowerCase().includes(term) || i.displayName?.toLocaleLowerCase().includes(term)); }, [loadedConversations, route.search]);
  const loadedLabels = labels.data?.resource ?? [];
  const filteredLabels = useMemo(() => { const term = route.search.trim().toLocaleLowerCase(); return loadedLabels.filter((i) => !term || i.id.toLocaleLowerCase().includes(term) || i.name?.toLocaleLowerCase().includes(term)); }, [loadedLabels, route.search]);
  const loadedMessages = useMemo(() => [...(messages.data?.resource.items ?? [])].sort((a, b) => a.createdAt.localeCompare(b.createdAt)), [messages.data]);
  const recipientUnavailableDetail = selectedConversation && !sendRecipient
    ? 'The canonical conversation has no addressing JID. Sending remains disabled until the backend publishes its authoritative provider command target.'
    : undefined;
  const conversationsSupported = conversationsReady || conversations.data !== undefined || conversation.data !== undefined;
  const messagesSupported = messagesReady || messages.data !== undefined;

  const replaceParams = (next: URLSearchParams) => setSearchParams(next, { replace: true });
  const switchView = (view: ConversationView) => navigate(withSearchParams('/conversations', createSearchParams({ view: view === 'conversations' ? undefined : view })));
  const openConversation = (id: string) => {
    rememberFocusOrigin();
    navigate(withSearchParams(`/conversations/${encodeURIComponent(id)}`, omitSearchParams(searchParams, ['message', 'messageCursor', 'selected', 'details'])));
  };
  const closeConversation = () => navigate(withSearchParams('/conversations', omitSearchParams(searchParams, ['message', 'messageCursor', 'details'])));
  const openConversationDetails = () => replaceParams(updateSearchParams(searchParams, { details: 'conversation', message: undefined }));
  const closeConversationDetails = () => replaceParams(updateSearchParams(searchParams, { details: undefined }));
  const openMessage = (id: string) => replaceParams(updateSearchParams(searchParams, { message: id, details: undefined }));
  const applySearch = () => replaceParams(updateSearchParams(searchParams, { search: searchDraft.trim() }, ['cursor', 'selected']));
  const currentQuery = route.view === 'conversations' ? conversations : route.view === 'contacts' ? contacts : labels;
  const currentMeta = currentQuery.data?.meta;
  const currentAuthoritative = currentMeta?.syncStatus === undefined || currentMeta.syncStatus === 'ready';
  const detailRefreshing = Boolean(activeConversationRef) && (conversation.isFetching || messages.isFetching);
  const routeRefreshing = currentQuery.isFetching || detailRefreshing;
  const refreshDirectory = () => { void currentQuery.refetch(); };
  const refreshDetail = () => { if (activeConversationRef) { void conversation.refetch(); if (messagesReady) void messages.refetch(); } };
  const refresh = () => { refreshDirectory(); refreshDetail(); };
  useInvalidCursorReset(currentQuery.error, route.cursor, () => replaceParams(updateSearchParams(searchParams, { cursor: undefined }, ['selected'])));
  useInvalidCursorReset(messages.error, route.messageCursor, () => replaceParams(updateSearchParams(searchParams, { messageCursor: undefined }, ['message'])));
  useEffect(() => {
    if (route.message && route.details) replaceParams(updateSearchParams(searchParams, { details: undefined }));
  }, [route.details, route.message]);
  useEffect(() => {
    const canonicalId = canonicalConversationRedirect(activeConversationRef, selectedConversation);
    if (canonicalId) navigate(withSearchParams(`/conversations/${encodeURIComponent(canonicalId)}`, searchParams), { replace: true });
  }, [activeConversationRef, navigate, searchParams, selectedConversation?.conversationId]);
  useEffect(() => {
    const returnedId = contact.data?.resource.id;
    if (canonicalIdentity && route.view === 'contacts' && route.selected && returnedId && returnedId !== route.selected) {
      setSearchParams(setConversationParam(searchParams, 'selected', returnedId), { replace: true });
    }
  }, [canonicalIdentity, contact.data?.resource.id, route.selected, route.view, searchParams, setSearchParams]);

  if (!instanceScope) return <BlockedPage title="Instance credential required" detail="Conversations requires an instance credential. Admin scope cannot read token-scoped projections, and no request was sent." />;
  if (capabilities.isPending) return <BlockedPage title="Discovering capabilities" detail="Discovering instance capabilities before enabling projection reads." />;
  if (capabilities.isError && currentQuery.data === undefined) return <BlockedPage title="Unsupported" detail="Capability discovery failed. Conversation projections remain disabled; no fallback read was sent." />;

  const advertised = route.view === 'conversations' ? conversationsReady : route.view === 'contacts' ? contactsReady : labelsReady;
  const viewSupported = advertised || currentQuery.data !== undefined;
  const emptyDirectory = viewSupported && currentQuery.data && currentAuthoritative && ((route.view === 'conversations' && filteredConversations.length === 0) || (route.view === 'contacts' && (contacts.data?.resource.items.length ?? 0) === 0) || (route.view === 'labels' && filteredLabels.length === 0));

  return (
    <>
      <WorkspacePageFrame
        eyebrow="Messaging"
        title="Conversations"
        description="Review projected conversations, contacts, labels, and message history."
        secondaryActions={<Button disabled={!viewSupported || routeRefreshing} onClick={refresh}>{routeRefreshing ? 'Refreshing…' : 'Refresh'}</Button>}
        compactTitle={hasConversation ? selectedConversation?.displayName ?? (selectedConversation ? `Unknown ${selectedConversation.type} conversation` : 'Message timeline') : 'Conversations'}
        compactDescription={hasConversation ? (selectedConversation ? humanizeToken(selectedConversation.type) : 'Message timeline') : undefined}
        compactLeadingAction={hasConversation ? <Button onClick={closeConversation}>Back</Button> : undefined}
        compactActions={<Button disabled={!viewSupported || (hasConversation ? detailRefreshing : currentQuery.isFetching)} onClick={hasConversation ? refreshDetail : refreshDirectory}>{(hasConversation ? detailRefreshing : currentQuery.isFetching) ? 'Refreshing…' : 'Refresh'}</Button>}
        compactHeadingRef={compactHeadingRef}
      >
        <SplitWorkspace
          frame="attached"
          detailOpen={hasConversation}
          directoryScrollKey={JSON.stringify([route.view, route.search, route.cursor])}
          detailScrollKey={JSON.stringify([activeConversationRef, route.messageCursor])}
          directoryLabel={`${route.view} directory`}
          detailLabel="Message timeline"
          directory={
            <>
              <div className="sticky top-0 z-10 border-b border-line bg-surface">
                <Tabs
                  active={route.view}
                  onChange={(id) => switchView(id as ConversationView)}
                  tabs={[
                    { id: 'conversations', label: 'Conversations', count: conversations.data?.resource.total },
                    { id: 'contacts', label: 'Contacts', count: contacts.data?.resource.total },
                    { id: 'labels', label: 'Labels', count: labels.data?.resource.length },
                  ]}
                />
                <FilterToolbar as="form" className="border-b-0" onSubmit={(e) => { e.preventDefault(); applySearch(); }}>
                  <Field label="Search" className="min-w-48 flex-1">
                    {(id) => <Input id={id} type="search" value={searchDraft} placeholder={route.view === 'contacts' ? 'Search projected contacts' : 'Filter loaded page'} onChange={(e) => setSearchDraft(e.target.value)} />}
                  </Field>
                  <div className="flex items-end"><Button type="submit" disabled={searchDraft === route.search}>Apply</Button></div>
                </FilterToolbar>
              </div>
            {!viewSupported ? <div className="p-3"><StateNotice kind="empty" title="Projection unavailable" detail={`The backend does not currently advertise ${route.view === 'conversations' ? 'canonical_conversation_identity' : route.view === 'contacts' ? 'contacts_projection' : 'labels_projection'}; capability polling continues because the projection may be unsupported or waiting for readiness.`} /></div> : null}
            {viewSupported && !advertised ? <div className="p-3"><StateNotice kind="empty" title="Capability changed" detail="Keeping the last usable projection snapshot visible while capability discovery no longer advertises this resource." /></div> : null}
            {viewSupported && currentQuery.isPending ? <div className="p-3"><StateNotice kind="loading" title="Loading" /></div> : null}
            {viewSupported && currentQuery.error && !currentQuery.data ? <div className="p-3"><FailureNotice error={currentQuery.error} onRetry={refreshDirectory} /></div> : null}
            {viewSupported && currentQuery.data ? (
              <>
                {currentQuery.error ? <div className="p-3"><FailureNotice error={currentQuery.error} stale onRetry={refreshDirectory} /></div> : null}
                <div className="px-3"><ProjectionStatus meta={'meta' in currentQuery.data ? currentQuery.data.meta : undefined} /></div>
                {route.view === 'conversations' ? <ConversationList items={filteredConversations} selectedId={activeConversationRef} onSelect={openConversation} />
                  : route.view === 'contacts' ? <ContactList items={contacts.data?.resource.items ?? []} selectedId={route.selected} onSelect={(id) => replaceParams(setConversationParam(searchParams, 'selected', id))} />
                    : <LabelList items={filteredLabels} selectedId={route.selected} onSelect={(id) => replaceParams(setConversationParam(searchParams, 'selected', id))} />}
                {emptyDirectory ? <div className="p-3"><StateNotice kind="empty" title="Empty" detail={route.search ? 'No projected item matches the URL-backed search.' : 'The ready projection contains no items.'} /></div> : null}
              </>
            ) : null}
            </>
          }
        directoryFooter={route.view !== 'labels' && viewSupported && currentQuery.data ? (
          <CursorPagination cursor={route.cursor} nextCursor={(route.view === 'conversations' ? conversations.data?.resource.pagination.nextCursor : contacts.data?.resource.pagination.nextCursor) ?? undefined} onCursor={(v) => replaceParams(updateSearchParams(searchParams, { cursor: v }, ['selected']))} />
        ) : undefined}
        detail={
          <>
            <WorkspacePaneHeader
              className="max-[900px]:hidden"
              title={selectedConversation?.displayName ?? (selectedConversation ? `Unknown ${selectedConversation.type} conversation` : 'Message timeline')}
              description={activeConversationRef ? 'Persisted projection history' : 'Select a projected conversation to inspect its history'}
            />
            {!activeConversationRef ? (
              <div className="p-4"><StateNotice kind="empty" title="No conversation selected" detail="Select a conversation from the projected directory." /></div>
            ) : !conversationsSupported ? (
              <div className="p-4"><StateNotice kind="empty" title="Unsupported" /></div>
            ) : conversation.isPending ? (
              <div className="p-4"><StateNotice kind="loading" title="Reading conversation" /></div>
            ) : conversation.error && !selectedConversation ? (
              <div className="p-4"><FailureNotice error={conversation.error} onRetry={() => conversation.refetch()} /></div>
            ) : selectedConversation ? (
              <>
                {conversation.error ? <div className="px-4 pt-3"><FailureNotice error={conversation.error} stale onRetry={() => conversation.refetch()} /></div> : null}
                <div className="px-4"><ProjectionStatus meta={conversation.data?.meta} /></div>
                <div className="flex flex-wrap items-center gap-3 px-4 py-2 border-b border-line text-xs text-fg-3">
                  <ConversationUnreadCount count={selectedConversation.unreadCount} context="detail" />
                  <span>{humanizeToken(selectedConversation.type)}</span>
                  <span className="font-mono text-fg-2 max-sm:order-2 max-sm:w-full max-sm:break-all">{selectedConversation.conversationId}</span>
                  <Button className="ml-auto" onClick={openConversationDetails}>Details</Button>
                </div>
                {!messagesSupported ? (
                  <div className="p-4"><StateNotice kind="empty" title="Unsupported" detail="The backend does not advertise messages_projection." /></div>
                ) : messages.isPending ? (
                  <div className="p-4"><StateNotice kind="loading" title="Reading messages" /></div>
                ) : messages.error && !messages.data ? (
                  <div className="p-4"><FailureNotice error={messages.error} onRetry={() => messages.refetch()} /></div>
                ) : messages.data ? (
                  <>
                    {messages.error ? <div className="px-4 pt-3"><FailureNotice error={messages.error} stale onRetry={() => messages.refetch()} /></div> : null}
                    <div className="px-4"><ProjectionStatus meta={messages.data.meta} /></div>
                    <MessageTimeline items={loadedMessages} selectedId={route.message} onSelect={openMessage} renderMedia={(message) => <ConversationMessageImage message={message} enabled={conversationMedia} compact />} />
                    {loadedMessages.length === 0 && (messages.data.meta?.syncStatus === undefined || messages.data.meta.syncStatus === 'ready') ? <div className="p-4"><StateNotice kind="empty" title="No messages" detail="The ready message projection contains no messages." /></div> : null}
                    <CursorPagination
                      cursor={route.messageCursor}
                      nextCursor={messages.data.resource.pagination.nextCursor ?? undefined}
                      resetLabel="Newest"
                      nextLabel="Older messages"
                      info="Showing one bounded message page."
                      onCursor={(v) => replaceParams(updateSearchParams(searchParams, { messageCursor: v }, ['message']))}
                    />
                  </>
                ) : null}
              </>
            ) : (
              <div className="p-4"><StateNotice kind="empty" title="Not returned" detail="The projected conversation detail was not returned." /></div>
            )}
          </>
        }
        detailFooter={selectedConversation ? <Composer
          conversationId={selectedConversation.conversationId}
          addressingJid={sendRecipient ?? ''}
          conversationName={selectedConversation.displayName ?? `Unknown ${selectedConversation.type} conversation`}
          enabled={messagesReady && outboundReady && Boolean(sendRecipient)}
          mediaEnabled={conversationMedia}
          unavailableDetail={recipientUnavailableDetail}
        /> : undefined}
        />
      </WorkspacePageFrame>

      {route.message && selectedConversation && messagesSupported ? <MessageInspector messageId={route.message} loadedConversation={selectedConversation} enabled={messagesReady} mediaEnabled={conversationMedia} onClose={() => replaceParams(setConversationParam(searchParams, 'message'))} /> : null}
      {!route.message && route.details === 'conversation' && selectedConversation ? <ConversationDetailsDrawer conversation={selectedConversation} onClose={closeConversationDetails} /> : null}
      {route.selected && route.view !== 'conversations' && viewSupported ? <DirectoryInspector contact={contact.data?.resource} label={label.data?.resource} meta={route.view === 'contacts' ? contact.data?.meta : label.data?.meta} error={route.view === 'contacts' ? contact.error : label.error} loading={route.view === 'contacts' ? contact.isPending : label.isPending} onRetry={() => route.view === 'contacts' ? contact.refetch() : label.refetch()} onClose={() => replaceParams(setConversationParam(searchParams, 'selected'))} /> : null}
    </>
  );
}
