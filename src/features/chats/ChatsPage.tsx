import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { InlineError } from '@/components/InlineError';
import { RealtimeIndicator } from '@/components/RealtimeIndicator';
import { Composer } from './Composer';
import { ContextPanel } from './ContextPanel';
import { ConversationList } from './ConversationList';
import { MessageTimeline } from './MessageTimeline';
import { useChat, usePickerInstances } from './hooks';

type ChatPane = 'conversations' | 'thread' | 'context';

function avatarInitials(name: string | undefined) {
  if (!name?.trim()) return '—';
  const words = name.trim().split(/\s+/u);
  return `${words[0]?.[0] ?? ''}${words.length > 1 ? words.at(-1)?.[0] ?? '' : ''}`.toUpperCase();
}

export function ChatsPage() {
  const { instanceId, chatId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const picker = usePickerInstances();
  const chat = useChat(chatId);
  const [activePane, setActivePane] = useState<ChatPane>(chatId ? 'thread' : 'conversations');
  const selectedChat = chat.data?.resource;

  useEffect(() => {
    if (instanceId !== undefined || picker.data?.resource?.items.length !== 1) return;
    const onlyInstance = picker.data.resource.items[0];
    if (!onlyInstance) return;
    const suffix = searchParams.size > 0 ? `?${searchParams.toString()}` : '';
    navigate(`/chats/${encodeURIComponent(onlyInstance.id)}${suffix}`, { replace: true });
  }, [instanceId, navigate, picker.data, searchParams]);

  const threadTitle = selectedChat?.displayName ?? selectedChat?.id ?? (chatId ? 'Conversation' : 'No conversation selected');
  const threadId = selectedChat?.id ?? chatId;

  let timeline: React.ReactNode;
  if (!instanceId || !chatId) {
    timeline = <div className="timeline-pane" role="log" aria-label="Message timeline" aria-live="off"><div className="timeline-stack"><div className="chat-calm-state"><span className="eyebrow">Conversation</span><h2>Select a conversation</h2><p>Choose a direct chat to inspect its message timeline.</p></div></div></div>;
  } else if (chat.data?.unavailable) {
    timeline = <div className="timeline-pane" role="log" aria-label="Message timeline" aria-live="off"><div className="timeline-stack"><div className="chat-calm-state"><span className="eyebrow">Data pending</span><h2>Conversation details are not available yet.</h2><p>No failure has been reported. This read remains pending.</p></div></div></div>;
  } else if (chat.isError) {
    timeline = <div className="timeline-pane" role="log" aria-label="Message timeline" aria-live="off"><div className="timeline-stack"><InlineError error={chat.error} onRetry={() => { void chat.refetch(); }} className="chat-thread-error" /></div></div>;
  } else if (chat.isLoading) {
    timeline = <div className="timeline-pane" role="log" aria-label="Message timeline" aria-live="off"><div className="timeline-stack"><div className="chat-calm-state" aria-live="polite"><span className="eyebrow">Loading</span><h2>Loading conversation details.</h2><p>The conversation read is in progress.</p></div></div></div>;
  } else {
    timeline = <MessageTimeline instanceId={instanceId} chatId={chatId} />;
  }

  return (
    <div className="workspace workspace--chats" data-active-pane={activePane}>
      <nav className="chat-pane-switcher" aria-label="Chat workspace panes">
        {(['conversations', 'thread', 'context'] as const).map((pane) => (
          <button
            key={pane}
            type="button"
            aria-controls={`chat-${pane}`}
            aria-pressed={activePane === pane}
            onClick={() => setActivePane(pane)}
          >
            {pane[0]?.toUpperCase()}{pane.slice(1)}
          </button>
        ))}
      </nav>

      <ConversationList instanceId={instanceId} chatId={chatId} onOpenThread={() => setActivePane('thread')} />

      <section className="thread" id="chat-thread" aria-labelledby="chat-title">
        <header className="head">
          <span className="thread-avatar" aria-hidden="true">{avatarInitials(selectedChat?.displayName)}</span>
          <div className="t"><h1 id="chat-title">{threadTitle}</h1>{threadId && threadId !== threadTitle && <span className="mono">{threadId}</span>}</div>
          <div className="spacer" />
          <RealtimeIndicator />
          {chatId && <button className="btn sm contact-toggle" type="button" data-pane-target="context" aria-controls="chat-context" onClick={() => setActivePane('context')}>Contact</button>}
        </header>
        {timeline}
        {instanceId && chatId && !chat.isLoading && !chat.isError && !chat.data?.unavailable && (
          <Composer instanceId={instanceId} chatId={chatId} chatName={threadTitle} />
        )}
      </section>

      <ContextPanel instanceId={instanceId} chat={selectedChat} onBack={() => setActivePane('thread')} />
    </div>
  );
}
