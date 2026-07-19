import { useId, useRef, useState, type FormEvent } from 'react';
import type { ApiKeyResource } from '@/api/api-keys';
import { InlineError } from '@/components/InlineError';
import { SelectDropdown } from '@/components/SelectDropdown';
import { useModalDialog } from '@/components/useModalDialog';
import { generateApiKeySecret } from '@/lib/secrets';
import { useRotateApiKey } from './hooks';

type KeyKind = ApiKeyResource['kind'];

const kindOptions = [
  { value: 'api_key', label: 'API key' },
  { value: 'admin_key', label: 'Admin key' },
  { value: 'monitoring_key', label: 'Monitoring key' },
];

function commaList(value: string): string[] {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

export function RotateKeyDialog({
  apiKey,
  onCancel,
  onRotated,
}: {
  apiKey: ApiKeyResource;
  onCancel: () => void;
  onRotated: (keyId: string, secret: string) => void;
}) {
  const [nextKeyId, setNextKeyId] = useState(`${apiKey.id}-next`);
  const [kind, setKind] = useState<KeyKind>(apiKey.kind);
  const [scopes, setScopes] = useState(apiKey.scopes.join(', '));
  const [allowedInstanceRefs, setAllowedInstanceRefs] = useState((apiKey.allowedInstanceRefs ?? []).join(', '));
  const mutation = useRotateApiKey(apiKey.id);
  const titleId = useId();
  const nextId = useId();
  const scopesId = useId();
  const refsId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const dialogRef = useModalDialog<HTMLFormElement>({ onClose: onCancel, canClose: !mutation.isPending, initialFocusRef: inputRef });

  const canSubmit = nextKeyId.trim().length > 0 && commaList(scopes).length > 0;
  const rotate = () => {
    if (!canSubmit) return;
    const secret = generateApiKeySecret();
    const refs = commaList(allowedInstanceRefs);
    mutation.mutate(
      {
        nextKey: secret,
        nextKeyId: nextKeyId.trim(),
        kind,
        scopes: commaList(scopes),
        ...(refs.length > 0 ? { allowedInstanceRefs: refs } : {}),
      },
      { onSuccess: () => onRotated(nextKeyId.trim(), secret) },
    );
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    rotate();
  };

  return (
    <div className="overlay settings-dialog-overlay !z-[60]" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !mutation.isPending) onCancel();
    }}>
      <form ref={dialogRef} className="dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} onSubmit={submit}>
        <header><b id={titleId}>Rotate API key</b><span className="mono">{apiKey.id}</span></header>
        <div className="body">
          <p className="settings-dialog-copy">Rotation replaces this credential with a new key and secret. Clients using the current credential will stop authenticating.</p>
          <div className="field"><label htmlFor={nextId}>New key ID</label><input ref={inputRef} className="input mono" id={nextId} value={nextKeyId} onChange={(event) => setNextKeyId(event.target.value)} required autoComplete="off" disabled={mutation.isPending} /></div>
          <div className="field"><SelectDropdown label="Key kind" value={kind} options={kindOptions} onChange={(value) => setKind(value as KeyKind)} /></div>
          <div className="field"><label htmlFor={scopesId}>Scopes</label><input className="input" id={scopesId} value={scopes} onChange={(event) => setScopes(event.target.value)} required autoComplete="off" disabled={mutation.isPending} /><p className="help">Comma-separated; at least one scope is required.</p></div>
          <div className="field"><label htmlFor={refsId}>Allowed instance refs <span className="help">optional</span></label><input className="input mono" id={refsId} value={allowedInstanceRefs} onChange={(event) => setAllowedInstanceRefs(event.target.value)} autoComplete="off" disabled={mutation.isPending} /></div>
          {mutation.isError && <InlineError error={mutation.error} onRetry={rotate} announce />}
        </div>
        <footer><button className="btn" type="button" onClick={onCancel} disabled={mutation.isPending}>Cancel</button><button className="btn primary" type="submit" disabled={mutation.isPending || !canSubmit}>{mutation.isPending ? 'Rotating…' : 'Rotate key'}</button></footer>
      </form>
    </div>
  );
}
