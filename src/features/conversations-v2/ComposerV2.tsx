import { useState } from 'react';
import { Button, Dialog, Field, Select, StateNotice } from '@/components/v2';
import type { MediaType } from '@/api/messages';
import { useSendMediaV2, useSendTextV2 } from './hooks';
import { FailureNoticeV2 } from './ui';

function validHttpUrl(value: string): boolean {
  try { return ['http:', 'https:'].includes(new URL(value).protocol); } catch { return false; }
}

export function ComposerV2({ chatId, chatName, enabled }: { chatId: string; chatName: string; enabled: boolean }) {
  const [text, setText] = useState('');
  const [mediaOpen, setMediaOpen] = useState(false);
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('image');
  const [caption, setCaption] = useState('');
  const [filename, setFilename] = useState('');
  const sendText = useSendTextV2(chatId);
  const sendMedia = useSendMediaV2(chatId);
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

  return <div className="ui-v2-composer">
    {sendText.data ? <StateNotice value={{ axis: 'command', state: 'acknowledged' }} detail="Text send was acknowledged by the server. This is not WhatsApp delivery; projected message status and receipts remain authoritative." /> : null}
    {sendText.error ? <><FailureNoticeV2 error={sendText.error} command /><p className="ui-v2-generated-note">Outcome may be uncertain. Inspect projected history before submitting again; no one-click retry is offered.</p></> : null}
    {!enabled ? <StateNotice value={{ axis: 'capability', state: 'unsupported' }} detail="Sending requires both messages_projection and outbound_rate_limit. No send request is available." /> : null}
    <form onSubmit={(event) => { event.preventDefault(); submitText(); }}>
      <label className="ui-v2-field" htmlFor="ui-v2-message-compose"><span className="ui-v2-field__label">Message {chatName}</span><textarea id="ui-v2-message-compose" className="ui-v2-input ui-v2-textarea" rows={3} value={text} disabled={!enabled || pending} maxLength={10_000} onChange={(event) => setText(event.target.value)} /></label>
      <div className="ui-v2-command-bar"><Button disabled={!enabled || pending} onClick={() => { sendMedia.reset(); setMediaOpen(true); }}>Media URL…</Button><Button variant="primary" type="submit" disabled={!enabled || !text.trim() || pending}>{sendText.isPending ? 'Submitting…' : 'Send text'}</Button></div>
    </form>
    {mediaOpen ? <Dialog titleId="send-media-v2" eyebrow="Bounded send" title="Send media from URL" description="Console sends a remote HTTP(S) URL. It never retains binary or base64 media." canClose={!sendMedia.isPending} onClose={closeMedia} actions={sendMedia.data ? <Button variant="primary" onClick={closeMedia}>Close acknowledgement</Button> : <><Button disabled={sendMedia.isPending} onClick={closeMedia}>Cancel</Button><Button variant="primary" disabled={!validHttpUrl(mediaUrl) || sendMedia.isPending} onClick={() => sendMedia.mutate({ url: mediaUrl.trim(), mediaType, caption: caption.trim() || undefined, filename: filename.trim() || undefined })}>{sendMedia.isPending ? 'Submitting…' : 'Send media'}</Button></>}>
      {sendMedia.data ? <StateNotice value={{ axis: 'command', state: 'acknowledged' }} detail="Media send was acknowledged by the server. Delivery remains unconfirmed until it appears in projected status and receipts." /> : null}
      {sendMedia.error ? <><FailureNoticeV2 error={sendMedia.error} command /><p className="ui-v2-generated-note">Outcome may be uncertain. Inspect projected history before another attempt.</p></> : null}
      {!sendMedia.data ? <><Field label="HTTP(S) media URL" type="url" value={mediaUrl} autoComplete="off" spellCheck={false} error={mediaUrl && !validHttpUrl(mediaUrl) ? 'Enter an HTTP(S) URL.' : undefined} onChange={(event) => setMediaUrl(event.target.value)} /><Select label="Media type" value={mediaType} onChange={(value) => setMediaType(value as MediaType)} options={[{ value: 'image', label: 'Image' }, { value: 'video', label: 'Video' }, { value: 'audio', label: 'Audio' }, { value: 'document', label: 'Document' }]} /><Field label="Caption (optional)" value={caption} maxLength={4_096} onChange={(event) => setCaption(event.target.value)} /><Field label="Filename (optional)" value={filename} maxLength={255} onChange={(event) => setFilename(event.target.value)} /></> : null}
    </Dialog> : null}
  </div>;
}
