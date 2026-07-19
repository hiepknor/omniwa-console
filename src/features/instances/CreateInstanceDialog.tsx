import { useRef, useState } from 'react';
import { InlineError } from '@/components/InlineError';
import { useModalDialog } from '@/components/useModalDialog';

export function CreateInstanceDialog({
  error,
  isPending,
  onCancel,
  onCreate,
}: {
  error: unknown;
  isPending: boolean;
  onCancel: () => void;
  onCreate: (displayName: string) => void;
}) {
  const [displayName, setDisplayName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const dialogRef = useModalDialog<HTMLDivElement>({ onClose: onCancel, canClose: !isPending, initialFocusRef: inputRef });

  return (
    <div className="overlay !z-[60]" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !isPending) onCancel();
    }}>
      <div ref={dialogRef} className="dialog" role="dialog" aria-modal="true" aria-labelledby="create-instance-title" tabIndex={-1}>
        <header><b id="create-instance-title">New instance</b><span className="mono">createInstance</span></header>
        <form onSubmit={(event) => {
          event.preventDefault();
          onCreate(displayName.trim());
        }}>
          <div className="body">
            <p className="dialog-sheet-copy">Create an instance, then open it to begin the pairing workflow.</p>
            <div className="field">
              <label htmlFor="new-instance-name">Display name</label>
              <input
                ref={inputRef}
                className="input"
                id="new-instance-name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                disabled={isPending}
                autoComplete="off"
              />
            </div>
            {error !== undefined && error !== null && <InlineError error={error} onRetry={() => onCreate(displayName.trim())} announce />}
          </div>
          <footer>
            <button className="btn" type="button" onClick={onCancel} disabled={isPending}>Cancel</button>
            <button className="btn primary" type="submit" disabled={!displayName.trim() || isPending}>
              {isPending ? 'Submitting…' : 'Create instance'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
