import { describe, expect, it, vi } from 'vitest';
import type { ApiClient } from './client';
import { getMediaAsset, getMediaAssetContent, uploadMediaAsset } from './media-assets';

function ok(data: unknown) {
  return { data, response: new Response(null, { status: 200 }) };
}

describe('shared media asset adapter', () => {
  it('uploads binary data through multipart and maps canonical image facts', async () => {
    const POST = vi.fn().mockResolvedValue(ok({ message: 'success', data: {
      id: '927beb51-46c2-4331-b3b4-d96f67280bd3', status: 'processing', mediaType: 'image', origin: 'device_upload',
      createdAt: '2026-07-22T08:00:00Z', updatedAt: '2026-07-22T08:00:01Z',
      canonical: { mimeType: 'image/jpeg', sizeBytes: 1234, width: 640, height: 640 },
    } }));
    const file = new File(['image'], 'group.jpg', { type: 'image/jpeg' });

    const result = await uploadMediaAsset({ POST } as unknown as ApiClient, file, 'upload-key');

    expect(POST).toHaveBeenCalledWith('/media-assets', expect.objectContaining({
      headers: { 'Idempotency-Key': 'upload-key' },
      body: { file },
      bodySerializer: expect.any(Function),
    }));
    const options = POST.mock.calls[0]?.[1] as { bodySerializer: () => FormData };
    expect(options.bodySerializer().get('file')).toBe(file);
    expect(result).toMatchObject({ status: 'processing', mediaType: 'image', origin: 'device_upload', mimeType: 'image/jpeg', size: 1234, width: 640, height: 640 });
  });

  it('reads asset state and authenticated content through the API client', async () => {
    const blob = new Blob(['image'], { type: 'image/png' });
    const GET = vi.fn()
      .mockResolvedValueOnce(ok({ message: 'success', data: { id: 'asset-1', status: 'ready', mediaType: 'image', origin: 'whatsapp_inbound', createdAt: '2026-07-22T08:00:00Z', updatedAt: '2026-07-22T08:00:01Z' } }))
      .mockResolvedValueOnce(ok(blob));
    const client = { GET } as unknown as ApiClient;

    await expect(getMediaAsset(client, 'asset-1')).resolves.toMatchObject({ id: 'asset-1', status: 'ready' });
    await expect(getMediaAssetContent(client, 'asset-1')).resolves.toBe(blob);
    expect(GET).toHaveBeenNthCalledWith(1, '/media-assets/{mediaId}', { params: { path: { mediaId: 'asset-1' } } });
    expect(GET).toHaveBeenNthCalledWith(2, '/media-assets/{mediaId}/content', { params: { path: { mediaId: 'asset-1' } }, parseAs: 'blob' });
  });
});
