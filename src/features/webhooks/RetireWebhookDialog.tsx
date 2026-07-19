import { useEffect, useRef, useState } from 'react';
import { InlineError } from '@/components/InlineError';

export function RetireWebhookDialog({ webhookId, error, isPending, onCancel, onConfirm }: {
  webhookId: string;
  error: unknown;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [confirmation, setConfirmation] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape' && !isPending) onCancel(); };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [isPending, onCancel]);
  return <div className="overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !isPending) onCancel(); }}>
    <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="retire-webhook-title">
      <header><b id="retire-webhook-title">Retire webhook</b><span className="mono">{webhookId}</span></header>
      <div className="body"><p className="dialog-sheet-copy">This permanently retires the webhook and stops future deliveries. This cannot be undone.</p><div className="field"><label htmlFor="webhook-retire-confirmation">Type <span className="mono dialog-sheet-confirm-name">{webhookId}</span> to confirm</label><input ref={inputRef} className="input" id="webhook-retire-confirmation" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} disabled={isPending} autoComplete="off" /></div>{error != null && <InlineError error={error} onRetry={onConfirm} announce />}</div>
      <footer><button className="btn" type="button" onClick={onCancel} disabled={isPending}>Cancel</button><button className="btn danger solid" type="button" onClick={onConfirm} disabled={confirmation !== webhookId || isPending}>{isPending ? 'Submitting…' : 'Retire webhook'}</button></footer>
    </div>
  </div>;
}
