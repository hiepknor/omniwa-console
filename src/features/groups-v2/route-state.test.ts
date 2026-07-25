import { describe, expect, it } from 'vitest';
import { groupRouteState } from './route-state';

describe('Groups v2 route state', () => {
  it('preserves applied search and opaque cursor', () => {
    expect(groupRouteState(new URLSearchParams('search=Ops&cursor=opaque%3Apage&create=1'))).toEqual({ search: 'Ops', cursor: 'opaque:page', create: true });
  });
});
