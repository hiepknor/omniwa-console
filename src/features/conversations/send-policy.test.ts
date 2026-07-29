import { describe, expect, it } from 'vitest';
import { ApiFailure } from '@/api/envelopes';
import { commandCooldown, shouldPreserveCommandError } from './send-policy';

describe('conversation command cooldown', () => {
  it('blocks until the authoritative Retry-After window elapses', () => {
    const failure = new ApiFailure(
      { error: 'Slow down', code: 'outbound_rate_limited' },
      429,
      new Headers({ 'Retry-After': '45' }),
    );
    const now = failure.retryAt! - 45_000;
    expect(commandCooldown(failure, now)).toEqual({ active: true, remainingSeconds: 45 });
    expect(shouldPreserveCommandError(failure, now + 44_000)).toBe(true);
    expect(commandCooldown(failure, now + 45_001)).toEqual({ active: false, remainingSeconds: 0 });
  });

  it('does not invent a cooldown when the server omits timing', () => {
    const failure = new ApiFailure({ error: 'Slow down', code: 'outbound_rate_limited' }, 429);
    expect(commandCooldown(failure)).toEqual({ active: false, remainingSeconds: 0 });
  });

  it('does not turn unknown send outcome into an automatic retry window', () => {
    const failure = new ApiFailure({ error: 'Outcome unknown', code: 'unknown_send_outcome' }, 503);
    expect(commandCooldown(failure).active).toBe(false);
  });
});
