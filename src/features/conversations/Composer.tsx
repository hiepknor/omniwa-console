import { useState } from 'react';
import type { MediaType } from '@/api/messages';
import { Button, Dialog, Field, Input, Select, StateNotice } from '@/ui';
import { useSendMedia, useSendText } from './hooks';
import { FailureNotice } from './ui';

function validHttpUrl(value: string): boolean {
  try { return ['http:', 'https:'].includes(new URL(value).protocol); } catch { return false; }
}

export function Composer({ chatId, chatName, enabled }: { chatId: string; chatName: string; enabled: boolean }) {
  const [text, setText] = useState('');
  const [mediaOpen, setMediaOpen] = useState(false);
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('image');
  const [caption, setCaption] = useState('');
  const [filename, setFilename] = useState('');
  const sendText = useSendText(chatId);
  const sendMedia = useSendMedia(chatId);
  const pending = sendText.isPending || sendMedia.isPending;

  const submitText = () => {
    const value = text.trim();
    if (!enabled || !value || pending) return;
    sendText.reset();
    sendText.mutate(value, { onSuccess: () => setText('') });
  };
  const closeMedia = () => {
    if (sendMedia.isPending) return;
    setMediaOpen(false);
    setMediaUrl(''); setCaption(''); setFilename(''); setMediaType('image');
    sendMedia.reset();
  };

  return (
    <div className="grid gap-3 p-4 border-t border-line bg-surface">
      {sendText.data ? <StateNotice kind="info" title="Text send accepted" detail="Acknowledged by the server. This is not WhatsApp delivery; projected status and receipts remain authoritative." /> : null}
      {sendText.error ? <FailureNotice error={sendText.error} command /> : null}
      {!enabled ? <StateNotice kind="empty" title="Sending unavailable" detail="Sending requires both messages_projection and outbound_rate_limit. No send request is available." /> : null}

      <form className="grid gap-2" onSubmit={(e) => { e.preventDefault(); submitText(); }}>
        <label className="grid gap-1.5">
          <span className="text-[11px] font-medium uppercase tracking-wider text-fg-3">Message {chatName}</span>
          <textarea
            rows={3}
            value={text}
            disabled={!enabled || pending}
            maxLength={10_000}
            onChange={(e) => setText(e.target.value)}
            className="w-full px-2.5 py-2 text-[13px] bg-recessed text-fg border border-line placeholder:text-fg-3 hover:border-line-strong focus-visible:outline-none focus-visible:border-line-strong resize-y"
          />
        </label>
        <div className="flex justify-end gap-2">
          <Button disabled={!enabled || pending} onClick={() => { sendMedia.reset(); setMediaOpen(true); }}>Media URL…</Button>
          <Button variant="primary" type="submit" disabled={!enabled || !text.trim() || pending}>{sendText.isPending ? 'Submitting…' : 'Send text'}</Button>
        </div>
      </form>

      <Dialog
        open={mediaOpen}
        onClose={closeMedia}
        closeDisabled={sendMedia.isPending}
        title="Send media from URL"
        footer={sendMedia.data
          ? <Button variant="primary" onClick={closeMedia}>Close acknowledgement</Button>
          : <><Button disabled={sendMedia.isPending} onClick={closeMedia}>Cancel</Button><Button variant="primary" disabled={!validHttpUrl(mediaUrl) || sendMedia.isPending} onClick={() => sendMedia.mutate({ url: mediaUrl.trim(), mediaType, caption: caption.trim() || undefined, filename: filename.trim() || undefined })}>{sendMedia.isPending ? 'Submitting…' : 'Send media'}</Button></>}
      >
        <div className="grid gap-3">
          <p className="text-sm text-fg-2">Console sends a remote HTTP(S) URL. It never retains binary or base64 media.</p>
          {sendMedia.data ? <StateNotice kind="info" title="Media send accepted" detail="Delivery remains unconfirmed until it appears in projected status and receipts." /> : null}
          {sendMedia.error ? <FailureNotice error={sendMedia.error} command /> : null}
          {!sendMedia.data ? (
            <>
              <Field label="HTTP(S) media URL" error={mediaUrl && !validHttpUrl(mediaUrl) ? 'Enter an HTTP(S) URL.' : undefined}>
                {(id) => <Input id={id} type="url" value={mediaUrl} autoComplete="off" spellCheck={false} onChange={(e) => setMediaUrl(e.target.value)} />}
              </Field>
              <Field label="Media type">
                {(id) => (
                  <Select id={id} value={mediaType} onChange={(e) => setMediaType(e.target.value as MediaType)}>
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                    <option value="audio">Audio</option>
                    <option value="document">Document</option>
                  </Select>
                )}
              </Field>
              <Field label="Caption (optional)">{(id) => <Input id={id} value={caption} maxLength={4_096} onChange={(e) => setCaption(e.target.value)} />}</Field>
              <Field label="Filename (optional)">{(id) => <Input id={id} value={filename} maxLength={255} onChange={(e) => setFilename(e.target.value)} />}</Field>
            </>
          ) : null}
        </div>
      </Dialog>
    </div>
  );
}
