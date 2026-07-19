import { useEffect, useRef, useState } from 'react';
import { InlineError } from '@/components/InlineError';
import type { WebhookRequest } from '@/api/webhooks';

function parseEventTypes(value: string): string[] {
  return [...new Set(value.split(',').map((item) => item.trim()).filter(Boolean))];
}

export function RegisterWebhookDialog({ error, isPending, onCancel, onRegister }: {
  error: unknown;
  isPending: boolean;
  onCancel: () => void;
  onRegister: (body: WebhookRequest) => void;
}) {
  const [url, setUrl] = useState('');
  const [eventTypes, setEventTypes] = useState('');
  const [validation, setValidation] = useState<string>();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape' && !isPending) onCancel(); };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [isPending, onCancel]);

  const submit = () => {
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error();
    } catch {
      setValidation('Enter a valid HTTP or HTTPS URL.');
      return;
    }
    setValidation(undefined);
    const events = parseEventTypes(eventTypes);
    onRegister({ url: url.trim(), ...(events.length ? { eventTypes: events } : {}) });
  };

  return (
    <div className="overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !isPending) onCancel(); }}>
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="register-webhook-title">
        <header><b id="register-webhook-title">Register webhook</b><span className="mono">registerWebhook</span></header>
        <form onSubmit={(event) => { event.preventDefault(); submit(); }}>
          <div className="body">
            <p className="dialog-sheet-copy">Register an endpoint. The platform processes the request asynchronously.</p>
            <div className="field">
              <label htmlFor="webhook-url">Endpoint URL</label>
              <input ref={inputRef} className="input" id="webhook-url" type="text" inputMode="url" required value={url} onChange={(event) => { setUrl(event.target.value); setValidation(undefined); }} disabled={isPending} placeholder="https://example.com/webhooks" aria-describedby={validation ? 'webhook-url-error' : undefined} aria-invalid={validation !== undefined} />
              {validation && <span className="field-error" id="webhook-url-error" role="alert">{validation}</span>}
            </div>
            <div className="field">
              <label htmlFor="webhook-events">Event types <span className="muted">optional, comma-separated</span></label>
              <textarea className="input webhook-event-input" id="webhook-events" value={eventTypes} onChange={(event) => setEventTypes(event.target.value)} disabled={isPending} placeholder="message.delivered, message.failed" />
            </div>
            {error != null && <InlineError error={error} onRetry={submit} announce />}
          </div>
          <footer><button className="btn" type="button" onClick={onCancel} disabled={isPending}>Cancel</button><button className="btn primary" type="submit" disabled={!url.trim() || isPending}>{isPending ? 'Submitting…' : 'Register webhook'}</button></footer>
        </form>
      </div>
    </div>
  );
}
