import { describe, expect, it } from 'vitest';
import { environmentForApiOrigin } from './EnvironmentBadge';

describe('environmentForApiOrigin', () => {
  it('labels the official C3 API origins explicitly', () => {
    expect(environmentForApiOrigin('https://staging-api.onio.cc')).toBe('staging');
    expect(environmentForApiOrigin('https://api.onio.cc')).toBe('production');
  });

  it('keeps operator-supplied and malformed origins generic', () => {
    expect(environmentForApiOrigin('https://go.example')).toBe('platform');
    expect(environmentForApiOrigin('not an origin')).toBe('platform');
  });
});
