import { useEffect, useState } from 'react';
import type { GroupCreateRequest } from '@/api/groups';
import { ApiFailureNotice, Button, Dialog, Field } from '@/components/v2';

export function CreateGroupV2({ open, pending, error, onCreate, onClose }: { open: boolean; pending: boolean; error: unknown; onCreate: (body: GroupCreateRequest) => void; onClose: () => void }) {
  const [name, setName] = useState('');
  const [participants, setParticipants] = useState('');
  useEffect(() => { if (!open) { setName(''); setParticipants(''); } }, [open]);
  if (!open) return null;
  const parsed = participants.split(/[\n,]/u).map((value) => value.trim()).filter(Boolean);
  const submit = () => { if (name.trim() && parsed.length && !pending) onCreate({ name: name.trim(), participants: parsed }); };
  return <Dialog titleId="create-group-v2" eyebrow="Group command" title="Create group" description="Create a group with its initial participants. The refreshed projection remains authoritative." canClose={!pending} onClose={onClose} actions={<><Button disabled={pending} onClick={onClose}>Cancel</Button><Button variant="primary" disabled={!name.trim() || !parsed.length || pending} onClick={submit}>{pending ? 'Submitting…' : 'Create group'}</Button></>}>
    <Field label="Group name" value={name} autoComplete="off" autoFocus disabled={pending} onChange={(event) => setName(event.target.value)} />
    <label className="ui-v2-field"><span className="ui-v2-field__label">Initial participants</span><textarea className="ui-v2-input ui-v2-textarea" rows={4} value={participants} disabled={pending} placeholder="One phone or JID per line" onChange={(event) => setParticipants(event.target.value)} /><span className="ui-v2-field__hint">{parsed.length} participant{parsed.length === 1 ? '' : 's'}. Comma-separated values are also accepted.</span></label>
    {error ? <ApiFailureNotice error={error} command /> : null}
  </Dialog>;
}
