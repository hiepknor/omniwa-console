import { describe, expect, it } from 'vitest';
import { groupStatusTone } from './group-status-tone';

describe('groupStatusTone', () => {
  it.each([
    ['active', 'ok'],
    ['suspended', 'degraded'],
    ['dissolved', 'failed'],
    ['unavailable', 'failed'],
    ['unknown', 'neutral'],
    [undefined, 'neutral'],
  ] as const)('maps %s to %s', (status, tone) => {
    expect(groupStatusTone(status)).toBe(tone);
  });
});
