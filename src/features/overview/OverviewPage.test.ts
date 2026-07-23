import { describe, expect, it } from 'vitest';
import { overviewWindowFromSearch } from './OverviewPage';

describe('Overview URL state', () => {
  it.each(['1h', '24h', '168h', '720h'])('accepts supported metric window %s', (window) => {
    expect(overviewWindowFromSearch(window)).toBe(window);
  });

  it.each([null, '', '0h', '721h', 'invalid'])('falls back safely for unsupported window %s', (window) => {
    expect(overviewWindowFromSearch(window)).toBe('24h');
  });
});
