import { useId, useRef, useState } from 'react';
import { ModalDialog } from '@/components/dialog/ModalDialog';

export function SecretDialog({
  keyId,
  secret,
  onClose,
}: {
  keyId: string;
  secret: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const copyRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setCopyFailed(false);
    } catch {
      setCopied(false);
      setCopyFailed(true);
    }
  };

  return (
    <ModalDialog titleId={titleId} eyebrow="Credential secret" title="API key secret — shown once" context={keyId} onClose={onClose} canClose={false} showClose={false} initialFocusRef={copyRef} closeLabel="Close API key secret dialog" describedBy={descriptionId} primaryAction={<button className="btn primary" type="button" onClick={onClose}>I stored the secret</button>}>
      <p className="settings-dialog-copy" id={descriptionId}>Copy this secret now. It cannot be retrieved again; only rotated.</p>
      <div className="settings-secret-well"><code className="codewell" title={secret}>{secret}</code><button ref={copyRef} className="btn sm" type="button" aria-live="polite" onClick={() => void copy()}>{copied ? 'Copied' : 'Copy'}</button></div>
      {copyFailed && <p className="help" role="alert">Clipboard access failed. Select and copy the secret manually before continuing.</p>}
    </ModalDialog>
  );
}
