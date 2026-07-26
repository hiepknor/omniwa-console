import { useEffect, useState } from 'react';
import type { InstanceCredentialSecret } from '@/api/instances';
import { Button, Dialog, Field, Input, StateNotice } from '@/ui';
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
  const submit = () => { if (!created && name.trim() && !pending) onCreate(name.trim()); };
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={created ? 'Store the instance token now' : 'Create instance'}
      footer={created
        ? <Button variant="primary" onClick={onClose}>I stored the token</Button>
        : <><Button onClick={onClose} disabled={pending}>Cancel</Button><Button variant="primary" onClick={submit} disabled={!name.trim() || pending}>{pending ? 'Creating…' : 'Create instance'}</Button></>}
    >
      <div className="grid gap-3">
        <p className="text-sm text-fg-2">
          {created
            ? 'This token is shown once. Store it in the integration secret manager before continuing.'
            : 'OmniWA GO generates the instance ID and per-instance token. Console holds the result in memory only.'}
        </p>
        {created ? (
          <>
            <StateNotice kind="info" title="Instance created" detail="This acknowledgement does not prove pairing or connectivity." />
            <Field label="One-time instance token">
              {(id) => <Input id={id} value={created.token} readOnly autoComplete="off" spellCheck={false} onFocus={(e) => e.currentTarget.select()} />}
            </Field>
            <p className="text-xs text-fg-3">Instance <code className="font-mono">{created.instanceId}</code>. Reload or sign-out clears the in-memory token.</p>
          </>
        ) : (
          <Field label="Display name">
            {(id) => <Input id={id} value={name} autoComplete="off" autoFocus disabled={pending} placeholder="Sales bot" onChange={(e) => setName(e.target.value)} />}
          </Field>
        )}
        {error ? <FailureNotice error={error} command /> : null}
      </div>
    </Dialog>
  );
}
