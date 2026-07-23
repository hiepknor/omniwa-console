import { useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { hasCapability } from '@/api/capabilities';
import { useInstanceCapabilities } from '@/api/CapabilitiesProvider';
import { InlineError } from '@/components/InlineError';
import { ProjectionNotice } from '@/components/ProjectionNotice';
import { RealtimeIndicator } from '@/components/RealtimeIndicator';
import { useResilientReadState } from '@/lib/query-state';
import { dismissVirtualKeyboard, useVisualViewport } from '@/lib/useVisualViewport';
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
  const workspaceRef = useRef<HTMLDivElement>(null);
  useVisualViewport(workspaceRef);
  const { instanceId, chatId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const picker = usePickerInstances();
  const selectedInstance = picker.data?.resource?.items.find((instance) => instance.id === instanceId);
  const contactId = searchParams.get('directory') === 'contacts' ? chatId : undefined;
  const labelId = searchParams.get('directory') === 'labels' ? chatId : undefined;
  const directoryResourceId = contactId ?? labelId;
  const capabilities = useInstanceCapabilities(instanceId, selectedInstance?.token);
  const chatsEnabled = hasCapability(capabilities.data, 'chats_projection');
  const chat = useChat(instanceId, directoryResourceId ? undefined : chatId, selectedInstance?.token, chatsEnabled);
  const chatReadState = useResilientReadState(chat, chat.data?.resource !== undefined);
  const selectedChat = chat.data?.resource;
  const requestedPane = searchParams.get('pane');
  const contextMode = searchParams.has('message') ? 'message' : 'contact';
  const activePane: ChatPane = !chatId
    ? 'conversations'
    : requestedPane === 'conversations' || requestedPane === 'context'
      ? requestedPane
      : 'thread';

  const setActivePane = (pane: ChatPane) => {
    if (!chatId && pane !== 'conversations') return;
    const next = new URLSearchParams(searchParams);
    if (pane === (chatId ? 'thread' : 'conversations')) next.delete('pane');
    else next.set('pane', pane);
    setSearchParams(next);
  };
  const openContactContext = () => {
    if (!chatId) return;
    dismissVirtualKeyboard();
    const next = new URLSearchParams(searchParams);
    next.delete('message');
    next.set('pane', 'context');
    setSearchParams(next);
  };

  useEffect(() => {
    if (instanceId !== undefined || picker.data?.resource?.items.length !== 1) return;
    const onlyInstance = picker.data.resource.items[0];
    if (!onlyInstance) return;
    const suffix = searchParams.size > 0 ? `?${searchParams.toString()}` : '';
    navigate(`/chats/${encodeURIComponent(onlyInstance.id)}${suffix}`, { replace: true });
  }, [instanceId, navigate, picker.data, searchParams]);

  const threadTitle = selectedChat?.displayName ?? selectedChat?.id ?? (chatId ? 'Conversation' : 'No conversation selected');
  const threadMeta = selectedChat?.type ?? (chatId && !directoryResourceId ? 'Conversation' : undefined);

  let timeline: React.ReactNode;
  if (!instanceId || !chatId) {
    timeline = <div className="timeline-pane" role="log" aria-label="Message timeline" aria-live="off"><div className="timeline-stack"><div className="chat-calm-state"><span className="eyebrow">Conversation</span><h2>Select a conversation</h2><p>Choose a projected chat to inspect its message timeline.</p></div></div></div>;
  } else if (directoryResourceId) {
    timeline = <div className="timeline-pane" role="region" aria-label="Directory selection"><div className="timeline-stack"><div className="chat-calm-state"><span className="eyebrow">Directory</span><h2>Projection details selected.</h2><p>Review the persisted definition in the context panel.</p></div></div></div>;
  } else if (!chatsEnabled && selectedChat === undefined) {
    timeline = <div className="timeline-pane" role="region" aria-label="Chat projection unavailable"><div className="timeline-stack"><div className="chat-calm-state"><span className="eyebrow">Unavailable</span><h2>Chats are not ready yet.</h2><p>No live WhatsApp lookup will be used as a fallback.</p></div></div></div>;
  } else if (chatReadState.isInitialError) {
    timeline = <div className="timeline-pane" role="log" aria-label="Message timeline" aria-live="off"><div className="timeline-stack"><InlineError error={chatReadState.error} onRetry={() => { void chat.refetch(); }} className="chat-thread-error" /></div></div>;
  } else if (chatReadState.isInitialLoading) {
    timeline = <div className="timeline-pane" role="log" aria-label="Message timeline" aria-live="off"><div className="timeline-stack"><div className="chat-calm-state" aria-live="polite"><span className="eyebrow">Loading</span><h2>Loading conversation details.</h2><p>The conversation read is in progress.</p></div></div></div>;
  } else if (selectedChat === undefined) {
    timeline = <div className="timeline-pane" role="region" aria-label="Chat unavailable"><div className="timeline-stack"><div className="chat-calm-state"><span className="eyebrow">Unavailable</span><h2>Conversation details are unavailable.</h2><p>Refresh the persisted Chat projection before opening message history.</p></div></div></div>;
  } else {
    timeline = <>{chatReadState.isStaleError && <InlineError error={chatReadState.error} onRetry={() => { void chat.refetch(); }} className="chat-thread-error" />}<MessageTimeline instanceId={instanceId} chatId={chatId} /></>;
  }

  return (
    <div ref={workspaceRef} className="workspace workspace--chats" data-active-pane={activePane} data-context-mode={contextMode}>
      <ConversationList instanceId={instanceId} chatId={chatId} />

      <section className="thread" id="chat-thread" aria-labelledby="chat-title">
        <header className="head">
          <button className="btn sm chat-mobile-back chat-icon-action" type="button" aria-label="Back to chats" aria-controls="chat-conversations" onClick={() => setActivePane('conversations')}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
          </button>
          {chatId && <span className="thread-avatar" aria-hidden="true">{avatarInitials(selectedChat?.displayName)}</span>}
          <div className="t"><h1 id="chat-title">{threadTitle}</h1>{threadMeta && <span className="head-meta">{threadMeta}</span>}</div>
          <div className="spacer" />
          <RealtimeIndicator />
          {chatId && !directoryResourceId && <button className="btn sm contact-toggle chat-icon-action" type="button" data-pane-target="context" aria-label="Open contact details" aria-controls="chat-context" onClick={openContactContext}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5h.01" /></svg>
          </button>}
        </header>
        {selectedChat && <ProjectionNotice meta={chat.data?.meta} />}
        {timeline}
      </section>

      {activePane === 'context' && <button className="chat-context-backdrop" type="button" aria-label="Close details" onClick={() => setActivePane(directoryResourceId ? 'conversations' : 'thread')} />}
      <ContextPanel instanceId={instanceId} token={selectedInstance?.token} contactId={contactId} labelId={labelId} chat={selectedChat} onBack={() => setActivePane(directoryResourceId ? 'conversations' : 'thread')} />
    </div>
  );
}
