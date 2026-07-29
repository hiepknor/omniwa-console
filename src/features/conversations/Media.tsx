import { useEffect, useState } from 'react';
import { ApiFailure } from '@/api/envelopes';
import type { MessageResource } from '@/api/messages';
import { humanizeToken } from '@/lib/format';
import { Image, Status } from '@/ui';
import { cn } from '@/ui/cn';
import { useConversationMediaAsset, useConversationMediaContent } from './hooks';

function useBlobUrl(blob: Blob | undefined): string | undefined {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    if (!blob) { setUrl(undefined); return; }
    const next = URL.createObjectURL(blob);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [blob]);
  return url;
}

export function mediaPlaceholderState(status: string | undefined, failureCode: string | undefined, error: unknown): { label: string; tone: 'pending' | 'failed' | 'neutral'; detail: string } {
  const code = error instanceof ApiFailure ? error.code : undefined;
  if (status === 'failed' || status === 'deleted' || code === 'media_asset_failed' || code === 'media_asset_expired' || code === 'media_asset_deleted') {
    return { label: 'Image unavailable', tone: 'failed', detail: humanizeToken(code ?? failureCode ?? status ?? 'asset failed') };
  }
  if (error) return { label: 'Image unavailable', tone: 'failed', detail: humanizeToken(code ?? 'asset read failed') };
  if (status) return { label: `Image ${humanizeToken(status)}`, tone: 'pending', detail: 'The projected message remains visible while private content is prepared.' };
  return { label: 'Image unavailable', tone: 'neutral', detail: 'Managed image content was not reported.' };
}

export function ConversationMessageImage({ message, enabled, compact = false }: { message: MessageResource; enabled: boolean; compact?: boolean }) {
  const mediaId = message.mediaAssetId;
  const asset = useConversationMediaAsset(mediaId, enabled && Boolean(mediaId));
  const ready = asset.data?.status === 'ready';
  const content = useConversationMediaContent(mediaId, enabled && ready);
  const src = useBlobUrl(content.data);
  const error = asset.error ?? content.error;
  const placeholder = mediaPlaceholderState(asset.data?.status, asset.data?.failureCode, error);
  const alt = message.caption ? `Image message: ${message.caption}` : 'Projected image message';

  if (src) {
    return (
      <Image
        alt={alt}
        src={src}
        aspect={compact ? 'video' : 'auto'}
        fit="contain"
        className={cn(compact && 'max-w-80')}
        caption={compact ? undefined : message.caption ?? asset.data?.mimeType ?? 'Projected private image'}
      />
    );
  }

  return (
    <div role="img" aria-label={alt} className={cn('grid min-h-24 place-items-center gap-2 border border-line-strong bg-recessed p-3 text-center', compact && 'max-w-80')}>
      <Status tone={placeholder.tone}>{placeholder.label}</Status>
      <small className="text-xs text-fg-3">{enabled ? placeholder.detail : 'conversation_media_assets is not advertised for this instance.'}</small>
    </div>
  );
}
