import { useEffect, useRef, useState } from 'react';
import { InlineError } from '@/components/InlineError';

export function MediaAttachDialog({
  error,
  isPending,
  onCancel,
  onSubmit,
}: {
  error: unknown;
  isPending: boolean;
  onCancel: () => void;
  onSubmit: (values: { reference: string; contentType?: string; caption?: string }) => void;
}) {
  const [reference, setReference] = useState('');
  const [contentType, setContentType] = useState('');
  const [caption, setCaption] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isPending) onCancel();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [isPending, onCancel]);

  const submit = () => onSubmit({
    reference: reference.trim(),
    ...(contentType.trim() ? { contentType: contentType.trim() } : {}),
    ...(caption.trim() ? { caption: caption.trim() } : {}),
  });

  return (
    <div className="overlay" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !isPending) onCancel();
    }}>
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="attach-media-title">
        <header><b id="attach-media-title">Attach media by reference</b><span className="mono">registerMedia</span></header>
        <form onSubmit={(event) => { event.preventDefault(); submit(); }}>
          <div className="body">
            <p className="dialog-sheet-copy">Register a media reference, then submit it to this conversation.</p>
            <div className="field">
              <label htmlFor="media-reference">Media reference or URL</label>
              <input ref={inputRef} className="input" id="media-reference" value={reference} onChange={(event) => setReference(event.target.value)} disabled={isPending} autoComplete="off" />
            </div>
            <div className="field">
              <label htmlFor="media-content-type">Content type (optional)</label>
              <input className="input" id="media-content-type" value={contentType} onChange={(event) => setContentType(event.target.value)} disabled={isPending} placeholder="image/jpeg" autoComplete="off" />
            </div>
            <div className="field">
              <label htmlFor="media-caption">Caption (optional)</label>
              <textarea className="input" id="media-caption" rows={3} value={caption} onChange={(event) => setCaption(event.target.value)} disabled={isPending} />
            </div>
            {error !== undefined && error !== null && <InlineError error={error} onRetry={submit} announce />}
          </div>
          <footer>
            <button className="btn" type="button" onClick={onCancel} disabled={isPending}>Cancel</button>
            <button className="btn primary" type="submit" disabled={!reference.trim() || isPending}>{isPending ? 'Submitting…' : 'Attach media'}</button>
          </footer>
        </form>
      </div>
    </div>
  );
}
