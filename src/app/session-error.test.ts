import { describe, expect, it } from 'vitest';
import { ApiFailure } from '@/api/envelopes';
import { shouldInvalidateSession } from './session-error';

describe('shouldInvalidateSession', () => {
  it('invalidates only a session-scoped authentication failure', () => {
    expect(shouldInvalidateSession(new ApiFailure({ error: 'expired' }, 401))).toBe(true);
    expect(shouldInvalidateSession(new ApiFailure({ error: 'expired' }, 401, undefined, 'instance'))).toBe(false);
    expect(shouldInvalidateSession(new ApiFailure({ error: 'forbidden' }, 403))).toBe(false);
  });
});
