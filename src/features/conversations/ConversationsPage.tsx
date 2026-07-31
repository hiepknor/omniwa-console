import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useBlocker, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useApiSession } from '@/api/ApiProvider';
import { useServerCapabilities } from '@/api/CapabilitiesProvider';
import { humanizeToken } from '@/lib/format';
import { omitSearchParams, updateSearchParams, withSearchParams } from '@/lib/url-search-state';
import { useInvalidCursorReset } from '@/lib/useInvalidCursorReset';
import { ProjectionFailureNotice as FailureNotice, ProjectionStatus, ProjectionStatusGroup } from '@/components/ProjectionReadState';
import { Button, CountBadge, CursorPagination, Dialog, Field, FilterToolbar, Input, PageHeader, ResponsiveInspector, SplitWorkspace, StateNotice, useWorkspacePageFocus, WorkspacePageFrame, WorkspacePaneHeader } from '@/ui';
import { Composer } from './Composer';
import { composerNavigationBlock, IDLE_COMPOSER_STATE, shouldBlockConversationNavigation, type ComposerInteractionState, type ComposerNavigationBlock } from './composer-state';
import { canonicalConversationLocation, canonicalConversationReadsEnabled, resolveConversationRecipient } from './conversation-identity';
import { ConversationList, ConversationMessagePagination, MessageTimeline, SelectedConversationHeader } from './ConversationsView';
import { ConversationDetailsContent, MessageInspectorContent } from './Details';
import { ConversationMessageImage } from './Media';
import { useConversation, useConversations, useMessages } from './hooks';
import { conversationRouteState, legacyDirectoryTarget, setConversationParam } from './route-state';

function BlockedPage({ detail, title }: { detail: string; title: string }) {
  return (
    <div className="grid gap-6 p-6 max-sm:p-4">
      <PageHeader eyebrow="Messaging" title="Conversations" description="Review projected history and submit outbound messages." />
      <StateNotice kind="empty" title={title} detail={detail} />
    </div>
  );
}

