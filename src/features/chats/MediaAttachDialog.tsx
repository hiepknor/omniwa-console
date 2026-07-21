import { useId, useRef, useState } from 'react';
import { InlineError } from '@/components/InlineError';
import { ModalDialog } from '@/components/dialog/ModalDialog';

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
  const descriptionId = useId();
  const coarsePointer = window.matchMedia('(hover: none) and (pointer: coarse)').matches;

  const submit = () => onSubmit({
    reference: reference.trim(),
    ...(contentType.trim() ? { contentType: contentType.trim() } : {}),
    ...(caption.trim() ? { caption: caption.trim() } : {}),
  });

  return (
    <ModalDialog titleId="attach-media-title" eyebrow="Message command" title="Attach media by reference" onClose={onCancel} canClose={!isPending} busy={isPending} initialFocusRef={coarsePointer ? undefined : inputRef} onSubmit={(event) => { event.preventDefault(); submit(); }} closeLabel="Close attach media dialog" describedBy={descriptionId} secondaryAction={<button className="btn" type="button" onClick={onCancel} disabled={isPending}>Cancel</button>} primaryAction={<button className="btn primary" type="submit" disabled={!reference.trim() || isPending}>{isPending ? 'Submitting…' : 'Attach media'}</button>}>
      <p className="dialog-sheet-copy" id={descriptionId}>Register a media reference, then submit it to this conversation.</p>
      <div className="field"><label htmlFor="media-reference">Media reference or URL</label><input ref={inputRef} className="input" id="media-reference" value={reference} onChange={(event) => setReference(event.target.value)} disabled={isPending} autoComplete="off" /></div>
      <div className="field"><label htmlFor="media-content-type">Content type (optional)</label><input className="input" id="media-content-type" value={contentType} onChange={(event) => setContentType(event.target.value)} disabled={isPending} placeholder="image/jpeg" autoComplete="off" /></div>
      <div className="field"><label htmlFor="media-caption">Caption (optional)</label><textarea className="input" id="media-caption" rows={3} value={caption} onChange={(event) => setCaption(event.target.value)} disabled={isPending} /></div>
      {error !== undefined && error !== null && <InlineError error={error} onRetry={submit} announce />}
    </ModalDialog>
  );
}
