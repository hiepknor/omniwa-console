import { useEffect, useMemo, useState } from 'react';
import { ApiFailure } from '@/api/envelopes';
import type { MediaType, MessageCommandResult } from '@/api/messages';
import { relativeTime } from '@/lib/format';
import { Button, Dialog, Field, FileUpload, Input, Select, StateNotice, Tabs, Textarea } from '@/ui';
import { useConversationMediaAsset, useSendMedia, useSendText, useUploadConversationImage } from './hooks';
import { commandCooldown, shouldPreserveCommandError } from './send-policy';
import { ProjectionFailureNotice as FailureNotice } from '@/components/ProjectionReadState';

const HARD_MEDIA_CEILING = 67_108_864;

function validHttpUrl(value: string): boolean {
  try { return ['http:', 'https:'].includes(new URL(value).protocol); } catch { return false; }
}

function fileError(file: File | undefined): string | undefined {
  if (!file) return undefined;
  if (!['image/jpeg', 'image/png'].includes(file.type)) return 'Choose a JPEG or PNG image.';
  if (file.size > HARD_MEDIA_CEILING) return 'The image exceeds the 64 MiB client safety ceiling.';
  return undefined;
}

function acknowledgementDetail(result: MessageCommandResult): string {
  const parts = [
    result.data.messageId ? `Message ${result.data.messageId}` : undefined,
    result.data.acknowledgedAt ? `acknowledged ${relativeTime(result.data.acknowledgedAt) || result.data.acknowledgedAt}` : undefined,
  ].filter(Boolean);
  return `${parts.length ? `${parts.join(' · ')}. ` : ''}This is provider acknowledgement, not WhatsApp delivery. Projected status and receipts remain authoritative.`;
}

function unknownSendOutcome(error: unknown): boolean {
  return error instanceof ApiFailure && error.code === 'unknown_send_outcome';
}

export function ComposerUnavailable({ detail }: { detail?: string }) {
  return (
    <div className="border-t border-line bg-surface p-3">
      <StateNotice
        kind="empty"
        title="Sending unavailable"
        detail={detail ?? 'Sending requires both messages_projection and outbound_rate_limit. No send request is available.'}
      />
    </div>
  );
}

