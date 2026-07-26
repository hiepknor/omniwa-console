import { useState } from 'react';
import { ChatList, MessageTimeline } from '@/features/conversations/ConversationsView';
import { Button, Field, Input, PageHeader, Status, Tabs, Textarea } from '@/ui';
import { chatsFixture, messagesFixture } from './preview-fixtures';

/** Dev-only: Conversations workspace (directory + thread) with sample data. */
export function PreviewConversations() {
  const [view, setView] = useState('chats');
  const [chatId, setChatId] = useState<string | undefined>(chatsFixture[0].id);
  const chat = chatsFixture.find((c) => c.id === chatId);
  return (
    <main className="flex flex-col h-dvh overflow-hidden bg-bg">
      <div className="px-6 max-sm:px-4">
        <PageHeader eyebrow="Messaging" title="Conversations" description="Projection-backed chats, messages, contacts, labels, and bounded sends." actions={<Button>Refresh</Button>} />
      </div>
      <div className="flex-1 min-h-0 grid grid-cols-[320px_minmax(0,1fr)] border-t border-line max-[900px]:grid-cols-1">
        <section className={`flex flex-col min-h-0 border-r border-line ${chat ? 'max-[900px]:hidden' : ''}`}>
          <div className="shrink-0 border-b border-line">
            <Tabs active={view} onChange={setView} tabs={[{ id: 'chats', label: 'Chats' }, { id: 'contacts', label: 'Contacts' }, { id: 'labels', label: 'Labels' }]} />
            <form className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 p-3" onSubmit={(e) => e.preventDefault()}>
              <Field label="Search">{(id) => <Input id={id} type="search" placeholder="Filter loaded page" />}</Field>
              <div className="flex items-end"><Button type="submit">Apply</Button></div>
            </form>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto">
            <ChatList items={chatsFixture} selectedId={chatId} onSelect={setChatId} />
          </div>
        </section>

        <section className={`flex flex-col min-h-0 ${chat ? '' : 'max-[900px]:hidden'}`}>
          <header className="shrink-0 flex items-center justify-between gap-3 min-h-[57px] px-4 border-b border-line">
            <div className="grid min-w-0">
              <strong className="truncate text-sm font-semibold text-fg">{chat?.displayName ?? 'Message timeline'}</strong>
              <span className="text-xs text-fg-3">{chat ? 'Persisted projection history' : 'Select a projected chat'}</span>
            </div>
            {chat ? <Button className="hidden max-[900px]:inline-flex" onClick={() => setChatId(undefined)}>Back</Button> : null}
          </header>
          {chat ? <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="flex flex-wrap items-center gap-3 px-4 py-2 border-b border-line text-xs text-fg-3">
              <Status tone="pending">{chat.unreadCount} unread</Status>
              <span>Individual</span>
              <span className="font-mono text-fg-2">{chat.id}</span>
            </div>
            <MessageTimeline items={messagesFixture} selectedId="msg_2" onSelect={() => {}} />
          </div> : null}
          {chat ? <div className="shrink-0 grid gap-2 p-4 border-t border-line bg-surface">
            <Field label={`Message ${chat.displayName}`}>{(id) => <Textarea id={id} rows={3} placeholder="Type a message…" />}</Field>
            <div className="flex justify-end gap-2">
              <Button>Media URL…</Button>
              <Button variant="primary">Send text</Button>
            </div>
          </div> : null}
        </section>
      </div>
    </main>
  );
}
