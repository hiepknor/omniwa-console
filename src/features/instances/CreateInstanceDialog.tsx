import { useRef, useState } from 'react';
import { InlineError } from '@/components/InlineError';
import { ModalDialog } from '@/components/dialog/ModalDialog';

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

  return (
    <ModalDialog
      titleId="create-instance-title"
      eyebrow="Instance command"
      title="New instance"
      context="createInstance"
      onClose={onCancel}
      canClose={!isPending}
      initialFocusRef={inputRef}
      onSubmit={(event) => { event.preventDefault(); onCreate(displayName.trim()); }}
      closeLabel="Close new instance dialog"
      footer={<><button className="btn" type="button" onClick={onCancel} disabled={isPending}>Cancel</button><button className="btn primary" type="submit" disabled={!displayName.trim() || isPending}>{isPending ? 'Submitting…' : 'Create instance'}</button></>}
    >
      <p className="dialog-sheet-copy">Create an instance, then open it to begin the pairing workflow.</p>
      <div className="field">
        <label htmlFor="new-instance-name">Display name</label>
        <input ref={inputRef} className="input" id="new-instance-name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} disabled={isPending} autoComplete="off" />
      </div>
      {error !== undefined && error !== null && <InlineError error={error} onRetry={() => onCreate(displayName.trim())} announce />}
    </ModalDialog>
  );
}
