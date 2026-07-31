import { useRef, useState } from 'react';
import { ApiProvider } from '@/api/ApiProvider';
import { Composer } from '@/features/conversations/Composer';
import { ConversationList, ConversationMessagePagination, MessageTimeline, SelectedConversationHeader } from '@/features/conversations/ConversationsView';
import { ConversationDetailsContent } from '@/features/conversations/Details';
import { ConversationMediaPlaceholder } from '@/features/conversations/Media';
import { humanizeToken } from '@/lib/format';
import { Button, CountBadge, Field, FilterToolbar, Image, Input, ResponsiveInspector, SplitWorkspace, useWorkspacePageFocus, WorkspacePageFrame, WorkspacePaneHeader } from '@/ui';
import { conversationsFixture, messagesFixture } from './preview-fixtures';

/** Dev-only: Conversations workspace (directory + thread) with sample data. */
export function PreviewConversations() {
  const [conversationId, setConversationId] = useState<string | undefined>(conversationsFixture[0].conversationId);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const messageScrollerRef = useRef<HTMLDivElement | null>(null);
  const conversation = conversationsFixture.find((item) => item.conversationId === conversationId);
  const { compactHeadingRef, rememberFocusOrigin } = useWorkspacePageFocus(conversationId);
  const openConversation = (id: string) => { rememberFocusOrigin(); setConversationId(id); setDetailsOpen(false); };
  return (
    <>
      <main className="h-dvh overflow-hidden bg-bg">
        <WorkspacePageFrame
        eyebrow="Messaging"
        title="Conversations"
        description="Review projected history and submit outbound messages."
        compactTitle={conversation?.displayName ?? 'Conversations'}
        compactDescription={conversation ? humanizeToken(conversation.type) : undefined}
        compactLeadingAction={conversation ? <Button onClick={() => setConversationId(undefined)}>Back</Button> : undefined}
        compactActions={conversation ? <><Button>Refresh</Button><Button onClick={() => setDetailsOpen(true)}>Details</Button></> : <Button>Refresh</Button>}
        compactHeadingRef={compactHeadingRef}
      >
        <ResponsiveInspector
          open={detailsOpen}
          persistent={Boolean(conversation)}
          onClose={() => setDetailsOpen(false)}
          title={conversation?.displayName ?? 'Conversation details'}
          inspector={conversation ? <ConversationDetailsContent conversation={conversation} /> : null}
        >
          <SplitWorkspace
          frame="attached"
          detailOpen={Boolean(conversation)}
          detailScrollKey={conversation?.conversationId}
          detailScrollerRef={messageScrollerRef}
          detailInitialPosition="end"
          directoryLabel="Conversation directory preview"
          detailLabel="Message timeline preview"
          directory={
            <>
              <div className="sticky top-0 z-10 border-b border-line bg-surface">
                <WorkspacePaneHeader title={<span className="inline-flex items-center gap-2">Conversations<CountBadge count={217} /></span>} description="Canonical projected conversations" actions={<Button>Refresh</Button>} />
                <FilterToolbar as="form" className="border-b-0" onSubmit={(e) => e.preventDefault()}>
                  <Field label="Filter conversations" className="min-w-48 flex-1">{(id) => <Input id={id} type="search" placeholder="Name or ID on this page" />}</Field>
                  <div className="flex items-end"><Button type="submit">Apply</Button></div>
                </FilterToolbar>
              </div>
              <ConversationList items={conversationsFixture} selectedId={conversationId} onSelect={openConversation} />
            </>
          }
        detail={
          <>
            {conversation ? <SelectedConversationHeader className="max-[900px]:hidden" conversation={conversation} refreshing={false} onRefresh={() => {}} onDetails={() => setDetailsOpen(true)} /> : <WorkspacePaneHeader className="max-[900px]:hidden" title="Message timeline" description="Select a projected Conversation" />}
          {conversation ? <div className="flex min-h-full flex-col">
            <MessageTimeline items={messagesFixture} selectedId="msg_2" onSelect={() => {}} conversationType={conversation.type} scrollKey={`${conversation.conversationId}:newest`} scrollContainerRef={messageScrollerRef} anchorToEnd renderMedia={(message) => {
              if (message.mediaAssetId === 'asset_ready') return <Image src="/ui-image-sample.svg" alt="Projected image message" aspect="video" fit="contain" className="max-w-80" />;
              if (message.mediaAssetId === 'asset_processing') return <ConversationMediaPlaceholder enabled compact label="Image Processing" tone="pending" detail="The projected message remains visible while private content is prepared." />;
              if (message.mediaAssetId === 'asset_failed') return <ConversationMediaPlaceholder enabled compact label="Image unavailable" tone="failed" detail="Media asset integrity failed" />;
              if (message.mediaAssetId === 'asset_expired') return <ConversationMediaPlaceholder enabled compact label="Image unavailable" tone="failed" detail="Media asset expired" />;
              return <ConversationMediaPlaceholder enabled={false} compact label="Image unavailable" tone="neutral" detail="Managed image content was not reported." />;
            }} />
            <ConversationMessagePagination itemCount={messagesFixture.length} nextCursor="preview-older" onCursor={() => {}} />
          </div> : null}
          </>
        }
        detailFooter={conversation ? <ApiProvider session={{ baseUrl: 'http://127.0.0.1:1', apiKey: 'preview-only', keyKind: 'api', connectedAt: new Date().toISOString() }}><Composer key={conversation.conversationId} conversationId={conversation.conversationId} addressingJid={conversation.addressingJid ?? ''} conversationName={conversation.displayName ?? 'Unknown conversation'} enabled mediaEnabled /></ApiProvider> : undefined}
          />
        </ResponsiveInspector>
        </WorkspacePageFrame>
      </main>
    </>
  );
}
