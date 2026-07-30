import { useState } from 'react';
import { ApiProvider } from '@/api/ApiProvider';
import { Composer } from '@/features/conversations/Composer';
import { ContactList, ConversationList, ConversationUnreadCount, LabelList, MessageTimeline } from '@/features/conversations/ConversationsView';
import { ConversationDetailsDrawer } from '@/features/conversations/Details';
import { ConversationMediaPlaceholder } from '@/features/conversations/Media';
import { Button, CursorPagination, Field, FilterToolbar, Image, Input, SplitWorkspace, Tabs, useWorkspacePageFocus, WorkspacePageFrame, WorkspacePaneHeader } from '@/ui';
import { contactsFixture, conversationsFixture, labelsFixture, messagesFixture } from './preview-fixtures';

/** Dev-only: Conversations workspace (directory + thread) with sample data. */
export function PreviewConversations() {
  const [view, setView] = useState('conversations');
  const [conversationId, setConversationId] = useState<string | undefined>(conversationsFixture[0].conversationId);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const conversation = conversationsFixture.find((item) => item.conversationId === conversationId);
  const { compactHeadingRef, rememberFocusOrigin } = useWorkspacePageFocus(conversationId);
  const openConversation = (id: string) => { rememberFocusOrigin(); setConversationId(id); setDetailsOpen(false); };
  const switchView = (id: string) => { setView(id); setConversationId(id === 'conversations' ? conversationsFixture[0]?.conversationId : undefined); setDetailsOpen(false); };
  return (
    <>
      <main className="h-dvh overflow-hidden bg-bg">
        <WorkspacePageFrame
        eyebrow="Messaging"
        title="Conversations"
        description="Review projected conversations, contacts, labels, and message history."
        secondaryActions={<Button>Refresh</Button>}
        compactTitle={conversation?.displayName ?? 'Conversations'}
        compactDescription={conversation ? 'Individual' : undefined}
        compactLeadingAction={conversation ? <Button onClick={() => setConversationId(undefined)}>Back</Button> : undefined}
        compactActions={<Button>Refresh</Button>}
        compactHeadingRef={compactHeadingRef}
      >
        <SplitWorkspace
          frame="attached"
          detailOpen={Boolean(conversation)}
          directoryLabel="Conversation directory preview"
          detailLabel="Message timeline preview"
          directory={
            <>
              <div className="sticky top-0 z-10 border-b border-line bg-surface">
                <Tabs active={view} onChange={switchView} tabs={[{ id: 'conversations', label: 'Conversations', count: 217 }, { id: 'contacts', label: 'Contacts', count: 84 }, { id: 'labels', label: 'Labels', count: labelsFixture.length }]} />
                <FilterToolbar as="form" className="border-b-0" onSubmit={(e) => e.preventDefault()}>
                  <Field label="Search" className="min-w-48 flex-1">{(id) => <Input id={id} type="search" placeholder="Filter loaded page" />}</Field>
                  <div className="flex items-end"><Button type="submit">Apply</Button></div>
                </FilterToolbar>
              </div>
              {view === 'conversations' ? <ConversationList items={conversationsFixture} selectedId={conversationId} onSelect={openConversation} /> : view === 'contacts' ? <ContactList items={contactsFixture} onSelect={() => {}} /> : <LabelList items={labelsFixture} onSelect={() => {}} />}
            </>
          }
        detail={
          <>
            <WorkspacePaneHeader
              className="max-[900px]:hidden"
              title={conversation?.displayName ?? 'Message timeline'}
              description={conversation ? 'Persisted projection history' : 'Select a projected conversation'}
            />
          {conversation ? <>
            <div className="flex flex-wrap items-center gap-3 px-4 py-2 border-b border-line text-xs text-fg-3">
              <ConversationUnreadCount count={conversation.unreadCount} context="detail" />
              <span>Individual</span>
              <span className="font-mono text-fg-2 max-sm:order-2 max-sm:w-full max-sm:break-all">{conversation.conversationId}</span>
              <Button className="ml-auto" onClick={() => setDetailsOpen(true)}>Details</Button>
            </div>
            <MessageTimeline items={messagesFixture} selectedId="msg_2" onSelect={() => {}} renderMedia={(message) => {
              if (message.mediaAssetId === 'asset_ready') return <Image src="/ui-image-sample.svg" alt="Projected image message" aspect="video" fit="contain" className="max-w-80" />;
              if (message.mediaAssetId === 'asset_processing') return <ConversationMediaPlaceholder enabled compact label="Image Processing" tone="pending" detail="The projected message remains visible while private content is prepared." />;
              if (message.mediaAssetId === 'asset_failed') return <ConversationMediaPlaceholder enabled compact label="Image unavailable" tone="failed" detail="Media asset integrity failed" />;
              if (message.mediaAssetId === 'asset_expired') return <ConversationMediaPlaceholder enabled compact label="Image unavailable" tone="failed" detail="Media asset expired" />;
              return <ConversationMediaPlaceholder enabled={false} compact label="Image unavailable" tone="neutral" detail="Managed image content was not reported." />;
            }} />
            <CursorPagination nextCursor="preview-older" resetLabel="Newest" nextLabel="Older messages" info="Showing one bounded message page." onCursor={() => {}} />
          </> : null}
          </>
        }
        detailFooter={conversation ? <ApiProvider session={{ baseUrl: 'http://127.0.0.1:1', apiKey: 'preview-only', keyKind: 'api', connectedAt: new Date().toISOString() }}><Composer conversationId={conversation.conversationId} addressingJid={conversation.addressingJid ?? ''} conversationName={conversation.displayName ?? 'Unknown conversation'} enabled mediaEnabled /></ApiProvider> : undefined}
        />
        </WorkspacePageFrame>
      </main>
      {detailsOpen && conversation ? <ConversationDetailsDrawer conversation={conversation} onClose={() => setDetailsOpen(false)} /> : null}
    </>
  );
}
