import { useEffect, useState } from 'react';
import { ApiFailure } from '@/api/envelopes';
import type { GroupCreateRequest } from '@/api/groups';
import { Button, Dialog, Field, Input, StateNotice, Textarea } from '@/ui';

export function CreateGroup({ open, pending, error, onCreate, onClose }: { open: boolean; pending: boolean; error: unknown; onCreate: (body: GroupCreateRequest) => void; onClose: () => void }) {
  const [name, setName] = useState('');
  const [participants, setParticipants] = useState('');
  useEffect(() => { if (!open) { setName(''); setParticipants(''); } }, [open]);
  const parsed = participants.split(/[\n,]/u).map((v) => v.trim()).filter(Boolean);
  const submit = () => { if (name.trim() && parsed.length && !pending) onCreate({ name: name.trim(), participants: parsed }); };
  const failure = error instanceof ApiFailure ? error : undefined;
  return (
    <Dialog
      open={open}
      onClose={onClose}
      closeDisabled={pending}
      title="Create group"
      footer={<><Button disabled={pending} onClick={onClose}>Cancel</Button><Button variant="primary" disabled={!name.trim() || !parsed.length || pending} onClick={submit}>{pending ? 'Submitting…' : 'Create group'}</Button></>}
    >
      <div className="grid gap-3">
        <p className="text-sm text-fg-2">Create a group with its initial participants. The refreshed projection remains authoritative.</p>
        <Field label="Group name">{(id) => <Input id={id} value={name} autoComplete="off" autoFocus disabled={pending} onChange={(e) => setName(e.target.value)} />}</Field>
        <Field label="Initial participants" description={`${parsed.length} participant${parsed.length === 1 ? '' : 's'}. Comma-separated values are also accepted.`}>
          {(id) => <Textarea id={id} rows={4} value={participants} disabled={pending} placeholder="One phone or JID per line" onChange={(e) => setParticipants(e.target.value)} />}
        </Field>
        {failure ? <StateNotice kind="error" title="Command failed" detail={failure.message} requestId={failure.requestId} /> : null}
      </div>
    </Dialog>
  );
}
