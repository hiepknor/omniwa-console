import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ApiProvider } from '@/api/ApiProvider';
import { ApiFailure } from '@/api/envelopes';
import { queryKeys, SESSION_QUERY_SCOPE } from '@/api/keys';
import type { MediaAsset } from '@/api/media-assets';
import type { MessageResource } from '@/api/messages';
import { ConversationMessageImage, mediaPlaceholderState, mediaReadCanRetry } from './Media';

const message: MessageResource = {
  resourceType: 'message', id: 'message-1', conversationId: 'conversation-1', direction: 'incoming',
  type: 'image', mediaType: 'image', mediaAssetId: 'asset-1', createdAt: '2026-07-29T00:00:00Z', provenance: 'live',
};

function render(enabled: boolean, asset?: MediaAsset) {
  const client = new QueryClient();
  if (asset) client.setQueryData(queryKeys.mediaAsset(SESSION_QUERY_SCOPE, asset.id), asset);
  return renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <ApiProvider session={{ baseUrl: 'https://example.invalid', apiKey: 'test', keyKind: 'api', connectedAt: '2026-07-29T00:00:00Z' }}>
        <ConversationMessageImage message={message} enabled={enabled} priority />
      </ApiProvider>
    </QueryClientProvider>,
  );
}

describe('ConversationMessageImage', () => {
  it('keeps a capability-off placeholder without fetching private content', () => {
    expect(render(false)).toContain('conversation_media_assets is not advertised');
  });

  it('keeps a projected message visible while its asset is pending', () => {
    const html = render(true, {
      id: 'asset-1', status: 'processing', mediaType: 'image', origin: 'whatsapp_inbound',
      createdAt: '2026-07-29T00:00:00Z', updatedAt: '2026-07-29T00:00:01Z',
    });
    expect(html).toContain('Image Processing');
    expect(html).toContain('remains visible');
  });

  it('retains a terminal placeholder and failure code', () => {
    const html = render(true, {
      id: 'asset-1', status: 'failed', mediaType: 'image', origin: 'whatsapp_inbound', failureCode: 'media_asset_integrity_failed',
      createdAt: '2026-07-29T00:00:00Z', updatedAt: '2026-07-29T00:00:01Z',
    });
    expect(html).toContain('Image unavailable');
    expect(html).toContain('Media asset integrity failed');
  });

  it('treats an expired private asset as unavailable without removing the message', () => {
    expect(mediaPlaceholderState(undefined, undefined, new ApiFailure(
      { error: 'Asset expired', code: 'media_asset_expired' }, 410,
    ))).toEqual({ label: 'Image unavailable', tone: 'failed', detail: 'Media asset expired' });
  });

  it('keeps a content race pending and permits an explicit inspector retry', () => {
    const failure = new ApiFailure({ error: 'Not ready', code: 'media_asset_not_ready' }, 409);
    expect(mediaPlaceholderState('ready', undefined, failure)).toEqual({
      label: 'Image Processing', tone: 'pending', detail: 'Private content is not ready yet. The projected message remains visible.',
    });
    expect(mediaReadCanRetry(failure)).toBe(true);
  });

  it('does not offer futile retries for terminal private asset errors', () => {
    expect(mediaReadCanRetry(new ApiFailure({ error: 'Deleted', code: 'media_asset_deleted' }, 410))).toBe(false);
    expect(mediaReadCanRetry(new ApiFailure({ error: 'Storage unavailable', code: 'media_asset_storage_unavailable' }, 503))).toBe(true);
  });
});
