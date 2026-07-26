import { describe, expect, it } from 'vitest';
import { ApiFailure } from '@/api/envelopes';
import { connectErrorForFailure, normalizeApiOrigin } from './connect-flow';

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
