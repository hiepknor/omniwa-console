import { useState } from 'react';
import { Link } from 'react-router-dom';
import { InlineError } from '@/components/InlineError';
import { useSendTextMessage } from './hooks';

export function Composer({ instanceId, token, instanceStatus, chatId, chatName }: {
  instanceId: string;
  token: string;
  instanceStatus: string | undefined;
  chatId: string;
  chatName: string;
}) {
  const [text, setText] = useState('');
  const send = useSendTextMessage(instanceId, token);
  const connected = instanceStatus?.toLocaleLowerCase() === 'connected';

  if (!connected) {
    return (
      <div className="composer-disconnected">
        <div className="composer-warn" role="status">
          <span>Sends are unavailable while this instance is disconnected.</span>
          <div className="composer-warn-actions">
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
      {send.isError && <><InlineError error={send.error} onRetry={submit} allowRetry={false} className="composer-error" announce /><p className="composer-note">Send outcome is uncertain. Check projected history before submitting again.</p></>}
      <form className="composer" aria-label="Send a text message" onSubmit={(event) => { event.preventDefault(); submit(); }}>
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
              if (event.key !== 'Enter' || event.shiftKey || window.matchMedia('(hover: none) and (pointer: coarse)').matches) return;
              event.preventDefault();
              submit();
            }}
          />
        </label>
        <button className="btn primary composer-send" type="submit" disabled={!canSend} aria-label={send.isPending ? 'Sending message' : 'Send message'}>
          <span className="composer-send-label">{send.isPending ? 'Sending…' : 'Send'}</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 4 17 8-17 8 3-8-3-8Z" /><path d="M7 12h14" /></svg>
        </button>
      </form>
      <p className="composer-note">Acknowledgement is not delivery. Persisted status and receipts update independently in history.</p>
    </>
  );
}
