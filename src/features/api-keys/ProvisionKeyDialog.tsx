import { useId, useRef, useState, type FormEvent } from 'react';
import type { ApiKeyCommandResult, ApiKeyResource } from '@/api/api-keys';
import { InlineError } from '@/components/InlineError';
import { SelectDropdown } from '@/components/SelectDropdown';
import { ModalDialog } from '@/components/dialog/ModalDialog';
import { TokenField, duplicateTokens, tokenFieldItems, type TokenFieldValue } from '@/components/TokenField';
import { generateApiKeySecret } from '@/lib/secrets';
import { ApiKeyPolicySummary } from './ApiKeyPolicySummary';
import { useProvisionApiKey } from './hooks';

type KeyKind = ApiKeyResource['kind'];

const kindOptions = [
  { value: 'api_key', label: 'API key' },
  { value: 'admin_key', label: 'Admin key' },
  { value: 'monitoring_key', label: 'Monitoring key' },
];

export function ProvisionKeyDialog({
  onCancel,
  onProvisioned,
}: {
  onCancel: () => void;
  onProvisioned: (keyId: string, secret: string, result: ApiKeyCommandResult) => void;
}) {
  const [keyId, setKeyId] = useState('');
  const [kind, setKind] = useState<KeyKind>('api_key');
  const [scopes, setScopes] = useState<TokenFieldValue>({ tokens: [], draft: '' });
  const [allowedInstanceRefs, setAllowedInstanceRefs] = useState<TokenFieldValue>({ tokens: [], draft: '' });
  const mutation = useProvisionApiKey();
  const titleId = useId();
  const keyIdInputId = useId();
  const scopesInputId = useId();
  const refsInputId = useId();
  const keyIdRef = useRef<HTMLInputElement>(null);

  const scopeItems = tokenFieldItems(scopes);
  const instanceRefs = tokenFieldItems(allowedInstanceRefs);
  const canSubmit = keyId.trim().length > 0 && scopeItems.length > 0 && duplicateTokens(scopes).length === 0 && duplicateTokens(allowedInstanceRefs).length === 0;
  const provision = () => {
    if (!canSubmit) return;
    const secret = generateApiKeySecret();
    mutation.mutate(
      {
        key: secret,
        keyId: keyId.trim(),
        kind,
        scopes: scopeItems,
        ...(instanceRefs.length > 0 ? { allowedInstanceRefs: instanceRefs } : {}),
      },
      { onSuccess: (result) => onProvisioned(keyId.trim(), secret, result) },
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
      <TokenField id={scopesInputId} label="Scopes" value={scopes} onChange={setScopes} placeholder="messages:read" help="Press Enter or comma after each scope. At least one scope is required." disabled={mutation.isPending} />
      <TokenField id={refsInputId} label="Allowed instance refs" value={allowedInstanceRefs} onChange={setAllowedInstanceRefs} placeholder="instance-a" help="No instance restriction is submitted when this field is empty; the platform decides the resulting access semantics." optional disabled={mutation.isPending} />
      <ApiKeyPolicySummary kind={kind} scopes={scopeItems} instanceRefs={instanceRefs} note="New credential" />
      <p className="help">The generated secret is shown once after the provision command succeeds.</p>
      {mutation.isError && <InlineError error={mutation.error} onRetry={provision} announce />}
    </ModalDialog>
  );
}
