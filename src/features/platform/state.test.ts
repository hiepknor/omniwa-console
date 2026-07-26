import { describe, expect, it } from 'vitest';
import { failureDetail, failureRequestId } from './state';
import { ApiFailure } from '@/api/envelopes';

describe('platform failure helpers', () => {
  it('reads a human message from an Error', () => {
    expect(failureDetail(new Error('offline'))).toBe('offline');
  });

  it('falls back when the failure has no readable message', () => {
    expect(failureDetail('not an error')).toBe('The request failed without a readable message.');
  });

  it('returns no requestId for a plain Error', () => {
    expect(failureRequestId(new Error('boom'))).toBeUndefined();
  });

  it('includes the machine-readable failure kind', () => {
    expect(failureDetail(new ApiFailure({ error: 'Not ready', code: 'projection_not_ready' }, 503))).toBe('projection_not_ready · Not ready');
  });
});
