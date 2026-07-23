import { describe, expect, it, vi } from 'vitest';
import type { ApiClient } from '@/api/client';
import { normalizeApiOrigin, probeKey } from './ConnectPage';

function result(status: number, data?: unknown, error?: unknown) {
  return {
    data,
    error,
    response: new Response(null, { status }),
  };
}

describe('ConnectPage contract', () => {
  it.each([
    ['https://api.onio.cc', 'https://api.onio.cc'],
    [' https://staging-api.onio.cc/ ', 'https://staging-api.onio.cc'],
    ['http://localhost:4000', 'http://localhost:4000'],
  ])('normalizes supported API origin %s', (value, expected) => {
    expect(normalizeApiOrigin(value)).toBe(expected);
  });

  it.each([
    'ftp://api.onio.cc',
    'https://operator:secret@api.onio.cc',
    'https://api.onio.cc/path',
    'https://api.onio.cc?key=value',
    'not-an-origin',
  ])('rejects unsupported or non-origin input %s', (value) => {
    expect(normalizeApiOrigin(value)).toBeUndefined();
  });

  it('classifies an admin key without issuing a scoped probe', async () => {
    const GET = vi.fn().mockResolvedValueOnce(result(200, { message: 'success', data: [] }));
    const signal = new AbortController().signal;
    await expect(probeKey({ GET } as unknown as ApiClient, signal)).resolves.toBe('admin');
    expect(GET).toHaveBeenCalledOnce();
    expect(GET).toHaveBeenCalledWith('/instance/all', { signal });
  });

  it.each([401, 403])('falls back to the scoped status probe after admin HTTP %s', async (status) => {
    const GET = vi.fn()
      .mockResolvedValueOnce(result(status, undefined, { error: 'not admin' }))
      .mockResolvedValueOnce(result(200, { message: 'success', data: { connected: true } }));
    await expect(probeKey({ GET } as unknown as ApiClient)).resolves.toBe('api');
    expect(GET).toHaveBeenNthCalledWith(2, '/instance/status', { signal: undefined });
  });

  it('preserves a non-authentication admin probe failure', async () => {
    const GET = vi.fn().mockResolvedValueOnce(result(500, undefined, { error: 'backend unavailable' }));
    await expect(probeKey({ GET } as unknown as ApiClient)).rejects.toMatchObject({
      category: 'internal',
      httpStatus: 500,
    });
    expect(GET).toHaveBeenCalledOnce();
  });

  it('surfaces the scoped probe failure when neither credential scope is valid', async () => {
    const GET = vi.fn()
      .mockResolvedValueOnce(result(401, undefined, { error: 'not admin' }))
      .mockResolvedValueOnce(result(401, undefined, { error: 'invalid key' }));
    await expect(probeKey({ GET } as unknown as ApiClient)).rejects.toMatchObject({
      category: 'authentication',
      httpStatus: 401,
      message: 'invalid key',
    });
  });
});
