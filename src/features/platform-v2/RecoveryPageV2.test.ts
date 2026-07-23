import { describe, expect, it } from 'vitest';
import { recoveryFiltersFromSearch } from './route-state';

describe('recoveryFiltersFromSearch', () => {
  it('preserves server filters and opaque cursor', () => {
    expect(recoveryFiltersFromSearch(new URLSearchParams('instanceId=i-1&resource=messages&limit=100&cursor=opaque%3Avalue'))).toEqual({
      instanceId: 'i-1', resource: 'messages', limit: 100, cursor: 'opaque:value',
    });
  });

  it.each(['0', '51', '201', 'not-a-number'])('normalizes invalid limit %s', (limit) => {
    expect(recoveryFiltersFromSearch(new URLSearchParams(`limit=${limit}`)).limit).toBe(50);
  });
});
