import { describe, expect, it } from 'vitest';
import { groupRouteState } from './route-state';

describe('Groups route state', () => {
  it('preserves applied search and opaque cursor', () => {
    expect(groupRouteState(new URLSearchParams('search=Ops&cursor=opaque%3Apage&create=1&tab=members'))).toEqual({ search: 'Ops', cursor: 'opaque:page', create: true, tab: 'members' });
  });

  it('defaults invalid inspector tabs to overview', () => {
    expect(groupRouteState(new URLSearchParams('tab=unknown')).tab).toBe('overview');
  });
});
