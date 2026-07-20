import { useId, useRef, useState } from 'react';
import { InlineError } from '@/components/InlineError';
import { ModalDialog } from '@/components/dialog/ModalDialog';
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
  const descriptionId = useId();

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
    <ModalDialog titleId="register-webhook-title" eyebrow="Webhook command" title="Register webhook" onClose={onCancel} canClose={!isPending} busy={isPending} initialFocusRef={inputRef} onSubmit={(event) => { event.preventDefault(); submit(); }} closeLabel="Close register webhook dialog" describedBy={descriptionId} secondaryAction={<button className="btn" type="button" onClick={onCancel} disabled={isPending}>Cancel</button>} primaryAction={<button className="btn primary" type="submit" disabled={!url.trim() || isPending}>{isPending ? 'Submitting…' : 'Register webhook'}</button>}>
      <p className="dialog-sheet-copy" id={descriptionId}>Register an endpoint. The platform reports whether the command completed or continues asynchronously.</p>
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
    </ModalDialog>
  );
}