function ConversationWorkspace() {
  const session = useApiSession();
  const capabilities = useServerCapabilities();
  const { conversationRef } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const route = conversationRouteState(searchParams);
  const activeConversationRef = conversationRef;
  const hasConversation = Boolean(activeConversationRef);
  const { compactHeadingRef, rememberFocusOrigin } = useWorkspacePageFocus(activeConversationRef);
  const [searchDraft, setSearchDraft] = useState(route.search);
  const [composerState, setComposerState] = useState<ComposerInteractionState>(IDLE_COMPOSER_STATE);
  const messageScrollerRef = useRef<HTMLDivElement | null>(null);
  const [blockedReason, setBlockedReason] = useState<Exclude<ComposerNavigationBlock, undefined>>();
  useEffect(() => setSearchDraft(route.search), [route.search]);
  const instanceScope = session.keyKind === 'api';
  const cap = (name: string) => capabilities.data?.capabilities.includes(name) ?? false;
  const conversationsReady = canonicalConversationReadsEnabled(instanceScope, capabilities.data?.capabilities ?? []);
  const messagesReady = conversationsReady && cap('messages_projection');
  const outboundReady = cap('outbound_rate_limit');
  const conversationMedia = cap('conversation_media_assets');
  const conversations = useConversations(route.cursor, conversationsReady);
  const conversation = useConversation(activeConversationRef, conversationsReady);
  const selectedConversation = conversation.data?.resource;
  const sendRecipient = resolveConversationRecipient(selectedConversation);
  const canonicalConversationId = selectedConversation?.conversationId;
  const navigationBlocker = useBlocker(({ currentLocation, nextLocation }) => shouldBlockConversationNavigation({
    currentPath: currentLocation.pathname,
    nextPath: nextLocation.pathname,
    canonicalConversationId,
    state: composerState,
  }));
  const messages = useMessages(canonicalConversationId, route.messageCursor, messagesReady);
  const loadedConversations = conversations.data?.resource.items ?? [];
  const filteredConversations = useMemo(() => { const term = route.search.trim().toLocaleLowerCase(); return loadedConversations.filter((i) => !term || i.conversationId.toLocaleLowerCase().includes(term) || i.displayName?.toLocaleLowerCase().includes(term)); }, [loadedConversations, route.search]);
  const selectedOutsidePage = Boolean(canonicalConversationId && conversations.data && !filteredConversations.some((item) => item.conversationId === canonicalConversationId));
  const loadedMessages = useMemo(() => [...(messages.data?.resource.items ?? [])].sort((a, b) => a.createdAt.localeCompare(b.createdAt)), [messages.data]);
  const recipientUnavailableDetail = selectedConversation && !sendRecipient
    ? 'The canonical conversation has no addressing JID. Sending remains disabled until the backend publishes its authoritative provider command target.'
    : undefined;
  const conversationsSupported = conversationsReady || conversations.data !== undefined || conversation.data !== undefined;
  const messagesSupported = messagesReady || messages.data !== undefined;

  useEffect(() => {
    if (navigationBlocker.state === 'blocked') setBlockedReason(composerNavigationBlock(composerState));
    else setBlockedReason(undefined);
  }, [navigationBlocker.state]);

  const replaceParams = (next: URLSearchParams) => setSearchParams(next, { replace: true });
  const openConversation = (id: string) => {
    if (id === canonicalConversationId) return;
    rememberFocusOrigin();
    navigate(withSearchParams(`/conversations/${encodeURIComponent(id)}`, omitSearchParams(searchParams, ['message', 'messageCursor', 'details'])));
  };
  const closeConversation = () => navigate(withSearchParams('/conversations', omitSearchParams(searchParams, ['message', 'messageCursor', 'details'])));
  const openConversationDetails = () => replaceParams(updateSearchParams(searchParams, { details: 'conversation', message: undefined }));
  const closeConversationDetails = () => replaceParams(updateSearchParams(searchParams, { details: undefined }));
  const openMessage = (id: string) => replaceParams(updateSearchParams(searchParams, { message: id, details: undefined }));
  const applySearch = () => replaceParams(updateSearchParams(searchParams, { search: searchDraft.trim() }, ['cursor']));
  const currentMeta = conversations.data?.meta;
  const currentAuthoritative = currentMeta?.syncStatus === undefined || currentMeta.syncStatus === 'ready';
  const detailRefreshing = Boolean(activeConversationRef) && (conversation.isFetching || messages.isFetching);
  const refreshDirectory = () => { void conversations.refetch(); };
  const refreshDetail = () => { if (activeConversationRef) { void conversation.refetch(); if (messagesReady && canonicalConversationId) void messages.refetch(); } };
  useInvalidCursorReset(conversations.error, route.cursor, () => replaceParams(updateSearchParams(searchParams, { cursor: undefined })));
  useInvalidCursorReset(messages.error, route.messageCursor, () => replaceParams(updateSearchParams(searchParams, { messageCursor: undefined }, ['message'])));
  useEffect(() => {
    if (route.message && route.details) replaceParams(updateSearchParams(searchParams, { details: undefined }));
  }, [route.details, route.message]);
  useEffect(() => {
    const canonicalLocation = canonicalConversationLocation(activeConversationRef, selectedConversation, searchParams);
    if (canonicalLocation) navigate(canonicalLocation, { replace: true });
  }, [activeConversationRef, navigate, searchParams, selectedConversation?.conversationId]);
  if (!instanceScope) return <BlockedPage title="Instance credential required" detail="Conversations requires an instance credential. Admin scope cannot read token-scoped projections, and no request was sent." />;
  if (capabilities.isPending) return <BlockedPage title="Discovering capabilities" detail="Discovering instance capabilities before enabling projection reads." />;
  if (capabilities.isError && conversations.data === undefined) return <BlockedPage title="Unsupported" detail="Capability discovery failed. Conversation projections remain disabled; no fallback read was sent." />;

  const advertised = conversationsReady;
  const viewSupported = advertised || conversations.data !== undefined;
  const emptyDirectory = Boolean(viewSupported && conversations.data && currentAuthoritative && filteredConversations.length === 0);
  const inspectedMessageId = route.message && selectedConversation && messagesSupported ? route.message : undefined;

  return (
    <>
      <WorkspacePageFrame
        eyebrow="Messaging"
        title="Conversations"
        description="Review projected history and submit outbound messages."
        compactTitle={hasConversation ? selectedConversation?.displayName ?? (selectedConversation ? `Unknown ${selectedConversation.type} conversation` : 'Message timeline') : 'Conversations'}
        compactDescription={hasConversation ? (selectedConversation ? humanizeToken(selectedConversation.type) : 'Message timeline') : undefined}
        compactLeadingAction={hasConversation ? <Button onClick={closeConversation}>Back</Button> : undefined}
        compactActions={hasConversation && selectedConversation
          ? <><Button disabled={!viewSupported || detailRefreshing} onClick={refreshDetail}>{detailRefreshing ? 'Refreshing…' : 'Refresh'}</Button><Button onClick={openConversationDetails}>Details</Button></>
          : <Button disabled={!viewSupported || conversations.isFetching} onClick={refreshDirectory}>{conversations.isFetching ? 'Refreshing…' : 'Refresh'}</Button>}
        compactHeadingRef={compactHeadingRef}
      >
        <ResponsiveInspector
          open={Boolean(inspectedMessageId || (route.details === 'conversation' && selectedConversation))}
          persistent={Boolean(selectedConversation)}
          onClose={() => inspectedMessageId ? replaceParams(setConversationParam(searchParams, 'message')) : closeConversationDetails()}
          title={inspectedMessageId ? 'Message details' : selectedConversation?.displayName ?? (selectedConversation ? `Unknown ${humanizeToken(selectedConversation.type)} conversation` : 'Conversation details')}
          subtitle={inspectedMessageId}
          inspector={inspectedMessageId && selectedConversation
            ? <MessageInspectorContent messageId={inspectedMessageId} loadedConversation={selectedConversation} enabled={messagesReady} mediaEnabled={conversationMedia} />
            : selectedConversation
              ? <ConversationDetailsContent conversation={selectedConversation} />
              : null}
          focusKey={inspectedMessageId ? `message:${inspectedMessageId}` : undefined}
          dockedClose={Boolean(inspectedMessageId)}
        >
          <SplitWorkspace
          frame="attached"
          detailOpen={hasConversation}
          directoryScrollKey={JSON.stringify([route.search, route.cursor])}
          detailScrollKey={JSON.stringify([activeConversationRef, route.messageCursor])}
          detailScrollerRef={messageScrollerRef}
          detailInitialPosition={route.messageCursor ? 'start' : 'end'}
          directoryLabel="Conversation directory"
          detailLabel="Message timeline"
          directory={
            <>
              <div className="sticky top-0 z-10 border-b border-line bg-surface">
                <WorkspacePaneHeader
                  title={<span className="inline-flex items-center gap-2">Conversations{typeof conversations.data?.resource.total === 'number' ? <CountBadge count={conversations.data.resource.total} /> : null}</span>}
                  description={route.search ? `${filteredConversations.length} shown on this page for “${route.search}”` : 'Canonical projected conversations'}
                  actions={<Button disabled={!viewSupported || conversations.isFetching} onClick={refreshDirectory}>{conversations.isFetching ? 'Refreshing…' : 'Refresh'}</Button>}
                />
                <FilterToolbar as="form" className="border-b-0" onSubmit={(e) => { e.preventDefault(); applySearch(); }}>
                  <Field label="Filter conversations" className="min-w-48 flex-1">
                    {(id) => <Input id={id} type="search" value={searchDraft} placeholder="Name or ID on this page" onChange={(e) => setSearchDraft(e.target.value)} />}
                  </Field>
                  <div className="flex items-end"><Button type="submit" disabled={searchDraft === route.search}>Apply</Button></div>
                </FilterToolbar>
              </div>
            {!viewSupported ? <div className="p-3"><StateNotice kind="empty" title="Projection unavailable" detail="The backend does not currently advertise canonical_conversation_identity; capability polling continues because the projection may be unsupported or waiting for readiness." /></div> : null}
            {viewSupported && !advertised ? <div className="p-3"><StateNotice kind="empty" title="Capability changed" detail="Keeping the last usable projection snapshot visible while capability discovery no longer advertises this resource." /></div> : null}
            {viewSupported && conversations.isPending ? <div className="p-3"><StateNotice kind="loading" title="Loading conversations" /></div> : null}
            {viewSupported && conversations.error && !conversations.data ? <div className="p-3"><FailureNotice error={conversations.error} onRetry={refreshDirectory} /></div> : null}
            {viewSupported && conversations.data ? (
              <>
                {conversations.error ? <div className="p-3"><FailureNotice error={conversations.error} stale onRetry={refreshDirectory} /></div> : null}
                <div className="px-3"><ProjectionStatus meta={conversations.data.meta} /></div>
                {selectedOutsidePage ? <div className="px-3 pb-3"><StateNotice kind="info" title="Selected Conversation is outside this page" detail="The selected canonical Conversation remains open while the directory shows a different bounded page or filter." action={route.search ? <Button onClick={() => { setSearchDraft(''); replaceParams(updateSearchParams(searchParams, { search: undefined, cursor: undefined })); }}>Clear filter</Button> : route.cursor ? <Button onClick={() => replaceParams(updateSearchParams(searchParams, { cursor: undefined }))}>First page</Button> : undefined} /></div> : null}
                <ConversationList items={filteredConversations} selectedId={canonicalConversationId ?? activeConversationRef} onSelect={openConversation} />
                {emptyDirectory ? <div className="p-3"><StateNotice kind="empty" title="Empty" detail={route.search ? 'No projected Conversation on this loaded page matches the URL-backed filter.' : 'The ready Conversation projection contains no items.'} /></div> : null}
              </>
            ) : null}
            </>
          }
        directoryFooter={viewSupported && conversations.data ? (
          <CursorPagination cursor={route.cursor} nextCursor={conversations.data.resource.pagination.nextCursor ?? undefined} nextLabel="Next page" info={`${filteredConversations.length} shown on this page`} onCursor={(v) => replaceParams(updateSearchParams(searchParams, { cursor: v }))} />
        ) : undefined}
        detail={
          <>
            {selectedConversation ? <SelectedConversationHeader className="max-[900px]:hidden" conversation={selectedConversation} refreshing={detailRefreshing} onRefresh={refreshDetail} onDetails={openConversationDetails} /> : <WorkspacePaneHeader className="max-[900px]:hidden" title="Message timeline" description={activeConversationRef ? 'Reading projected Conversation' : 'Select a projected Conversation to inspect its history'} />}
            {!activeConversationRef ? (
              <div className="p-4"><StateNotice kind="empty" title="No conversation selected" detail="Select a conversation from the projected directory." /></div>
            ) : !conversationsSupported ? (
              <div className="p-4"><StateNotice kind="empty" title="Unsupported" /></div>
            ) : conversation.isPending ? (
              <div className="p-4"><StateNotice kind="loading" title="Reading conversation" /></div>
            ) : conversation.error && !selectedConversation ? (
              <div className="p-4"><FailureNotice error={conversation.error} onRetry={() => conversation.refetch()} /></div>
            ) : selectedConversation ? (
              <div className="flex min-h-full flex-col">
                {conversation.error ? <div className="px-4 pt-3"><FailureNotice error={conversation.error} stale onRetry={() => conversation.refetch()} /></div> : null}
                <div className="px-4"><ProjectionStatusGroup entries={[{ label: 'Conversation', meta: conversation.data?.meta }, { label: 'Messages', meta: messages.data?.meta }]} /></div>
                {!messagesSupported ? (
                  <div className="p-4"><StateNotice kind="empty" title="Unsupported" detail="The backend does not advertise messages_projection." /></div>
                ) : messages.isPending ? (
                  <div className="p-4"><StateNotice kind="loading" title="Reading messages" /></div>
                ) : messages.error && !messages.data ? (
                  <div className="p-4"><FailureNotice error={messages.error} onRetry={() => messages.refetch()} /></div>
                ) : messages.data ? (
                  <>
                    {messages.error ? <div className="px-4 pt-3"><FailureNotice error={messages.error} stale onRetry={() => messages.refetch()} /></div> : null}
                    <MessageTimeline
                      items={loadedMessages}
                      selectedId={route.message}
                      onSelect={openMessage}
                      renderMedia={(message) => <ConversationMessageImage message={message} enabled={conversationMedia} compact />}
                      conversationType={selectedConversation.type}
                      scrollKey={JSON.stringify([selectedConversation.conversationId, route.messageCursor])}
                      scrollContainerRef={messageScrollerRef}
                      anchorToEnd={!route.messageCursor}
                    />
                    {loadedMessages.length === 0 && (messages.data.meta?.syncStatus === undefined || messages.data.meta.syncStatus === 'ready') ? <div className="p-4"><StateNotice kind="empty" title="No projected messages" detail="The ready Message projection returned no messages for this Conversation." /></div> : null}
                    <ConversationMessagePagination
                      itemCount={loadedMessages.length}
                      cursor={route.messageCursor}
                      nextCursor={messages.data.resource.pagination.nextCursor ?? undefined}
                      onCursor={(v) => replaceParams(updateSearchParams(searchParams, { messageCursor: v }, ['message']))}
                    />
                  </>
                ) : null}
              </div>
            ) : (
              <div className="p-4"><StateNotice kind="empty" title="Not returned" detail="The projected conversation detail was not returned." /></div>
            )}
          </>
        }
        detailFooter={selectedConversation ? <Composer
          key={selectedConversation.conversationId}
          conversationId={selectedConversation.conversationId}
          addressingJid={sendRecipient ?? ''}
          conversationName={selectedConversation.displayName ?? `Unknown ${selectedConversation.type} conversation`}
          enabled={messagesReady && outboundReady && Boolean(sendRecipient)}
          mediaEnabled={conversationMedia}
          unavailableDetail={recipientUnavailableDetail}
          onInteractionStateChange={setComposerState}
        /> : undefined}
          />
        </ResponsiveInspector>
      </WorkspacePageFrame>

      <Dialog
        open={navigationBlocker.state === 'blocked'}
        onClose={() => navigationBlocker.state === 'blocked' && navigationBlocker.reset()}
        title={blockedReason === 'dirty' ? 'Discard unsent message?' : blockedReason === 'pending' ? 'Message submission in progress' : 'Review unknown send outcome'}
        footer={blockedReason === 'dirty'
          ? <><Button onClick={() => navigationBlocker.state === 'blocked' && navigationBlocker.reset()}>Stay</Button><Button variant="danger" onClick={() => navigationBlocker.state === 'blocked' && navigationBlocker.proceed()}>Discard and continue</Button></>
          : <Button variant="primary" onClick={() => navigationBlocker.state === 'blocked' && navigationBlocker.reset()}>Stay with Conversation</Button>}
      >
        <p className="text-sm text-fg-2">
          {blockedReason === 'dirty'
            ? 'Changing Conversation will discard the current text or media draft.'
            : blockedReason === 'pending'
              ? 'Wait for the current provider command acknowledgement before changing Conversation.'
              : 'The send outcome is unknown. Keep this Conversation open and review the command state before taking another action.'}
        </p>
      </Dialog>

    </>
  );
}

export function ConversationsPage() {
  const [searchParams] = useSearchParams();
  const target = legacyDirectoryTarget(searchParams);
  return target ? <Navigate replace to={target} /> : <ConversationWorkspace />;
}
