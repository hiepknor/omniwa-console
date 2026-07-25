import { describe, expect, it } from 'vitest';
import { ApiFailure } from '@/api/envelopes';
import { commandFailureState, readFailureState } from './state';

describe('platform v2 state mapping', () => {
  it('keeps background refresh failures non-blocking', () => {
    expect(readFailureState(new Error('offline'), true)).toEqual({ axis: 'resource', state: 'refresh-failed' });
  });

  it('preserves rate-limit semantics', () => {
    expect(readFailureState(new ApiFailure({ error: 'too many requests' }, 429))).toEqual({ axis: 'transport', state: 'rate-limited' });
  });

  it('treats an unclassified command transport failure as uncertain', () => {
    expect(commandFailureState(new TypeError('Failed to fetch'))).toEqual({ axis: 'command', state: 'uncertain' });
  });
});
