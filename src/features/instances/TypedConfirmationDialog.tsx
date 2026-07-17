import { useEffect, useRef, useState } from 'react';
import { InlineError } from '@/components/InlineError';

export function TypedConfirmationDialog({
  action,
  instanceId,
  instanceName,
  error,
  isPending,
  onCancel,
  onConfirm,
}: {
  action: 'disconnect' | 'destroy';
  instanceId: string;
  instanceName: string;
  error: unknown;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [confirmation, setConfirmation] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const title = action === 'destroy' ? 'Destroy instance' : 'Disconnect instance';

  useEffect(() => {
    inputRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isPending) onCancel();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [isPending, onCancel]);

  return (
    <div className="overlay" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !isPending) onCancel();
    }}>
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="instance-confirm-title">
        <header>
          <b id="instance-confirm-title">{title}</b>
          <span className="mono">{instanceId}</span>
        </header>
        <div className="body">
          <p className="dialog-sheet-copy">
            {action === 'destroy'
              ? `This permanently destroys ${instanceName}, its sessions, and pairing state. This cannot be undone.`
              : `This requests a disconnect for ${instanceName}. The platform will process the command asynchronously.`}
          </p>
          <div className="field">
            <label htmlFor="instance-confirmation">
              Type <span className="mono dialog-sheet-confirm-name">{instanceName}</span> to confirm
            </label>
            <input
              ref={inputRef}
              className="input"
              id="instance-confirmation"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              disabled={isPending}
              autoComplete="off"
            />
          </div>
          {error !== undefined && error !== null && <InlineError error={error} onRetry={onConfirm} />}
        </div>
        <footer>
          <button className="btn" type="button" onClick={onCancel} disabled={isPending}>Cancel</button>
          <button
            className="btn danger solid"
            type="button"
            onClick={onConfirm}
            disabled={confirmation !== instanceName || isPending}
          >
            {isPending ? 'Submitting…' : title}
          </button>
        </footer>
      </div>
    </div>
  );
}
