import { describe, expect, it } from 'vitest';
import { campaignActions } from './lifecycle';

describe('campaign lifecycle actions', () => {
  it('allows a draft to start immediately or take the optional schedule path', () => {
    expect(campaignActions.draft).toEqual(['schedule', 'start', 'abort']);
  });

  it('offers only server-valid actions for later states', () => {
    expect(campaignActions.scheduled).toEqual(['start', 'abort']);
    expect(campaignActions.running).toEqual(['pause', 'abort']);
    expect(campaignActions.paused).toEqual(['resume', 'abort']);
    expect(campaignActions.completed).toEqual([]);
    expect(campaignActions.aborted).toEqual([]);
    expect(campaignActions.failed).toEqual([]);
  });
});
