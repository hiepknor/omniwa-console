import { describe, expect, it, vi } from 'vitest';
import type { ApiClient } from './client';
import { completeAdvancedSettings, createInstance, getInstance, getInstanceCredentialHealth, getInstanceStatus, listInstances, rotateInstanceToken } from './instances';

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

  it('drops malformed metadata records that cannot support a stable route identity', async () => {
    const GET = vi.fn()
      .mockResolvedValueOnce(ok({ message: 'success', data: [{ name: 'Missing ID' }, { id: 'instance-1', name: 'Valid' }] }))
      .mockResolvedValueOnce(ok({ message: 'success', data: { name: 'Missing ID' } }));
    const client = { GET } as unknown as ApiClient;

    expect((await listInstances(client, { metadata: true })).resource?.items.map((item) => item.id)).toEqual(['instance-1']);
    expect((await getInstance(client, 'instance-1', true)).resource).toBeUndefined();
  });

  it('discards tokens from the old-backend list and detail fallback', async () => {
    const GET = vi.fn()
      .mockResolvedValueOnce(ok({ message: 'success', data: [{ id: 'instance-1', token: 'retired-secret' }] }))
      .mockResolvedValueOnce(ok({ message: 'success', data: { id: 'instance-1', token: 'retired-secret' } }));
    const client = { GET } as unknown as ApiClient;
    const list = await listInstances(client, { metadata: false });
    const detail = await getInstance(client, 'instance-1', false);
    expect(list.resource?.items[0]).not.toHaveProperty('token');
    expect(detail.resource).not.toHaveProperty('token');
  });

  it('preserves missing connection and status facts as unknown', async () => {
    const GET = vi.fn()
      .mockResolvedValueOnce(ok({ message: 'success', data: [{ id: 'instance-1' }] }))
      .mockResolvedValueOnce(ok({ message: 'success', data: {} }));
    const client = { GET } as unknown as ApiClient;
    const list = await listInstances(client, { metadata: true });
    const status = await getInstanceStatus(client);

    expect(list.resource?.items[0]).toEqual(expect.objectContaining({ connected: undefined, status: 'unknown' }));
    expect(status).toEqual({ connected: undefined, loggedIn: undefined, name: undefined });
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

  it('maps secret-free credential health without deriving a safety verdict', async () => {
    const GET = vi.fn().mockResolvedValue(ok({
      message: 'success',
      data: {
        generatedAt: '2026-07-23T04:08:42Z',
        currentKeyVersion: 1,
        instances: { total: 0, currentDigest: 0, plaintextOnly: 0, otherKeyVersion: 0 },
        plaintextFallback: { lookups: 0, affectedInstances: 0 },
      },
    }));

    const health = await getInstanceCredentialHealth({ GET } as unknown as ApiClient);

    expect(GET).toHaveBeenCalledWith('/instance/credential-health');
    expect(health).toEqual({
      generatedAt: '2026-07-23T04:08:42Z',
      currentKeyVersion: 1,
      instances: { total: 0, currentDigest: 0, plaintextOnly: 0, otherKeyVersion: 0 },
      plaintextFallback: { lookups: 0, affectedInstances: 0, firstObservedAt: undefined, lastObservedAt: undefined },
    });
    expect(health).not.toHaveProperty('safeToRemove');
  });

  it('does not manufacture zero-valued credential-health facts', async () => {
    const GET = vi.fn().mockResolvedValue(ok({ message: 'success', data: { instances: {}, plaintextFallback: {} } }));
    const health = await getInstanceCredentialHealth({ GET } as unknown as ApiClient);
    expect(health.instances).toEqual({ total: undefined, currentDigest: undefined, plaintextOnly: undefined, otherKeyVersion: undefined });
    expect(health.plaintextFallback).toEqual({ lookups: undefined, affectedInstances: undefined, firstObservedAt: undefined, lastObservedAt: undefined });
  });

  it('accepts advanced settings for a full-snapshot update only when every field is known', () => {
    const complete = { alwaysOnline: true, readMessages: false, rejectCall: false, ignoreGroups: false, ignoreStatus: true, msgRejectCall: '' };
    expect(completeAdvancedSettings(complete)).toEqual(complete);
    expect(completeAdvancedSettings({ ...complete, readMessages: undefined })).toBeUndefined();
  });
});
