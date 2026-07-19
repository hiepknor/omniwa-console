import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { InlineError } from '@/components/InlineError';

export function TypedConfirmationDialog({
  title,
  description,
  resourceId,
  confirmValue,
  confirmLabel,
  pendingLabel,
  error,
  isPending,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: ReactNode;
  resourceId: string;
  confirmValue: string;
  confirmLabel: string;
  pendingLabel: string;
  error?: unknown;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [confirmation, setConfirmation] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const inputId = useId();

  useEffect(() => {
    inputRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isPending) onCancel();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [isPending, onCancel]);

  return (
    <div
      className="overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isPending) onCancel();
      }}
    >
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header>
          <b id={titleId}>{title}</b>
          <span className="mono">{resourceId}</span>
        </header>
        <div className="body">
          <div className="dialog-sheet-copy">{description}</div>
          <div className="field">
            <label htmlFor={inputId}>
              Type <span className="mono dialog-sheet-confirm-name">{confirmValue}</span> to confirm
            </label>
            <input
              ref={inputRef}
              className="input"
              id={inputId}
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              disabled={isPending}
              autoComplete="off"
            />
          </div>
          {error !== undefined && error !== null && (
            <InlineError error={error} onRetry={onConfirm} announce />
          )}
        </div>
        <footer>
          <button className="btn" type="button" onClick={onCancel} disabled={isPending}>Cancel</button>
          <button
            className="btn danger solid"
            type="button"
            onClick={onConfirm}
            disabled={confirmation !== confirmValue || isPending}
          >
            {isPending ? pendingLabel : confirmLabel}
          </button>
        </footer>
      </div>
    </div>
  );
}
