import { describe, expect, it, vi } from 'vitest';
import type { ApiClient } from '@/api/client';
import { ApiFailure } from '@/api/envelopes';
import { connectErrorForFailure, normalizeApiOrigin, probeKey } from './connect-flow';

function success(data: unknown) {
  return {
    data: { message: 'success', data },
    response: new Response(null, { status: 200 }),
  };
}

function failure(status: number) {
  return {
    error: { error: status === 401 ? 'invalid key' : 'forbidden' },
    response: new Response(null, { status }),
  };
}

function clientWith(GET: ReturnType<typeof vi.fn>) {
  return { GET } as unknown as ApiClient;
}

describe('credential scope discovery', () => {
  it('uses explicit admin scope without an instance ID as the single discovery request', async () => {
    const GET = vi.fn().mockResolvedValue(success({ credentialScope: 'admin', capabilities: [] }));

    await expect(probeKey(clientWith(GET))).resolves.toEqual({ keyKind: 'admin' });
    expect(GET).toHaveBeenCalledTimes(1);
    expect(GET.mock.calls[0]?.[0]).toBe('/server/capabilities');
  });

  it('uses explicit instance scope and the authenticated instance ID directly', async () => {
    const GET = vi.fn().mockResolvedValue(success({
      credentialScope: 'instance',
      instanceId: '0bca2c34-ef2a-463c-98fd-e2afb6978457',
      capabilities: [],
    }));

    await expect(probeKey(clientWith(GET))).resolves.toEqual({
      keyKind: 'api',
      instanceId: '0bca2c34-ef2a-463c-98fd-e2afb6978457',
    });
    expect(GET).toHaveBeenCalledTimes(1);
  });

  it('treats a capabilities 401 as authentication failure without probing either scope', async () => {
    const GET = vi.fn().mockResolvedValue(failure(401));

    await expect(probeKey(clientWith(GET))).rejects.toMatchObject({
      category: 'authentication',
      httpStatus: 401,
    });
    expect(GET).toHaveBeenCalledTimes(1);
    expect(GET.mock.calls.map(([path]) => path)).toEqual(['/server/capabilities']);
  });

  it('runs the legacy admin probe only when credentialScope is absent', async () => {
    const GET = vi.fn()
      .mockResolvedValueOnce(success({ capabilities: [] }))
      .mockResolvedValueOnce(success([]));

    await expect(probeKey(clientWith(GET))).resolves.toEqual({ keyKind: 'admin' });
    expect(GET.mock.calls.map(([path]) => path)).toEqual([
      '/server/capabilities',
      '/instance/all',
    ]);
  });

  it('keeps legacy admin and instance probes sequential', async () => {
    let resolveAdmin!: (value: ReturnType<typeof failure>) => void;
    const adminResponse = new Promise<ReturnType<typeof failure>>((resolve) => {
      resolveAdmin = resolve;
    });
    const GET = vi.fn((path: string) => {
      if (path === '/server/capabilities') return Promise.resolve(success({ capabilities: [] }));
      if (path === '/instance/all') return adminResponse;
      return Promise.resolve(success({ Connected: true }));
    });

    const discovery = probeKey(clientWith(GET));
    await vi.waitFor(() => expect(GET).toHaveBeenCalledTimes(2));
    expect(GET.mock.calls.map(([path]) => path)).not.toContain('/instance/status');

    resolveAdmin(failure(403));
    await expect(discovery).resolves.toEqual({ keyKind: 'api' });
    expect(GET.mock.calls.map(([path]) => path)).toEqual([
      '/server/capabilities',
      '/instance/all',
      '/instance/status',
    ]);
  });

  it('does not use a legacy 401 as instance-scope control flow', async () => {
    const GET = vi.fn()
      .mockResolvedValueOnce(success({ capabilities: [] }))
      .mockResolvedValueOnce(failure(401));

    await expect(probeKey(clientWith(GET))).rejects.toMatchObject({
      category: 'authentication',
      httpStatus: 401,
    });
    expect(GET.mock.calls.map(([path]) => path)).toEqual([
      '/server/capabilities',
      '/instance/all',
    ]);
  });
});

describe('connect flow normalization', () => {
  it('accepts only an HTTP(S) origin without embedded credentials or paths', () => {
    expect(normalizeApiOrigin(' https://api.example.test/ ')).toBe('https://api.example.test');
    expect(normalizeApiOrigin('https://user:pass@example.test')).toBeUndefined();
    expect(normalizeApiOrigin('https://api.example.test/v1')).toBeUndefined();
    expect(normalizeApiOrigin('file:///tmp/api')).toBeUndefined();
  });

  it('keeps a safe diagnostic and request ID on authentication failure', () => {
    const failure = new ApiFailure(
      { error: 'invalid key' },
      401,
      new Headers({ 'X-Request-ID': 'request-1' }),
    );

    expect(connectErrorForFailure(failure)).toEqual({
      category: 'authentication',
      message: 'Authentication failed',
      detail: 'The API did not authorize this key. Verify the API origin and credential, then try again.',
      diagnostic: 'authentication',
      requestId: 'request-1',
    });
  });
});
