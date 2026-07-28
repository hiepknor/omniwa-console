import { describe, expect, it } from 'vitest';
import { groupRouteState } from './route-state';

describe('Groups route state', () => {
  it('preserves applied search and opaque cursor', () => {
    expect(groupRouteState(new URLSearchParams('search=Ops&cursor=opaque%3Apage&create=1&tab=members'))).toMatchObject({
      search: 'Ops',
      cursor: 'opaque:page',
      create: true,
      tab: 'members',
    });
  });

  it('preserves normalized directory and nested workspace filters', () => {
    expect(
      groupRouteState(
        new URLSearchParams(
          'type=subgroup&myRole=admin&sendMode=admins_only&state=active&membershipState=joined&memberSearch=Ann&memberRole=member&memberCursor=member%3A2&auditCursor=audit%3A2',
        ),
      ),
    ).toMatchObject({
      type: 'subgroup',
      myRole: 'admin',
      sendMode: 'admins_only',
      state: 'active',
      membershipState: 'joined',
      memberSearch: 'Ann',
      memberRole: 'member',
      memberCursor: 'member:2',
      auditCursor: 'audit:2',
    });
  });

  it('defaults invalid inspector tabs to overview', () => {
    expect(groupRouteState(new URLSearchParams('tab=unknown')).tab).toBe('overview');
  });
});
