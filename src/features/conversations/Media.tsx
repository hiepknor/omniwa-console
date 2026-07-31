import { useEffect, useState } from 'react';
import { ApiFailure } from '@/api/envelopes';
import type { MessageResource } from '@/api/messages';
import { humanizeToken } from '@/lib/format';
import { Button, Image, Status } from '@/ui';
import { cn } from '@/ui/cn';
import { useConversationMediaAsset, useConversationMediaContent } from './hooks';
import { shouldLoadConversationMedia, useNearViewport } from './useNearViewport';

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
  if (code === 'media_asset_not_ready') {
    return { label: 'Image Processing', tone: 'pending', detail: 'Private content is not ready yet. The projected message remains visible.' };
  }
  if (status === 'failed' || status === 'deleted' || code === 'media_asset_failed' || code === 'media_asset_expired' || code === 'media_asset_deleted') {
    return { label: 'Image unavailable', tone: 'failed', detail: humanizeToken(code ?? failureCode ?? status ?? 'asset failed') };
  }
  if (error) return { label: 'Image unavailable', tone: 'failed', detail: humanizeToken(code ?? 'asset read failed') };
  if (status) return { label: `Image ${humanizeToken(status)}`, tone: 'pending', detail: 'The projected message remains visible while private content is prepared.' };
  return { label: 'Image unavailable', tone: 'neutral', detail: 'Managed image content was not reported.' };
}

export function mediaReadCanRetry(error: unknown): boolean {
  const code = error instanceof ApiFailure ? error.code : undefined;
  return Boolean(error) && ![
    'media_asset_not_found',
    'media_asset_failed',
    'media_asset_expired',
    'media_asset_deleted',
    'media_asset_integrity_failed',
    'media_asset_instance_mismatch',
  ].includes(code ?? '');
}

export function ConversationMediaPlaceholder({ enabled, compact = false, label, tone, detail }: {
  enabled: boolean;
  compact?: boolean;
  label: string;
  tone: 'pending' | 'failed' | 'neutral';
  detail: string;
}) {
  const visibleDetail = enabled ? detail : 'conversation_media_assets is not advertised for this instance.';
  return (
    <div role="img" aria-label={`${label}. ${visibleDetail}`} className={cn('grid min-h-24 place-items-center gap-2 border border-line-strong bg-recessed p-3 text-center', compact && 'max-w-80')}>
      <Status tone={tone}>{label}</Status>
      <small className="text-xs text-fg-3">{visibleDetail}</small>
    </div>
  );
}

function ActiveConversationMessageImage({ message, compact, priority }: { message: MessageResource; compact: boolean; priority: boolean }) {
  const mediaId = message.mediaAssetId;
  const asset = useConversationMediaAsset(mediaId, true);
  const ready = asset.data?.status === 'ready';
  const content = useConversationMediaContent(mediaId, ready);
  const src = useBlobUrl(content.data);
  const error = asset.error ?? content.error;
  const placeholder = mediaPlaceholderState(asset.data?.status, asset.data?.failureCode, error);
  const alt = message.caption ? `Image message: ${message.caption}` : 'Projected image message';
  const retry = async () => {
    const nextAsset = await asset.refetch();
    if (nextAsset.data?.status === 'ready') await content.refetch();
  };

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
    <div className="grid gap-2">
      <ConversationMediaPlaceholder enabled compact={compact} {...placeholder} />
      {priority && mediaReadCanRetry(error) ? <div className="flex justify-end"><Button onClick={() => { void retry(); }}>Retry image</Button></div> : null}
    </div>
  );
}

export function ConversationMessageImage({ message, enabled, compact = false, priority = false }: { message: MessageResource; enabled: boolean; compact?: boolean; priority?: boolean }) {
  const visibility = useNearViewport(priority);
  const active = shouldLoadConversationMedia(enabled, Boolean(message.mediaAssetId), visibility.nearViewport, priority);
  return (
    <div ref={visibility.ref}>
      {active
        ? <ActiveConversationMessageImage message={message} compact={compact} priority={priority} />
        : <ConversationMediaPlaceholder
          enabled={enabled}
          compact={compact}
          label={enabled ? 'Image deferred' : 'Image unavailable'}
          tone="neutral"
          detail="Private content loads when this message approaches the viewport."
        />}
    </div>
  );
}
