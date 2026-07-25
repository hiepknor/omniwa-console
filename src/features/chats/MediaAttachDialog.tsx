import { useId, useRef, useState } from 'react';
import type { MediaType, SendMediaInput } from '@/api/messages';
import { InlineError } from '@/components/InlineError';
import { ModalDialog } from '@/components/dialog/ModalDialog';

const mediaTypes: { value: MediaType; label: string }[] = [
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
  { value: 'audio', label: 'Audio' },
  { value: 'document', label: 'Document' },
];

export function isSupportedMediaUrl(value: string) {
  try {
    const url = new URL(value);
    return (url.protocol === 'http:' || url.protocol === 'https:')
      && url.username === ''
      && url.password === '';
  } catch {
    return false;
  }
}

export function MediaAttachDialog({
  error,
  isPending,
  onCancel,
  onSubmit,
}: {
  error: unknown;
  isPending: boolean;
  onCancel: () => void;
  onSubmit: (values: SendMediaInput) => void;
}) {
  const [url, setUrl] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('image');
  const [filename, setFilename] = useState('');
  const [caption, setCaption] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const descriptionId = useId();
  const coarsePointer = window.matchMedia('(hover: none) and (pointer: coarse)').matches;

  const urlValid = isSupportedMediaUrl(url.trim());
  const submit = () => {
    if (!urlValid || isPending) return;
    onSubmit({
      url: url.trim(),
      mediaType,
      ...(filename.trim() ? { filename: filename.trim() } : {}),
      ...(caption.trim() ? { caption: caption.trim() } : {}),
    });
  };

  return (
    <ModalDialog titleId="attach-media-title" eyebrow="Message command" title="Send media from URL" onClose={onCancel} canClose={!isPending} busy={isPending} initialFocusRef={coarsePointer ? undefined : inputRef} onSubmit={(event) => { event.preventDefault(); submit(); }} closeLabel="Close media send dialog" describedBy={descriptionId} secondaryAction={<button className="btn" type="button" onClick={onCancel} disabled={isPending}>Cancel</button>} primaryAction={<button className="btn primary" type="submit" disabled={!urlValid || isPending}>{isPending ? 'Sending…' : 'Send media'}</button>}>
      <p className="dialog-sheet-copy" id={descriptionId}>Submit an HTTP(S) media URL reachable by the server. The server fetches and sends the resource; acknowledgement does not prove delivery.</p>
      <div className="field"><label htmlFor="media-url">Media URL</label><input ref={inputRef} className="input" id="media-url" type="url" inputMode="url" required value={url} onChange={(event) => setUrl(event.target.value)} disabled={isPending} autoComplete="off" placeholder="https://example.com/media.jpg" aria-describedby="media-url-help" /><small id="media-url-help">HTTP(S) URLs only. Base64 and local file uploads are not accepted here.</small></div>
      <div className="field"><label htmlFor="media-type">Media type</label><select className="input" id="media-type" value={mediaType} onChange={(event) => setMediaType(event.target.value as MediaType)} disabled={isPending}>{mediaTypes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
      <div className="field"><label htmlFor="media-filename">Filename (optional)</label><input className="input" id="media-filename" value={filename} onChange={(event) => setFilename(event.target.value)} disabled={isPending} autoComplete="off" placeholder="media.jpg" /></div>
      <div className="field"><label htmlFor="media-caption">Caption (optional)</label><textarea className="input" id="media-caption" rows={3} value={caption} onChange={(event) => setCaption(event.target.value)} disabled={isPending} /></div>
      {error !== undefined && error !== null && <><InlineError error={error} onRetry={submit} allowRetry={false} announce /><p className="help">Send outcome is uncertain. Check projected history before submitting again.</p></>}
    </ModalDialog>
  );
}
