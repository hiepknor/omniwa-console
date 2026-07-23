import { describe, expect, it, vi } from 'vitest';
import type { ApiClient } from './client';
import { createInstance, getInstance, listInstances, rotateInstanceToken } from './instances';

function ok(data: unknown) { return { data, response: new Response(null, { status: 200 }) }; }

describe('credential-safe instance adapter', () => {
  it('prefers metadata views and keeps credential material outside view models', async () => {
    const GET = vi.fn().mockResolvedValue(ok({ message: 'success', data: [{ id: 'instance-1', name: 'Sales', connected: true, credentialVersion: 2, token: 'must-not-pass', proxy: 'must-not-pass' }] }));
    const result = await listInstances({ GET } as unknown as ApiClient, { metadata: true });
    expect(GET).toHaveBeenCalledWith('/instance/metadata');
    expect(result.resource?.items[0]).toEqual(expect.objectContaining({ id: 'instance-1', displayName: 'Sales', credentialVersion: 2 }));
    expect(result.resource?.items[0]).not.toHaveProperty('token');
    expect(result.resource?.items[0]).not.toHaveProperty('proxy');
  });

  it('discards tokens from the old-backend list and detail fallback', async () => {
    const GET = vi.fn()
      .mockResolvedValueOnce(ok({ message: 'success', data: [{ id: 'instance-1', token: 'legacy-secret' }] }))
      .mockResolvedValueOnce(ok({ message: 'success', data: { id: 'instance-1', token: 'legacy-secret' } }));
    const client = { GET } as unknown as ApiClient;
    const list = await listInstances(client, { metadata: false });
    const detail = await getInstance(client, 'instance-1', false);
    expect(list.resource?.items[0]).not.toHaveProperty('token');
    expect(detail.resource).not.toHaveProperty('token');
  });

  it('returns create and rotation credentials only as explicit one-time results', async () => {
    const POST = vi.fn()
      .mockResolvedValueOnce(ok({ message: 'success', data: { id: 'ignored' } }))
      .mockResolvedValueOnce(ok({ message: 'success', data: { instanceId: 'instance-1', token: 'rotated-secret', credentialVersion: 3, rotatedAt: '2026-07-23T02:00:00Z' } }));
    const client = { POST } as unknown as ApiClient;
    const created = await createInstance(client, { name: 'Sales' });
    expect(created.instanceId).toBeTruthy();
    expect(created.token).toBeTruthy();
    const rotated = await rotateInstanceToken(client, 'instance-1', 2, 'scheduled rotation');
    expect(POST).toHaveBeenLastCalledWith('/instance/rotate-token/{instanceId}', { params: { path: { instanceId: 'instance-1' } }, body: { expectedVersion: 2, reason: 'scheduled rotation' } });
    expect(rotated).toEqual(expect.objectContaining({ instanceId: 'instance-1', token: 'rotated-secret', credentialVersion: 3 }));
  });
});
