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
  const descriptionId = useId();
  const keyIdInputId = useId();
  const scopesInputId = useId();
  const refsInputId = useId();
  const keyIdRef = useRef<HTMLInputElement>(null);

  const scopeItems = tokenFieldItems(scopes);
  const instanceRefs = tokenFieldItems(allowedInstanceRefs);
  const hasUncommittedTokens = scopes.draft.trim().length > 0 || allowedInstanceRefs.draft.trim().length > 0;
  const canSubmit = keyId.trim().length > 0 && scopeItems.length > 0 && !hasUncommittedTokens && duplicateTokens(scopes).length === 0 && duplicateTokens(allowedInstanceRefs).length === 0;
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
    <ModalDialog titleId={titleId} eyebrow="Admin command" title="Provision API key" size="wide" onClose={onCancel} canClose={!mutation.isPending} busy={mutation.isPending} initialFocusRef={keyIdRef} onSubmit={submit} closeLabel="Close provision API key dialog" describedBy={descriptionId} secondaryAction={<button className="btn" type="button" onClick={onCancel} disabled={mutation.isPending}>Cancel</button>} primaryAction={<button className="btn primary" type="submit" disabled={mutation.isPending || !canSubmit}>{mutation.isPending ? 'Submitting…' : 'Provision key'}</button>}>
      <p className="settings-dialog-copy" id={descriptionId}>Create a scoped credential. Its generated secret is available only once after submission.</p>
      <div className="grid grid-cols-[minmax(0,2fr)_minmax(180px,1fr)] items-end gap-3 max-[600px]:grid-cols-1 max-[600px]:gap-0"><div className="field"><label htmlFor={keyIdInputId}>Key ID</label><input ref={keyIdRef} className="input mono !min-h-11" id={keyIdInputId} value={keyId} onChange={(event) => setKeyId(event.target.value)} required autoComplete="off" disabled={mutation.isPending} /></div><div className="field w-full [&_.dropdown-trigger]:!min-h-11 [&_.dropdown-trigger]:w-full [&_.dropdown]:w-full"><SelectDropdown label="Key kind" value={kind} options={kindOptions} onChange={(value) => setKind(value as KeyKind)} disabled={mutation.isPending} /></div></div>
      <TokenField id={scopesInputId} label="Scopes" value={scopes} onChange={setScopes} placeholder="e.g. messages:read" help="Add at least one scope." required disabled={mutation.isPending} />
      <TokenField id={refsInputId} label="Allowed instance refs" value={allowedInstanceRefs} onChange={setAllowedInstanceRefs} placeholder="instance-a" help="No instance restriction is submitted when this field is empty; the platform decides the resulting access semantics." optional disabled={mutation.isPending} />
      <ApiKeyPolicySummary kind={kind} scopes={scopeItems} instanceRefs={instanceRefs} note="New credential" />
      {mutation.isError && <InlineError error={mutation.error} onRetry={provision} announce />}
    </ModalDialog>
  );
}
