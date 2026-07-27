import { describe, expect, it } from 'vitest';
import type { Campaign } from '@/api/campaigns';
import { campaignTargetLabel } from './CampaignProgress';

const base = {
  id: 'campaign-1', name: 'Launch', status: 'running', contentType: 'text', text: '', version: 1,
  progress: { total: 12, processed: 4, pending: 7, processing: 1, sent: 4, delivered: 0, read: 0, failed: 0, skipped: 0, aborted: 0 },
  needsAttention: false,
} satisfies Partial<Campaign>;

describe('campaign monitoring presentation', () => {
  it('identifies the immutable Group List snapshot without exposing members', () => {
    const campaign = { ...base, target: { type: 'group_list', targetCount: 12, groupListId: 'list-1', groupListName: 'Northern branches', groupListVersion: 4 } } as Campaign;
    expect(campaignTargetLabel(campaign)).toBe('Northern branches · v4');
  });

  it('keeps historical direct targets distinguishable', () => {
    const campaign = { ...base, target: { type: 'direct', targetCount: 12 } } as Campaign;
    expect(campaignTargetLabel(campaign)).toBe('12 direct recipients');
  });
});
