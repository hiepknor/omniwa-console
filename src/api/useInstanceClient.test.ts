import { describe, expect, it } from 'vitest';
import { instanceTokenCredentialScope } from './useInstanceClient';

describe('instance client credential ownership', () => {
  it('reuses the session client only for the active instance-scoped credential', () => {
    expect(instanceTokenCredentialScope({ keyKind: 'api', apiKey: 'active-token' }, 'active-token')).toBe('session');
    expect(instanceTokenCredentialScope({ keyKind: 'admin', apiKey: 'admin-key' }, 'attached-token')).toBe('instance');
    expect(instanceTokenCredentialScope({ keyKind: 'api', apiKey: 'active-token' }, 'different-token')).toBe('instance');
    expect(instanceTokenCredentialScope({ keyKind: 'api', apiKey: 'active-token' }, undefined)).toBe('instance');
  });
});
