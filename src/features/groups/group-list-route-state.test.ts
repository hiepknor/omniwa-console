import { describe, expect, it } from 'vitest';
import { groupListRouteState, setGroupListParam } from './group-list-route-state';

describe('Group List route state', () => {
  it('keeps list and nested cursors opaque and normalizes tabs', () => {
    expect(groupListRouteState(new URLSearchParams('search=North&cursor=a%2Fb&groupCursor=g%3A1&auditCursor=x%2By&tab=audit'))).toEqual(expect.objectContaining({ search: 'North', cursor: 'a/b', groupCursor: 'g:1', auditCursor: 'x+y', tab: 'audit' }));
  });
  it('resets only the cursor owned by a changed search', () => {
    const next = setGroupListParam(new URLSearchParams('search=old&cursor=opaque&groupCursor=keep'), 'search', 'new');
    expect(next.get('cursor')).toBeNull();
    expect(next.get('groupCursor')).toBe('keep');
  });
});