export function Composer({ conversationId, addressingJid, conversationName, enabled, mediaEnabled, unavailableDetail, recipientError, onRetryRecipient }: {
  conversationId: string;
  addressingJid: string;
  conversationName: string;
  enabled: boolean;
  mediaEnabled: boolean;
  unavailableDetail?: string;
  recipientError?: unknown;
  onRetryRecipient?: () => void;
}) {
  const [text, setText] = useState('');
  const [mediaOpen, setMediaOpen] = useState(false);
  const [source, setSource] = useState<'device' | 'url'>('device');
  const [file, setFile] = useState<File>();
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('image');
  const [caption, setCaption] = useState('');
  const [filename, setFilename] = useState('');
  const sendText = useSendText(conversationId, addressingJid);
  const sendMedia = useSendMedia(conversationId, addressingJid);
  const upload = useUploadConversationImage();
  const asset = useConversationMediaAsset(upload.data?.id, mediaEnabled && Boolean(upload.data?.id));
  const uploadedAsset = asset.data ?? upload.data;
  const selectedFileError = useMemo(() => fileError(file), [file]);
  const pending = sendText.isPending || sendMedia.isPending || upload.isPending;
  const textOutcomeUnknown = unknownSendOutcome(sendText.error);
  const mediaOutcomeUnknown = unknownSendOutcome(sendMedia.error);
  const [cooldownNow, setCooldownNow] = useState(Date.now());
  const textCooldown = commandCooldown(sendText.error, cooldownNow);
  const mediaCooldown = commandCooldown(sendMedia.error, cooldownNow);
  const cooldownSeconds = Math.max(textCooldown.remainingSeconds, mediaCooldown.remainingSeconds);
  const sendCooldown = cooldownSeconds > 0;
  const retryAt = Math.max(
    sendText.error instanceof ApiFailure && sendText.error.category === 'rate_limited' ? sendText.error.retryAt ?? 0 : 0,
    sendMedia.error instanceof ApiFailure && sendMedia.error.category === 'rate_limited' ? sendMedia.error.retryAt ?? 0 : 0,
  );
  useEffect(() => {
    if (retryAt <= Date.now()) return;
    setCooldownNow(Date.now());
    const interval = window.setInterval(() => setCooldownNow(Date.now()), 1_000);
    return () => window.clearInterval(interval);
  }, [retryAt]);

  const submitText = () => {
    const value = text.trim();
    if (!enabled || !value || pending || sendCooldown) return;
    sendText.reset();
    sendText.mutate(value, { onSuccess: () => setText('') });
  };
  const resetMediaForm = () => {
    setFile(undefined); setMediaUrl(''); setCaption(''); setFilename(''); setMediaType('image'); setSource('device');
    upload.reset();
    if (!shouldPreserveCommandError(sendMedia.error)) sendMedia.reset();
  };
  const closeMedia = () => {
    if (pending) return;
    setMediaOpen(false);
    resetMediaForm();
  };
  const chooseFile = (next: File | undefined) => {
    setFile(next);
    upload.reset();
    if (!shouldPreserveCommandError(sendMedia.error)) sendMedia.reset();
  };
  const sendSelectedMedia = () => {
    if (!enabled || sendMedia.isPending || sendCooldown) return;
    sendMedia.reset();
    if (source === 'device' && uploadedAsset?.status === 'ready') {
      sendMedia.mutate({ source: 'asset', mediaAssetId: uploadedAsset.id, caption: caption.trim() || undefined });
    } else if (source === 'url' && validHttpUrl(mediaUrl)) {
      sendMedia.mutate({ source: 'url', url: mediaUrl.trim(), mediaType, caption: caption.trim() || undefined, filename: filename.trim() || undefined });
    }
  };
  const assetPending = uploadedAsset && !['ready', 'failed', 'deleted'].includes(uploadedAsset.status);
  const canSendMedia = enabled && (source === 'device'
    ? mediaEnabled && uploadedAsset?.status === 'ready'
    : validHttpUrl(mediaUrl));

  if (!enabled) return <ComposerUnavailable detail={unavailableDetail} />;

  return (
    <div className="grid gap-3 border-t border-line bg-surface p-3">
      {sendText.data ? <StateNotice kind="info" title="Text send accepted" detail={acknowledgementDetail(sendText.data)} /> : null}
      {sendText.error ? <FailureNotice error={sendText.error} command /> : null}
      {recipientError ? <FailureNotice error={recipientError} onRetry={onRetryRecipient} /> : null}
      <form className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2" onSubmit={(event) => { event.preventDefault(); submitText(); }}>
        <Field label={`Message ${conversationName}`}>
          {(id) => <Textarea id={id} autoGrow maxRows={4} value={text} disabled={!enabled || pending} maxLength={10_000} onChange={(event) => { setText(event.target.value); if (sendText.error && !shouldPreserveCommandError(sendText.error)) sendText.reset(); }} />}
        </Field>
        <div className="flex items-center justify-end gap-2">
          <Button aria-label="Choose image or media" disabled={!enabled || pending} onClick={() => { resetMediaForm(); setMediaOpen(true); }}>Media…</Button>
          <Button variant="primary" type="submit" disabled={!enabled || !text.trim() || pending || textOutcomeUnknown || sendCooldown}>{sendText.isPending ? 'Submitting…' : sendCooldown ? `Retry in ${cooldownSeconds}s` : 'Send text'}</Button>
        </div>
      </form>

      <Dialog
        open={mediaOpen}
        onClose={closeMedia}
        closeDisabled={pending}
        title="Send image or media"
        footer={sendMedia.data
          ? <Button variant="primary" onClick={closeMedia}>Close acknowledgement</Button>
          : <><Button disabled={pending} onClick={closeMedia}>Cancel</Button><Button variant="primary" disabled={!canSendMedia || pending || mediaOutcomeUnknown || sendCooldown} onClick={sendSelectedMedia}>{sendMedia.isPending ? 'Submitting…' : sendCooldown ? `Retry in ${cooldownSeconds}s` : 'Send media'}</Button></>}
      >
        <div className="grid gap-4">
          <Tabs active={source} onChange={(id) => { setSource(id as 'device' | 'url'); if (!shouldPreserveCommandError(sendMedia.error)) sendMedia.reset(); }} tabs={[{ id: 'device', label: 'Device image' }, { id: 'url', label: 'Remote URL' }]} />
          {sendMedia.data ? <StateNotice kind="info" title="Media send accepted" detail={acknowledgementDetail(sendMedia.data)} /> : null}
          {sendMedia.error ? <FailureNotice error={sendMedia.error} command /> : null}
          {!sendMedia.data && source === 'device' ? (
            <>
              {!mediaEnabled ? <StateNotice kind="empty" title="Managed image upload unavailable" detail="This instance does not advertise conversation_media_assets. Text and the legacy remote URL path remain available." /> : null}
              <FileUpload
                label="JPEG or PNG image"
                accept="image/jpeg,image/png"
                file={file}
                disabled={!mediaEnabled || pending || Boolean(uploadedAsset)}
                error={selectedFileError}
                description="The server default limit is 8 MiB and may vary by deployment. Console enforces a 64 MiB hard safety ceiling."
                onFileChange={chooseFile}
              />
              {upload.error ? <FailureNotice error={upload.error} command /> : null}
              {asset.error ? <FailureNotice error={asset.error} onRetry={() => asset.refetch()} /> : null}
              {uploadedAsset ? (
                <StateNotice
                  kind={uploadedAsset.status === 'ready' ? 'info' : uploadedAsset.status === 'failed' || uploadedAsset.status === 'deleted' ? 'error' : 'loading'}
                  title={uploadedAsset.status === 'ready' ? 'Image ready to send' : uploadedAsset.status === 'failed' || uploadedAsset.status === 'deleted' ? 'Image unavailable' : 'Preparing private image'}
                  detail={uploadedAsset.failureCode ?? (assetPending ? 'Waiting for authoritative asset metadata. The send action remains disabled.' : `Asset ${uploadedAsset.id}`)}
                />
              ) : null}
              {!uploadedAsset ? <div className="flex justify-end"><Button disabled={!mediaEnabled || !file || Boolean(selectedFileError) || pending} onClick={() => file && upload.mutate(file)}>{upload.isPending ? 'Uploading…' : 'Upload image'}</Button></div> : null}
              <Field label="Caption (optional)">{(id) => <Input id={id} value={caption} maxLength={4_096} disabled={pending} onChange={(event) => setCaption(event.target.value)} />}</Field>
            </>
          ) : !sendMedia.data ? (
            <>
              <p className="text-sm text-fg-2">Compatibility path for a remote HTTP(S) media URL. No URL, base64, or file is combined with a managed media asset.</p>
              <Field label="HTTP(S) media URL" error={mediaUrl && !validHttpUrl(mediaUrl) ? 'Enter an HTTP(S) URL.' : undefined}>
                {(id) => <Input id={id} type="url" value={mediaUrl} autoComplete="off" spellCheck={false} onChange={(event) => setMediaUrl(event.target.value)} />}
              </Field>
              <Field label="Media type">
                {(id, labelId) => <Select id={id} aria-labelledby={labelId} value={mediaType} onValueChange={(value) => setMediaType(value as MediaType)}><option value="image">Image</option><option value="video">Video</option><option value="audio">Audio</option><option value="document">Document</option></Select>}
              </Field>
              <Field label="Caption (optional)">{(id) => <Input id={id} value={caption} maxLength={4_096} onChange={(event) => setCaption(event.target.value)} />}</Field>
              <Field label="Filename (optional)">{(id) => <Input id={id} value={filename} maxLength={255} onChange={(event) => setFilename(event.target.value)} />}</Field>
            </>
          ) : null}
        </div>
      </Dialog>
    </div>
  );
}
