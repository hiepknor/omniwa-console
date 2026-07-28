import type { ApiClient } from './client';
import type { components } from './generated/schema';
import { unwrap } from './envelopes';

type ApiAsset = components['schemas']['github_com_evolution-foundation_evolution-go_pkg_media_model.Asset'];

export type MediaAsset = {
  id: string;
  status: 'pending' | 'uploading' | 'downloading' | 'processing' | 'ready' | 'failed' | 'deleting' | 'deleted';
  mimeType?: string;
  size?: number;
  width?: number;
  height?: number;
  createdAt?: string;
  readyAt?: string;
};

function toAsset(raw: ApiAsset): MediaAsset {
  return {
    id: raw.id ?? '', status: raw.status ?? 'pending', mimeType: raw.canonical?.mimeType || undefined,
    size: raw.canonical?.sizeBytes, width: raw.canonical?.width, height: raw.canonical?.height,
    createdAt: raw.createdAt || undefined, readyAt: raw.readyAt || undefined,
  };
}

export async function uploadMediaAsset(client: ApiClient, file: File, idempotencyKey?: string): Promise<MediaAsset> {
  const form = new FormData();
  form.set('file', file);
  const result = await client.POST('/media-assets', {
    body: { file: file as never },
    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
    bodySerializer: () => form,
  });
  return toAsset(unwrap<ApiAsset>(result));
}

export async function getMediaAsset(client: ApiClient, mediaId: string): Promise<MediaAsset> {
  return toAsset(unwrap<ApiAsset>(await client.GET('/media-assets/{mediaId}', { params: { path: { mediaId } } })));
}

export async function getMediaAssetContent(client: ApiClient, mediaId: string): Promise<Blob> {
  // Binary content must cross the authenticated API boundary; <img src> cannot
  // attach the instance token. openapi-fetch returns the response Blob here.
  return unwrap<Blob>(await client.GET('/media-assets/{mediaId}/content', { params: { path: { mediaId } }, parseAs: 'blob' }));
}
