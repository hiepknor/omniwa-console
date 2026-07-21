import { useId, useRef, useState } from 'react';
import type { InstanceCreateRequest } from '@/api/instances';
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
  onCreate: (body: InstanceCreateRequest) => void;
}) {
  const [instanceId, setInstanceId] = useState('');
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const descriptionId = useId();
  const trimmedId = instanceId.trim();

  const submit = () => {
    if (!trimmedId) return;
    onCreate({ instanceId: trimmedId, name: name.trim() || undefined });
  };

  return (
    <ModalDialog
      titleId="create-instance-title"
      eyebrow="Instance command"
      title="New instance"
      onClose={onCancel}
      canClose={!isPending}
      busy={isPending}
      initialFocusRef={inputRef}
      onSubmit={(event) => { event.preventDefault(); submit(); }}
      closeLabel="Close new instance dialog"
      describedBy={descriptionId}
      secondaryAction={<button className="btn" type="button" onClick={onCancel} disabled={isPending}>Cancel</button>}
      primaryAction={<button className="btn primary" type="submit" disabled={!trimmedId || isPending}>{isPending ? 'Submitting…' : 'Create instance'}</button>}
    >
      <p className="dialog-sheet-copy" id={descriptionId}>Choose a stable instance ID, then open the instance to begin QR pairing.</p>
      <div className="field">
        <label htmlFor="new-instance-id">Instance ID</label>
        <input ref={inputRef} className="input" id="new-instance-id" value={instanceId} onChange={(event) => setInstanceId(event.target.value)} disabled={isPending} autoComplete="off" placeholder="e.g. sales-bot" />
      </div>
      <div className="field">
        <label htmlFor="new-instance-name">Display name (optional)</label>
        <input className="input" id="new-instance-name" value={name} onChange={(event) => setName(event.target.value)} disabled={isPending} autoComplete="off" />
      </div>
      {error !== undefined && error !== null && <InlineError error={error} onRetry={submit} announce />}
    </ModalDialog>
  );
}
