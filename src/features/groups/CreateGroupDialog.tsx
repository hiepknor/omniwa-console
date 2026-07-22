import { useId, useRef, useState } from 'react';
import type { GroupCreateRequest } from '@/api/groups';
import { InlineError } from '@/components/InlineError';
import { ModalDialog } from '@/components/dialog/ModalDialog';

export function CreateGroupDialog({
  error,
  isPending,
  onCancel,
  onCreate,
}: {
  error: unknown;
  isPending: boolean;
  onCancel: () => void;
  onCreate: (body: GroupCreateRequest) => void;
}) {
  const [name, setName] = useState('');
  const [participants, setParticipants] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const descriptionId = useId();
  const trimmedName = name.trim();
  const parsedParticipants = participants
    .split(/[\n,]/)
    .map((value) => value.trim())
    .filter(Boolean);
  const canSubmit = Boolean(trimmedName) && parsedParticipants.length > 0;

  const submit = () => { if (canSubmit) onCreate({ name: trimmedName, participants: parsedParticipants }); };

  return (
    <ModalDialog
      titleId="create-group-title"
      eyebrow="Group command"
      title="New group"
      onClose={onCancel}
      canClose={!isPending}
      busy={isPending}
      initialFocusRef={inputRef}
      onSubmit={(event) => { event.preventDefault(); submit(); }}
      closeLabel="Close new group dialog"
      describedBy={descriptionId}
      secondaryAction={<button className="btn" type="button" onClick={onCancel} disabled={isPending}>Cancel</button>}
      primaryAction={<button className="btn primary" type="submit" disabled={!canSubmit || isPending}>{isPending ? 'Submitting…' : 'Create group'}</button>}
    >
      <p className="dialog-sheet-copy" id={descriptionId}>Create a group and add the first participants. They are notified on WhatsApp.</p>
      <div className="field">
        <label htmlFor="new-group-name">Group name</label>
        <input ref={inputRef} className="input" id="new-group-name" value={name} onChange={(event) => setName(event.target.value)} disabled={isPending} autoComplete="off" placeholder="e.g. Sales team" />
      </div>
      <div className="field">
        <label htmlFor="new-group-participants">Participants</label>
        <textarea id="new-group-participants" className="input groups-textarea" rows={4} value={participants} disabled={isPending} onChange={(event) => setParticipants(event.target.value)} placeholder="One phone number per line (or comma-separated)" />
        <p className="help">{parsedParticipants.length} participant{parsedParticipants.length === 1 ? '' : 's'}</p>
      </div>
      {error !== undefined && error !== null && <InlineError error={error} onRetry={submit} announce />}
    </ModalDialog>
  );
}
