import { useId, useRef, useState } from 'react';
import type { InstanceCreateRequest } from '@/api/instances';
import { InlineError } from '@/components/InlineError';
import { ModalDialog } from '@/components/dialog/ModalDialog';

export function CreateInstanceDialog({
  error,
  isPending,
  onCancel,
  onCreate,
  created,
}: {
  error: unknown;
  isPending: boolean;
  onCancel: () => void;
  onCreate: (body: InstanceCreateRequest) => void;
  created?: { instanceId: string; token: string };
}) {
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const descriptionId = useId();
  const trimmedName = name.trim();

  const submit = () => { if (!created && trimmedName) onCreate({ name: trimmedName }); };

  return (
    <ModalDialog
      titleId="create-instance-title"
      eyebrow="Instance command"
      title="New instance"
      onClose={onCancel}
      canClose={!isPending && created === undefined}
      showClose={created === undefined}
      busy={isPending}
      initialFocusRef={inputRef}
      onSubmit={(event) => { event.preventDefault(); submit(); }}
      closeLabel="Close new instance dialog"
      describedBy={descriptionId}
      secondaryAction={created ? undefined : <button className="btn" type="button" onClick={onCancel} disabled={isPending}>Cancel</button>}
      primaryAction={created
        ? <button className="btn primary" type="button" onClick={onCancel}>I stored the token</button>
        : <button className="btn primary" type="submit" disabled={!trimmedName || isPending}>{isPending ? 'Submitting…' : 'Create instance'}</button>}
    >
      <p className="dialog-sheet-copy" id={descriptionId}>{created ? 'This access token is shown once. Store it in the integration secret manager, then confirm below. Escape and backdrop dismissal are disabled while the token is visible.' : 'omniwa-go assigns the instance ID and access token automatically. Give it a display name, then open it to begin QR pairing.'}</p>
      {created ? <div className="field"><label htmlFor="new-instance-token">One-time instance token</label><input className="input mono" id="new-instance-token" value={created.token} readOnly autoComplete="off" onFocus={(event) => event.currentTarget.select()} /><small>Instance: <span className="mono">{created.instanceId}</span>. The console keeps this token in memory only until sign-out or reload.</small></div> : <div className="field">
        <label htmlFor="new-instance-name">Display name</label>
        <input ref={inputRef} className="input" id="new-instance-name" value={name} onChange={(event) => setName(event.target.value)} disabled={isPending} autoComplete="off" placeholder="e.g. Sales bot" />
      </div>}
      {error !== undefined && error !== null && <InlineError error={error} onRetry={submit} announce />}
    </ModalDialog>
  );
}
