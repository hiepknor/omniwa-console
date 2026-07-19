import { useId, useRef, useState } from 'react';
import { useModalDialog } from '@/components/useModalDialog';

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
  const dialogRef = useModalDialog<HTMLDivElement>({ onClose, canClose: copied, initialFocusRef: copyRef });

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
    <div className="overlay settings-dialog-overlay !z-[60]" role="presentation">
      <div ref={dialogRef} className="dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
        <header><b id={titleId}>API key secret — shown once</b><span className="mono">{keyId}</span></header>
        <div className="body">
          <p className="settings-dialog-copy">Copy this secret now. It cannot be retrieved again; only rotated.</p>
          <div className="settings-secret-well"><code className="codewell" title={secret}>{secret}</code><button ref={copyRef} className="btn sm" type="button" aria-live="polite" onClick={() => void copy()}>{copied ? 'Copied' : 'Copy'}</button></div>
          {copyFailed && <p className="help" role="alert">Clipboard access failed. Select and copy the secret manually before continuing.</p>}
        </div>
        <footer><button className="btn primary" type="button" onClick={onClose}>I stored the secret</button></footer>
      </div>
    </div>
  );
}
