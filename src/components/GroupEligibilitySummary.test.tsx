import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { GroupEligibilitySummary } from './GroupEligibilitySummary';

describe('GroupEligibilitySummary', () => {
  it('renders complete backend-owned counts and reasons', () => {
    const html = renderToStaticMarkup(<GroupEligibilitySummary value={{
      groupListId: 'list-1', groupListVersion: 4, total: 5, eligible: 3,
      unavailable: 1, unknown: 1, readyToTarget: false,
      byReason: { send_permission_denied: 1, projection_not_ready: 1 },
      checkedAt: '2026-07-28T00:00:00Z',
    }} />);
    expect(html).toContain('2 blocked');
    expect(html).toContain('3 eligible');
    expect(html).toContain('1 unavailable');
    expect(html).toContain('Send permission denied');
    expect(html).toContain('Projection not ready');
  });

  it('does not turn omitted aggregate facts into zeroes', () => {
    const html = renderToStaticMarkup(<GroupEligibilitySummary value={{ groupListId: 'list-1' }} />);

    expect(html).toContain('Eligibility incomplete');
    expect(html).toContain('— eligible');
    expect(html).not.toContain('0 eligible');
  });
});
