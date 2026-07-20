import { useId, useRef, useState, type FormEvent } from 'react';
import type { ApiKeyResource } from '@/api/api-keys';
import { InlineError } from '@/components/InlineError';
import { SelectDropdown } from '@/components/SelectDropdown';
import { ModalDialog } from '@/components/dialog/ModalDialog';
import { generateApiKeySecret } from '@/lib/secrets';
import { useProvisionApiKey } from './hooks';

type KeyKind = ApiKeyResource['kind'];

const kindOptions = [
  { value: 'api_key', label: 'API key' },
  { value: 'admin_key', label: 'Admin key' },
  { value: 'monitoring_key', label: 'Monitoring key' },
];

function commaList(value: string): string[] {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

export function ProvisionKeyDialog({
  onCancel,
  onProvisioned,
}: {
  onCancel: () => void;
  onProvisioned: (keyId: string, secret: string) => void;
}) {
  const [keyId, setKeyId] = useState('');
  const [kind, setKind] = useState<KeyKind>('api_key');
  const [scopes, setScopes] = useState('');
  const [allowedInstanceRefs, setAllowedInstanceRefs] = useState('');
  const mutation = useProvisionApiKey();
  const titleId = useId();
  const keyIdInputId = useId();
  const scopesInputId = useId();
  const refsInputId = useId();
  const keyIdRef = useRef<HTMLInputElement>(null);

  const canSubmit = keyId.trim().length > 0 && commaList(scopes).length > 0;
  const provision = () => {
    if (!canSubmit) return;
    const secret = generateApiKeySecret();
    const refs = commaList(allowedInstanceRefs);
    mutation.mutate(
      {
        key: secret,
        keyId: keyId.trim(),
        kind,
        scopes: commaList(scopes),
        ...(refs.length > 0 ? { allowedInstanceRefs: refs } : {}),
      },
      { onSuccess: () => onProvisioned(keyId.trim(), secret) },
    );
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    provision();
  };

  return (
    <ModalDialog titleId={titleId} eyebrow="Admin command" title="Provision API key" context="provisionApiKey" onClose={onCancel} canClose={!mutation.isPending} initialFocusRef={keyIdRef} onSubmit={submit} closeLabel="Close provision API key dialog" footer={<><button className="btn" type="button" onClick={onCancel} disabled={mutation.isPending}>Cancel</button><button className="btn primary" type="submit" disabled={mutation.isPending || !canSubmit}>{mutation.isPending ? 'Provisioning…' : 'Provision key'}</button></>}>
      <div className="field"><label htmlFor={keyIdInputId}>Key ID</label><input ref={keyIdRef} className="input mono" id={keyIdInputId} value={keyId} onChange={(event) => setKeyId(event.target.value)} required autoComplete="off" disabled={mutation.isPending} /></div>
      <div className="field"><SelectDropdown label="Key kind" value={kind} options={kindOptions} onChange={(value) => setKind(value as KeyKind)} /></div>
      <div className="field"><label htmlFor={scopesInputId}>Scopes</label><input className="input" id={scopesInputId} value={scopes} onChange={(event) => setScopes(event.target.value)} required placeholder="messages:read, messages:write" autoComplete="off" disabled={mutation.isPending} /><p className="help">Comma-separated; at least one scope is required.</p></div>
      <div className="field"><label htmlFor={refsInputId}>Allowed instance refs <span className="help">optional</span></label><input className="input mono" id={refsInputId} value={allowedInstanceRefs} onChange={(event) => setAllowedInstanceRefs(event.target.value)} placeholder="instance-a, instance-b" autoComplete="off" disabled={mutation.isPending} /></div>
      <p className="help">The generated secret is shown once after the provision command succeeds.</p>
      {mutation.isError && <InlineError error={mutation.error} onRetry={provision} announce />}
    </ModalDialog>
  );
}
