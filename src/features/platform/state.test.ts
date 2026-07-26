import { describe, expect, it } from 'vitest';
import { failureDetail, failureRequestId } from './state';

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
});
