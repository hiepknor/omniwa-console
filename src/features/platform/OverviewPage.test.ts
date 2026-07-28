import { describe, expect, it } from 'vitest';
import { overviewReadFailureTitle } from './OverviewPage';
import { overviewWindowFromSearch } from './route-state';

describe('overviewWindowFromSearch', () => {
  it.each(['1h', '24h', '168h', '720h'])('preserves supported %s window', (value) => {
    expect(overviewWindowFromSearch(value)).toBe(value);
  });

  it.each([null, '', '721h', 'custom'])('normalizes unsupported %s window', (value) => {
    expect(overviewWindowFromSearch(value)).toBe('24h');
  });
});

describe('overview read failure presentation', () => {
  it('distinguishes an initial failure from a failed refresh with cached data', () => {
    expect(overviewReadFailureTitle('Health', false)).toBe('Health read failed');
    expect(overviewReadFailureTitle('Projection', true)).toBe('Showing last known projection');
  });
});
