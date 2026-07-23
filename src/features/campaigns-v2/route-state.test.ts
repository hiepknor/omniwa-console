import { describe, expect, it } from 'vitest';
import { campaignRouteState, setCampaignParam } from './route-state';

describe('Campaigns v2 route state', () => {
  it('preserves opaque cursors and normalizes unsupported values', () => {
    expect(campaignRouteState(new URLSearchParams('status=other&tab=audit&cursor=a%2Fb&recipientCursor=r%3A1&auditCursor=x%2By'))).toEqual({
      status: undefined, tab: 'audit', cursor: 'a/b', recipientCursor: 'r:1', auditCursor: 'x+y',
    });
  });

  it('resets only the list cursor when status changes', () => {
    const source = new URLSearchParams('cursor=opaque&recipientCursor=recipient&tab=recipients');
    expect(setCampaignParam(source, 'status', 'running').toString()).toBe('recipientCursor=recipient&tab=recipients&status=running');
  });
});
