import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useBeforeUnload, useBlocker, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useApiSession } from '@/api/ApiProvider';
import { useServerCapabilities } from '@/api/CapabilitiesProvider';
import { useContactsProjection } from '@/api/contact-hooks';
import { humanizeToken, relativeTime } from '@/lib/format';
import { omitSearchParams, updateSearchParams, withSearchParams } from '@/lib/url-search-state';
import { useInvalidCursorReset } from '@/lib/useInvalidCursorReset';
import { projectionAttentionLabel, ProjectionAttentionStatus, ProjectionFailureNotice as FailureNotice, ProjectionStatus } from '@/components/ProjectionReadState';
import { Button, CountBadge, CursorPagination, Dialog, Field, FilterToolbar, IconButton, Input, PageHeader, ResponsiveInspector, SplitWorkspace, StateNotice, useWorkspacePageFocus, WorkspacePageFrame, WorkspacePaneHeader } from '@/ui';
import { Composer } from './Composer';
import { composerNavigationBlock, IDLE_COMPOSER_STATE, resolveComposerBlocker, shouldBlockConversationNavigation, type ComposerInteractionState, type ComposerNavigationBlock } from './composer-state';
import { canonicalConversationLocation, canonicalConversationReadsEnabled, resolveConversationRecipient } from './conversation-identity';
import { ConversationList, ConversationMessagePagination, MessageTimeline, SelectedConversationHeader } from './ConversationsView';
import { ConversationDetailsContent, MessageInspectorContent } from './Details';
import { ConversationMessageImage } from './Media';
import { useConversation, useConversations, useMessages } from './hooks';
import { buildParticipantDisplayIndex, participantIdentityReadsEnabled } from './participant-identity';
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
  const participantContactsEnabled = participantIdentityReadsEnabled(
    selectedConversation?.type,
    capabilities.data?.capabilities ?? [],
  );
  const participantContacts = useContactsProjection('', undefined, participantContactsEnabled, true);
  const participantDisplayIndex = useMemo(
    () => buildParticipantDisplayIndex(participantContacts.data?.resource.items ?? []),
    [participantContacts.data],
  );
  const navigationBlocker = useBlocker(({ currentLocation, nextLocation }) => shouldBlockConversationNavigation({
    currentPath: currentLocation.pathname,
    nextPath: nextLocation.pathname,
    canonicalConversationId,
    state: composerState,
  }));
  useBeforeUnload(useCallback((event) => {
    if (!composerNavigationBlock(composerState)) return;
    event.preventDefault();
    event.returnValue = '';
  }, [composerState]), { capture: true });
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
    const resolution = resolveComposerBlocker(navigationBlocker.state, composerState);
    if (resolution.action === 'show') setBlockedReason(resolution.reason);
    else {
      setBlockedReason(undefined);
      if (resolution.action === 'reset' && navigationBlocker.state === 'blocked') navigationBlocker.reset();
    }
  }, [composerState, navigationBlocker.state]);

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
  const routeRefreshing = conversations.isFetching || detailRefreshing;
  const refreshDirectory = () => { void conversations.refetch(); };
  const refreshDetail = () => { if (activeConversationRef) { void conversation.refetch(); if (messagesReady && canonicalConversationId) void messages.refetch(); } };
  const refreshPage = () => { refreshDirectory(); refreshDetail(); };
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
  const pageTitle = <span className="inline-flex items-center gap-2">Conversations{typeof conversations.data?.resource.total === 'number' ? <CountBadge count={conversations.data.resource.total} /> : null}</span>;
  const selectedProjectionEntries = [{ label: 'Conversation', meta: conversation.data?.meta }, { label: 'Messages', meta: messages.data?.meta }];
  const selectedProjectionAttention = projectionAttentionLabel(selectedProjectionEntries);

  return (
    <>
      <WorkspacePageFrame
        eyebrow="Messaging"
        title={pageTitle}
        description="Review projected history and submit outbound messages."
        secondaryActions={<IconButton icon="refresh" label="Refresh conversations" disabled={!viewSupported} busy={routeRefreshing} onClick={refreshPage} />}
        compactTitle={hasConversation ? selectedConversation?.displayName ?? selectedConversation?.phoneNumber ?? (selectedConversation ? `Unknown ${selectedConversation.type} conversation` : 'Message timeline') : pageTitle}
        compactDescription={hasConversation ? (selectedConversation ? `${humanizeToken(selectedConversation.type)} · ${selectedProjectionAttention ?? `Last activity ${selectedConversation.lastActivityAt ? relativeTime(selectedConversation.lastActivityAt) : 'unreported'}`}` : 'Message timeline') : undefined}
        compactLeadingAction={hasConversation ? <IconButton icon="arrow-left" label="Back to conversations" onClick={closeConversation} /> : undefined}
        compactActions={hasConversation && selectedConversation
          ? <><IconButton icon="refresh" label="Refresh conversation" disabled={!viewSupported} busy={routeRefreshing} onClick={refreshPage} /><IconButton icon="panel-right" label="Open conversation details" onClick={openConversationDetails} /></>
          : <IconButton icon="refresh" label="Refresh conversations" disabled={!viewSupported} busy={routeRefreshing} onClick={refreshPage} />}
        compactHeadingRef={compactHeadingRef}
      >
        <ResponsiveInspector
          open={Boolean(inspectedMessageId || (route.details === 'conversation' && selectedConversation))}
          persistent={Boolean(selectedConversation)}
          onClose={() => inspectedMessageId ? replaceParams(setConversationParam(searchParams, 'message')) : closeConversationDetails()}
          title={inspectedMessageId ? 'Message details' : selectedConversation?.displayName ?? selectedConversation?.phoneNumber ?? (selectedConversation ? `Unknown ${humanizeToken(selectedConversation.type)} conversation` : 'Conversation details')}
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
                <FilterToolbar as="form" className="border-b-0" onSubmit={(e) => { e.preventDefault(); applySearch(); }}>
                  <Field label="Filter conversations" className="min-w-48 flex-1">
                    {(id) => <Input id={id} type="search" value={searchDraft} placeholder="Name or ID on this page" onChange={(e) => setSearchDraft(e.target.value)} />}
                  </Field>
                  <div className="flex items-end"><IconButton type="submit" icon="search" label="Apply conversation search" disabled={searchDraft === route.search} /></div>
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
                {selectedOutsidePage ? <div className="px-3 pb-3"><StateNotice kind="info" title="Selected Conversation is outside this page" detail="The selected canonical Conversation remains open while the directory shows a different bounded page or filter." action={route.search ? <IconButton icon="close" label="Clear conversation filter" onClick={() => { setSearchDraft(''); replaceParams(updateSearchParams(searchParams, { search: undefined, cursor: undefined })); }} /> : route.cursor ? <IconButton icon="chevrons-left" label="Return to first conversation page" onClick={() => replaceParams(updateSearchParams(searchParams, { cursor: undefined }))} /> : undefined} /></div> : null}
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
            {selectedConversation ? <SelectedConversationHeader className="max-[900px]:hidden" conversation={selectedConversation} projectionAttention={<ProjectionAttentionStatus entries={selectedProjectionEntries} />} onDetails={openConversationDetails} /> : <WorkspacePaneHeader className="max-[900px]:hidden" title="Message timeline" description={activeConversationRef ? 'Reading projected Conversation' : 'Select a projected Conversation to inspect its history'} />}
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
                      participantDisplayIndex={participantDisplayIndex}
                      scrollKey={JSON.stringify([selectedConversation.conversationId, route.messageCursor])}
                      scrollContainerRef={messageScrollerRef}
                      anchorToEnd={!route.messageCursor}
                    />
                    {loadedMessages.length === 0 && (messages.data.meta?.syncStatus === undefined || messages.data.meta.syncStatus === 'ready') ? <div className="p-4"><StateNotice kind="empty" title="No projected messages" detail="The ready Message projection returned no messages for this Conversation." /></div> : null}
                  </>
                ) : null}
              </div>
            ) : (
              <div className="p-4"><StateNotice kind="empty" title="Not returned" detail="The projected conversation detail was not returned." /></div>
            )}
          </>
        }
        detailFooter={selectedConversation ? <>
          {messages.data ? <ConversationMessagePagination
            itemCount={loadedMessages.length}
            cursor={route.messageCursor}
            nextCursor={messages.data.resource.pagination.nextCursor ?? undefined}
            onCursor={(v) => replaceParams(updateSearchParams(searchParams, { messageCursor: v }, ['message']))}
          /> : null}
          <Composer
            key={selectedConversation.conversationId}
            conversationId={selectedConversation.conversationId}
            addressingJid={sendRecipient ?? ''}
            conversationName={selectedConversation.displayName ?? selectedConversation.phoneNumber ?? `Unknown ${selectedConversation.type} conversation`}
            enabled={messagesReady && outboundReady && Boolean(sendRecipient)}
            mediaEnabled={conversationMedia}
            unavailableDetail={recipientUnavailableDetail}
            onInteractionStateChange={setComposerState}
          />
        </> : undefined}
          />
        </ResponsiveInspector>
      </WorkspacePageFrame>

      <Dialog
        open={navigationBlocker.state === 'blocked' && blockedReason !== undefined}
        onClose={() => navigationBlocker.state === 'blocked' && navigationBlocker.reset()}
        title={blockedReason === 'dirty' ? 'Discard unsent message?' : blockedReason === 'pending' ? 'Message submission in progress' : blockedReason === 'unknown_outcome' ? 'Review unknown send outcome' : ''}
        footer={blockedReason === 'dirty'
          ? <><Button onClick={() => navigationBlocker.state === 'blocked' && navigationBlocker.reset()}>Stay</Button><Button variant="danger" onClick={() => navigationBlocker.state === 'blocked' && navigationBlocker.proceed()}>Discard and continue</Button></>
          : blockedReason ? <Button variant="primary" onClick={() => navigationBlocker.state === 'blocked' && navigationBlocker.reset()}>Stay with Conversation</Button> : null}
      >
        <p className="text-sm text-fg-2">
          {blockedReason === 'dirty'
            ? 'Changing Conversation will discard the current text or media draft.'
            : blockedReason === 'pending'
              ? 'Wait for the current provider command acknowledgement before changing Conversation.'
              : blockedReason === 'unknown_outcome' ? 'The send outcome is unknown. Keep this Conversation open and review the command state before taking another action.' : ''}
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
