import { describe, expect, it } from 'vitest';
import { getEmptyGroupProjectionState } from './GroupsPage';

describe('empty Groups projection states', () => {
  it.each([
    ['ready', 'No groups'],
    ['syncing', 'Group projection syncing'],
    ['stale', 'Stale projection has no groups'],
    ['failed', 'Group projection failed'],
    ['not_started', 'Group projection not ready'],
  ] as const)('renders %s without converting it to another state', (syncStatus, title) => {
    expect(getEmptyGroupProjectionState({ syncStatus }, '').title).toBe(title);
  });

  it('describes an authoritative filtered miss separately', () => {
    expect(getEmptyGroupProjectionState({ syncStatus: 'ready' }, 'Ops').detail).toContain('No projected group matches this prefix');
  });
});
