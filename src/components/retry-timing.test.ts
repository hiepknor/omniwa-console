import { describe, expect, it } from 'vitest';
import { jitteredRetryDelay, nextCountdownDelay, retryCountdownSeconds } from './retry-timing';

describe('retry timing', () => {
  it('counts down in whole seconds and stops scheduling at the cooldown boundary', () => {
    expect(retryCountdownSeconds(10_001, 10_000)).toBe(1);
    expect(nextCountdownDelay(10_001, 10_000)).toBe(1);
    expect(retryCountdownSeconds(10_000, 10_000)).toBe(0);
    expect(nextCountdownDelay(10_000, 10_000)).toBeUndefined();
    expect(nextCountdownDelay(9_999, 10_000)).toBeUndefined();
  });

  it('caps countdown ticks at one second', () => {
    expect(nextCountdownDelay(12_500, 10_000)).toBe(1_000);
  });

  it('keeps retry jitter within 250-1000 milliseconds', () => {
    expect(jitteredRetryDelay(0)).toBe(250);
    expect(jitteredRetryDelay(0.5)).toBe(625);
    expect(jitteredRetryDelay(1)).toBe(1_000);
  });
});
