import { useEffect, useId, useRef, useState } from 'react';

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
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  useEffect(() => {
    closeRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="overlay settings-dialog-overlay" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header><b id={titleId}>API key secret — shown once</b><span className="mono">{keyId}</span></header>
        <div className="body">
          <p className="settings-dialog-copy">Copy this secret now. It cannot be retrieved again; only rotated.</p>
          <div className="settings-secret-well"><code className="codewell" title={secret}>{secret}</code><button className="btn sm" type="button" aria-live="polite" onClick={() => void copy()}>{copied ? 'Copied' : 'Copy'}</button></div>
        </div>
        <footer><button ref={closeRef} className="btn primary" type="button" onClick={onClose}>I stored the secret</button></footer>
      </div>
    </div>
  );
}
