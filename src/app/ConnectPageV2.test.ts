import { describe, expect, it } from 'vitest';
import { connectFailureState } from './ConnectPageV2';

describe('connectFailureState', () => {
  it.each(['authentication', 'authorization'])('maps %s failures to invalid credentials', (category) => {
    expect(connectFailureState(category)).toEqual({ axis: 'transport', state: 'authentication-failed' });
  });

  it.each(['network', 'timeout'])('maps %s failures to an unreachable runtime', (category) => {
    expect(connectFailureState(category)).toEqual({ axis: 'transport', state: 'unreachable' });
  });

  it('keeps unexpected failures factual', () => {
    expect(connectFailureState('server')).toEqual({ axis: 'resource', state: 'refresh-failed' });
  });
});
