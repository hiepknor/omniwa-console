import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import { queryKeys } from '@/api/keys';
import { clearInstanceCredentialCache } from './credential-cache';

describe('clearInstanceCredentialCache', () => {
  it('removes only reads authenticated by the replaced token', () => {
    const client = new QueryClient();
    const instanceId = 'instance-1';
    const owned = [
      queryKeys.capabilities(`instance:${instanceId}`),
      queryKeys.instanceStatus(instanceId),
      queryKeys.instanceQr(instanceId),
      queryKeys.instanceAdvancedSettings(instanceId),
    ];
    const unrelated = queryKeys.instanceStatus('instance-2');
    for (const key of owned) client.setQueryData(key, 'old-token-data');
    client.setQueryData(unrelated, 'keep');

    clearInstanceCredentialCache(client, instanceId);

    for (const key of owned) expect(client.getQueryData(key)).toBeUndefined();
    expect(client.getQueryData(unrelated)).toBe('keep');
  });
});
