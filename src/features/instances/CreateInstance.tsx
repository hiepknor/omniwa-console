import { useEffect, useState } from 'react';
import type { InstanceCredentialSecret } from '@/api/instances';
import { Button, Dialog, Field, IconButton, Input, StateNotice } from '@/ui';
import { FailureNotice } from './ui';

export function CreateInstance({ open, pending, error, created, onCreate, onClose }: {
  open: boolean;
  pending: boolean;
  error: unknown;
  created?: Pick<InstanceCredentialSecret, 'instanceId' | 'token'>;
  onCreate: (name: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [discardOpen, setDiscardOpen] = useState(false);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  useEffect(() => { if (!open) { setName(''); setDiscardOpen(false); setCopyState('idle'); } }, [open]);
  const submit = () => { if (!created && name.trim() && !pending) onCreate(name.trim()); };
  const copyToken = async () => {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created.token);
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
  };
  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        closeDisabled={pending || Boolean(created)}
        title={created ? 'Store the instance token now' : 'Create instance'}
        footer={created
          ? <><IconButton icon={copyState === 'copied' ? 'check' : 'copy'} label={copyState === 'copied' ? 'Token copied' : copyState === 'failed' ? 'Retry copying token' : 'Copy token'} onClick={() => void copyToken()} /><Button variant="danger" onClick={() => setDiscardOpen(true)}>Discard without storing…</Button><Button variant="primary" onClick={onClose}>I stored the token</Button></>
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
              <p aria-live="polite" className="text-xs text-fg-3">{copyState === 'copied' ? 'Token copied to clipboard.' : copyState === 'failed' ? 'Copy failed. Select the token field and copy it manually.' : 'Copying does not confirm durable storage.'}</p>
              <p className="text-xs text-fg-3">Instance <code className="font-mono">{created.instanceId}</code>. Reload or ending the Console session clears the in-memory token.</p>
            </>
          ) : (
            <Field label="Display name">
              {(id) => <Input id={id} value={name} autoComplete="off" autoFocus disabled={pending} placeholder="Sales bot" onChange={(e) => setName(e.target.value)} />}
            </Field>
          )}
          {error ? <FailureNotice error={error} command /> : null}
        </div>
      </Dialog>
      <Dialog
        open={discardOpen}
        onClose={() => setDiscardOpen(false)}
        title="Discard the one-time token?"
        footer={<><Button onClick={() => setDiscardOpen(false)}>Keep token visible</Button><Button variant="danger" onClick={onClose}>Discard token</Button></>}
      >
        <p className="text-sm text-fg-2">Console will close this one-time reveal. The token cannot be displayed again, although the in-memory session remains available until reload or the Console session ends.</p>
      </Dialog>
    </>
  );
}
