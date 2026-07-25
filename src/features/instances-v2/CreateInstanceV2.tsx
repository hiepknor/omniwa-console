import { useEffect, useState } from 'react';
import type { InstanceCredentialSecret } from '@/api/instances';
import { Button, Dialog, Field, StateNotice } from '@/components/v2';
import { FailureNotice } from './ui';

export function CreateInstanceV2({ open, pending, error, created, onCreate, onClose }: {
  open: boolean;
  pending: boolean;
  error: unknown;
  created?: Pick<InstanceCredentialSecret, 'instanceId' | 'token'>;
  onCreate: (name: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  useEffect(() => { if (!open) setName(''); }, [open]);
  if (!open) return null;
  const submit = () => { if (!created && name.trim() && !pending) onCreate(name.trim()); };
  return (
    <Dialog
      titleId="create-instance-v2"
      eyebrow="Instance command"
      title={created ? 'Store the instance token now' : 'Create instance'}
      description={created ? 'This token is shown once. Store it in the integration secret manager before continuing.' : 'OmniWA GO generates the instance ID and per-instance token. Console holds the result in memory only.'}
      canClose={!pending && !created}
      onClose={onClose}
      actions={created
        ? <Button variant="primary" onClick={onClose}>I stored the token</Button>
        : <><Button onClick={onClose} disabled={pending}>Cancel</Button><Button variant="primary" onClick={submit} disabled={!name.trim() || pending}>{pending ? 'Creating…' : 'Create instance'}</Button></>}
    >
      {created ? <>
        <StateNotice value={{ axis: 'command', state: 'acknowledged' }} detail="The server created the instance. This acknowledgement does not prove pairing or connectivity." />
        <Field label="One-time instance token" value={created.token} readOnly autoComplete="off" spellCheck={false} onFocus={(event) => event.currentTarget.select()} />
        <p className="ui-v2-generated-note">Instance <code>{created.instanceId}</code>. Reload or sign-out clears the in-memory token.</p>
      </> : <Field label="Display name" value={name} autoComplete="off" autoFocus disabled={pending} placeholder="Sales bot" onChange={(event) => setName(event.target.value)} />}
      {error ? <FailureNotice error={error} command /> : null}
    </Dialog>
  );
}
