import { useState } from 'react';
import { ChatList, MessageTimeline } from '@/features/conversations/ConversationsView';
import { Button, Field, FilterToolbar, Input, SplitWorkspace, Status, Tabs, Textarea, useWorkspacePageFocus, WorkspacePageFrame, WorkspacePaneHeader } from '@/ui';
import { chatsFixture, messagesFixture } from './preview-fixtures';

/** Dev-only: Conversations workspace (directory + thread) with sample data. */
export function PreviewConversations() {
  const [view, setView] = useState('chats');
  const [chatId, setChatId] = useState<string | undefined>(chatsFixture[0].id);
  const chat = chatsFixture.find((c) => c.id === chatId);
  const { compactHeadingRef, rememberFocusOrigin } = useWorkspacePageFocus(chatId);
  const openChat = (id: string) => { rememberFocusOrigin(); setChatId(id); };
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
                <Tabs active={view} onChange={setView} tabs={[{ id: 'chats', label: 'Chats' }, { id: 'contacts', label: 'Contacts' }, { id: 'labels', label: 'Labels' }]} />
                <FilterToolbar as="form" className="border-b-0" onSubmit={(e) => e.preventDefault()}>
                  <Field label="Search" className="min-w-48 flex-1">{(id) => <Input id={id} type="search" placeholder="Filter loaded page" />}</Field>
                  <div className="flex items-end"><Button type="submit">Apply</Button></div>
                </FilterToolbar>
              </div>
              <ChatList items={chatsFixture} selectedId={chatId} onSelect={openChat} />
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
              <Status tone="pending">{chat.unreadCount} unread</Status>
              <span>Individual</span>
              <span className="font-mono text-fg-2">{chat.id}</span>
            </div>
            <MessageTimeline items={messagesFixture} selectedId="msg_2" onSelect={() => {}} />
          </> : null}
          </>
        }
        detailFooter={chat ? <div className="grid gap-2 p-4 border-t border-line bg-surface">
            <Field label={`Message ${chat.displayName}`}>{(id) => <Textarea id={id} rows={3} placeholder="Type a message…" />}</Field>
            <div className="flex justify-end gap-2">
              <Button>Media URL…</Button>
              <Button variant="primary">Send text</Button>
            </div>
          </div> : undefined}
        />
      </WorkspacePageFrame>
    </main>
  );
}
