import { describe, expect, it } from 'vitest';
import { pageSelectionState, setPageSelection, type GroupSelectionCandidate, type SelectedGroup } from './group-list-selection';

const candidates: GroupSelectionCandidate[] = [
  { id: 'eligible-1@g.us', label: 'Eligible one', eligibility: 'eligible' },
  { id: 'eligible-2@g.us', label: 'Eligible two', eligibility: 'eligible' },
  { id: 'blocked@g.us', label: 'Blocked', eligibility: 'unavailable', eligibilityReason: 'send_permission_denied' },
  { id: 'unknown@g.us', label: 'Unknown', eligibility: 'unknown' },
];

describe('Group List page selection', () => {
  it('adds only eligible groups from the loaded page and preserves other pages', () => {
    const selected = new Map<string, SelectedGroup>([['other-page@g.us', { label: 'Other page', eligibility: 'eligible' }]]);
    const next = setPageSelection(selected, candidates, true);

    expect([...next.keys()]).toEqual(['other-page@g.us', 'eligible-1@g.us', 'eligible-2@g.us']);
    expect(next.has('blocked@g.us')).toBe(false);
    expect(next.has('unknown@g.us')).toBe(false);
  });

  it('removes every selected group on the loaded page while preserving other pages', () => {
    const selected = new Map<string, SelectedGroup>([
      ['other-page@g.us', { label: 'Other page', eligibility: 'eligible' }],
      ['eligible-1@g.us', { label: 'Eligible one', eligibility: 'eligible' }],
      ['blocked@g.us', { label: 'Blocked', eligibility: 'unavailable' }],
    ]);
    const next = setPageSelection(selected, candidates, false);

    expect([...next.keys()]).toEqual(['other-page@g.us']);
  });

  it('reports none, partial, and complete states against selectable groups only', () => {
    expect(pageSelectionState(new Map(), candidates)).toMatchObject({ selectedSelectableCount: 0, selectableCount: 2, checked: false, indeterminate: false });
    expect(pageSelectionState(new Map([['eligible-1@g.us', { label: 'Eligible one' }]]), candidates)).toMatchObject({ selectedSelectableCount: 1, selectableCount: 2, checked: false, indeterminate: true });
    expect(pageSelectionState(new Map([
      ['eligible-1@g.us', { label: 'Eligible one' }],
      ['eligible-2@g.us', { label: 'Eligible two' }],
      ['blocked@g.us', { label: 'Blocked' }],
    ]), candidates)).toMatchObject({ selectedSelectableCount: 2, selectableCount: 2, checked: true, indeterminate: false });
  });
});
