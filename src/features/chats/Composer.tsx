import { useState } from 'react';
import { Link } from 'react-router-dom';
import { InlineError } from '@/components/InlineError';
import { useResilientReadState } from '@/lib/query-state';
import { useMessagingInstance, useRequestInstanceReconnect, useSendMediaMessage, useSendTextMessage } from './hooks';
import { MediaAttachDialog } from './MediaAttachDialog';

export function Composer({ instanceId, chatId, chatName }: {
  instanceId: string;
  chatId: string;
  chatName: string;
}) {
  const [text, setText] = useState('');
  const [attachOpen, setAttachOpen] = useState(false);
  const instance = useMessagingInstance(instanceId);
  const send = useSendTextMessage(instanceId);
  const sendMedia = useSendMediaMessage(instanceId);
  const reconnect = useRequestInstanceReconnect(instanceId);
  const instanceReadState = useResilientReadState(instance, instance.data?.resource !== undefined);
  const connected = instance.data?.resource?.status?.toLocaleLowerCase() === 'connected';

  if (instanceReadState.isInitialError) {
    return <InlineError error={instanceReadState.error} onRetry={() => { void instance.refetch(); }} className="composer-error" />;
  }

  if (!instance.isLoading && !connected) {
    return (
      <div className="composer-disconnected">
        {instanceReadState.isStaleError && <InlineError error={instanceReadState.error} onRetry={() => { void instance.refetch(); }} />}
        {reconnect.isError && <InlineError error={reconnect.error} onRetry={() => reconnect.mutate()} className="composer-error" announce />}
        <div className="composer-warn" role="status">
          <span>Sends are unavailable while this instance is disconnected.</span>
          <div className="composer-warn-actions">
            <button className="btn" type="button" disabled={reconnect.isPending} onClick={() => reconnect.mutate()}>{reconnect.isPending ? 'Requesting…' : 'Request reconnect'}</button>
            <Link to={`/instances/${encodeURIComponent(instanceId)}`}>Manage instance</Link>
          </div>
        </div>
      </div>
    );
  }

  const canSend = connected && text.trim().length > 0 && !send.isPending;
  const submit = () => {
    if (!canSend) return;
    send.mutate({ chatId, text: text.trim() }, { onSuccess: () => setText('') });
  };

  return (
    <>
      {instanceReadState.isStaleError && <InlineError error={instanceReadState.error} onRetry={() => { void instance.refetch(); }} />}
      {send.isError && <InlineError error={send.error} onRetry={submit} className="composer-error" announce />}
      <form className="composer" aria-label="Send a direct message" onSubmit={(event) => { event.preventDefault(); submit(); }}>
        <button className="btn attach-button" type="button" disabled={!connected || send.isPending || sendMedia.isPending} title="Attach media" aria-label="Attach media" onClick={() => setAttachOpen(true)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m20.5 11.5-8.8 8.8a6 6 0 0 1-8.5-8.5l9.4-9.4a4 4 0 0 1 5.7 5.7l-9.4 9.4a2 2 0 0 1-2.8-2.8l8.8-8.8" /></svg>
        </button>
        <label className="composer-field" htmlFor="message-compose">
          <span className="visually-hidden">Message {chatName}</span>
          <textarea
            className="input"
            id="message-compose"
            rows={1}
            placeholder={`Message ${chatName}…`}
            value={text}
            disabled={!connected || send.isPending}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== 'Enter' || event.shiftKey) return;
              event.preventDefault();
              submit();
            }}
          />
        </label>
        <button className="btn primary" type="submit" disabled={!canSend}>{send.isPending ? 'Sending…' : 'Send'}</button>
      </form>
      <p className="composer-note">Command outcome appears immediately; delivery status remains separate and updates in history.</p>
      {attachOpen && (
        <MediaAttachDialog
          error={sendMedia.error}
          isPending={sendMedia.isPending}
          onCancel={() => { sendMedia.reset(); setAttachOpen(false); }}
          onSubmit={(values) => sendMedia.mutate({ chatId, ...values }, { onSuccess: () => setAttachOpen(false) })}
        />
      )}
    </>
  );
}
