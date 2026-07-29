import { useState } from 'react';
import { ApiProvider } from '@/api/ApiProvider';
import { Composer } from '@/features/conversations/Composer';
import { ChatList, ContactList, ConversationUnreadCount, LabelList, MessageTimeline } from '@/features/conversations/ConversationsView';
import { ConversationMediaPlaceholder } from '@/features/conversations/Media';
import { Button, Field, FilterToolbar, Image, Input, SplitWorkspace, Tabs, useWorkspacePageFocus, WorkspacePageFrame, WorkspacePaneHeader } from '@/ui';
import { chatsFixture, contactsFixture, labelsFixture, messagesFixture } from './preview-fixtures';

/** Dev-only: Conversations workspace (directory + thread) with sample data. */
export function PreviewConversations() {
  const [view, setView] = useState('chats');
  const [chatId, setChatId] = useState<string | undefined>(chatsFixture[0].id);
  const chat = chatsFixture.find((c) => c.id === chatId);
  const { compactHeadingRef, rememberFocusOrigin } = useWorkspacePageFocus(chatId);
  const openChat = (id: string) => { rememberFocusOrigin(); setChatId(id); };
  const switchView = (id: string) => { setView(id); setChatId(id === 'chats' ? chatsFixture[0]?.id : undefined); };
  return (
    <main className="h-dvh overflow-hidden bg-bg">
      <WorkspacePageFrame
        eyebrow="Messaging"
        title="Conversations"
        description="Review projected chats, contacts, labels, and message history."
        secondaryActions={<Button>Refresh</Button>}
        compactTitle={chat?.displayName ?? 'Conversations'}
        compactDescription={chat ? 'Individual' : undefined}
        compactLeadingAction={chat ? <Button onClick={() => setChatId(undefined)}>Back</Button> : undefined}
        compactActions={<Button>Refresh</Button>}
        compactHeadingRef={compactHeadingRef}
      >
        <SplitWorkspace
          frame="attached"
          detailOpen={Boolean(chat)}
          directoryLabel="Chat directory preview"
          detailLabel="Message timeline preview"
          directory={
            <>
              <div className="sticky top-0 z-10 border-b border-line bg-surface">
                <Tabs active={view} onChange={switchView} tabs={[{ id: 'chats', label: 'Chats', count: 217 }, { id: 'contacts', label: 'Contacts', count: 84 }, { id: 'labels', label: 'Labels', count: labelsFixture.length }]} />
                <FilterToolbar as="form" className="border-b-0" onSubmit={(e) => e.preventDefault()}>
                  <Field label="Search" className="min-w-48 flex-1">{(id) => <Input id={id} type="search" placeholder="Filter loaded page" />}</Field>
                  <div className="flex items-end"><Button type="submit">Apply</Button></div>
                </FilterToolbar>
              </div>
              {view === 'chats' ? <ChatList items={chatsFixture} selectedId={chatId} onSelect={openChat} /> : view === 'contacts' ? <ContactList items={contactsFixture} onSelect={() => {}} /> : <LabelList items={labelsFixture} onSelect={() => {}} />}
            </>
          }
        detail={
          <>
            <WorkspacePaneHeader
              className="max-[900px]:hidden"
              title={chat?.displayName ?? 'Message timeline'}
              description={chat ? 'Persisted projection history' : 'Select a projected chat'}
            />
          {chat ? <>
            <div className="flex flex-wrap items-center gap-3 px-4 py-2 border-b border-line text-xs text-fg-3">
              <ConversationUnreadCount count={chat.unreadCount} context="detail" />
              <span>Individual</span>
              <span className="font-mono text-fg-2">{chat.id}</span>
            </div>
            <MessageTimeline items={messagesFixture} selectedId="msg_2" onSelect={() => {}} renderMedia={(message) => {
              if (message.mediaAssetId === 'asset_ready') return <Image src="/ui-image-sample.svg" alt="Projected image message" aspect="video" fit="contain" className="max-w-80" />;
              if (message.mediaAssetId === 'asset_processing') return <ConversationMediaPlaceholder enabled compact label="Image Processing" tone="pending" detail="The projected message remains visible while private content is prepared." />;
              if (message.mediaAssetId === 'asset_failed') return <ConversationMediaPlaceholder enabled compact label="Image unavailable" tone="failed" detail="Media asset integrity failed" />;
              if (message.mediaAssetId === 'asset_expired') return <ConversationMediaPlaceholder enabled compact label="Image unavailable" tone="failed" detail="Media asset expired" />;
              return <ConversationMediaPlaceholder enabled={false} compact label="Image unavailable" tone="neutral" detail="Managed image content was not reported." />;
            }} />
          </> : null}
          </>
        }
        detailFooter={chat ? <ApiProvider session={{ baseUrl: 'http://127.0.0.1:1', apiKey: 'preview-only', keyKind: 'api', connectedAt: new Date().toISOString() }}><Composer chatId={chat.id} recipient={chat.addressingJid ?? chat.id} chatName={chat.displayName ?? 'Unknown chat'} enabled mediaEnabled /></ApiProvider> : undefined}
        />
      </WorkspacePageFrame>
    </main>
  );
}
