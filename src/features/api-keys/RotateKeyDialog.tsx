import { useId, useRef, useState, type FormEvent } from 'react';
import type { ApiKeyCommandResult, ApiKeyResource } from '@/api/api-keys';
import { InlineError } from '@/components/InlineError';
import { SelectDropdown } from '@/components/SelectDropdown';
import { ModalDialog } from '@/components/dialog/ModalDialog';
import { TokenField, duplicateTokens, tokenFieldItems, type TokenFieldValue } from '@/components/TokenField';
import { generateApiKeySecret } from '@/lib/secrets';
import { ApiKeyPolicySummary } from './ApiKeyPolicySummary';
import { useRotateApiKey } from './hooks';
import { sameValues } from './presentation';

type KeyKind = ApiKeyResource['kind'];

const kindOptions = [
  { value: 'api_key', label: 'API key' },
  { value: 'admin_key', label: 'Admin key' },
  { value: 'monitoring_key', label: 'Monitoring key' },
];

export function RotateKeyDialog({
  apiKey,
  onCancel,
  onRotated,
}: {
  apiKey: ApiKeyResource;
  onCancel: () => void;
  onRotated: (keyId: string, secret: string, result: ApiKeyCommandResult) => void;
}) {
  const [nextKeyId, setNextKeyId] = useState(`${apiKey.id}-next`);
  const [kind, setKind] = useState<KeyKind>(apiKey.kind);
  const [scopes, setScopes] = useState<TokenFieldValue>({ tokens: apiKey.scopes, draft: '' });
  const [allowedInstanceRefs, setAllowedInstanceRefs] = useState<TokenFieldValue>({ tokens: apiKey.allowedInstanceRefs ?? [], draft: '' });
  const [reasonCode, setReasonCode] = useState('');
  const mutation = useRotateApiKey(apiKey.id);
  const titleId = useId();
  const descriptionId = useId();
  const nextId = useId();
  const scopesId = useId();
  const refsId = useId();
  const reasonId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const scopeItems = tokenFieldItems(scopes);
  const instanceRefs = tokenFieldItems(allowedInstanceRefs);
  const policyChangeCount = Number(kind !== apiKey.kind) + Number(!sameValues(scopeItems, apiKey.scopes)) + Number(!sameValues(instanceRefs, apiKey.allowedInstanceRefs ?? []));
  const hasUncommittedTokens = scopes.draft.trim().length > 0 || allowedInstanceRefs.draft.trim().length > 0;
  const canSubmit = nextKeyId.trim().length > 0 && scopeItems.length > 0 && !hasUncommittedTokens && duplicateTokens(scopes).length === 0 && duplicateTokens(allowedInstanceRefs).length === 0;
  const rotate = () => {
    if (!canSubmit) return;
    const secret = generateApiKeySecret();
    mutation.mutate(
      {
        nextKey: secret,
        nextKeyId: nextKeyId.trim(),
        kind,
        scopes: scopeItems,
        ...(instanceRefs.length > 0 ? { allowedInstanceRefs: instanceRefs } : {}),
        ...(reasonCode.trim() ? { reasonCode: reasonCode.trim() } : {}),
      },
      { onSuccess: (result) => onRotated(nextKeyId.trim(), secret, result) },
    );
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    rotate();
  };

  return (
    <ModalDialog titleId={titleId} eyebrow="Admin command" title="Rotate API key" context={apiKey.id} size="wide" onClose={onCancel} canClose={!mutation.isPending} busy={mutation.isPending} initialFocusRef={inputRef} onSubmit={submit} closeLabel="Close rotate API key dialog" describedBy={descriptionId} secondaryAction={<button className="btn" type="button" onClick={onCancel} disabled={mutation.isPending}>Cancel</button>} primaryAction={<button className="btn primary" type="submit" disabled={mutation.isPending || !canSubmit}>{mutation.isPending ? 'Submitting…' : 'Rotate key'}</button>}>
      <p className="settings-dialog-copy" id={descriptionId}>Rotation replaces this credential with a new key and secret. Clients using the current credential will stop authenticating.</p>
      <div className="grid grid-cols-[minmax(0,2fr)_minmax(180px,1fr)] items-end gap-3 max-[600px]:grid-cols-1 max-[600px]:gap-0"><div className="field"><label htmlFor={nextId}>New key ID</label><input ref={inputRef} className="input mono !min-h-11" id={nextId} value={nextKeyId} onChange={(event) => setNextKeyId(event.target.value)} required autoComplete="off" disabled={mutation.isPending} /></div><div className="field w-full [&_.dropdown-trigger]:!min-h-11 [&_.dropdown-trigger]:w-full [&_.dropdown]:w-full"><SelectDropdown label="Key kind" value={kind} options={kindOptions} onChange={(value) => setKind(value as KeyKind)} disabled={mutation.isPending} /></div></div>
      <TokenField id={scopesId} label="Scopes" value={scopes} onChange={setScopes} placeholder="e.g. messages:read" help="Add at least one scope." required disabled={mutation.isPending} />
      <TokenField id={refsId} label="Allowed instance refs" value={allowedInstanceRefs} onChange={setAllowedInstanceRefs} placeholder="instance-a" help="No instance restriction is submitted when this field is empty; the platform decides the resulting access semantics." optional disabled={mutation.isPending} />
      <div className="field"><label htmlFor={reasonId}>Rotation reason <span className="help">optional</span></label><input className="input" id={reasonId} value={reasonCode} onChange={(event) => setReasonCode(event.target.value)} autoComplete="off" disabled={mutation.isPending} /></div>
      <ApiKeyPolicySummary kind={kind} scopes={scopeItems} instanceRefs={instanceRefs} note={policyChangeCount ? `${policyChangeCount} policy ${policyChangeCount === 1 ? 'field' : 'fields'} changed` : 'Policy unchanged'} />
      {mutation.isError && <InlineError error={mutation.error} onRetry={rotate} announce />}
    </ModalDialog>
  );
}
