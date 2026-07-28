import type { GroupEligibility } from '@/api/group-lists';

export type SelectedGroup = {
  label: string;
  eligibility?: GroupEligibility;
  eligibilityReason?: string;
};

export type GroupSelectionCandidate = SelectedGroup & { id: string };

export function pageSelectionState(
  selected: ReadonlyMap<string, SelectedGroup>,
  candidates: readonly GroupSelectionCandidate[],
): {
  selectedSelectableCount: number;
  selectableCount: number;
  checked: boolean;
  indeterminate: boolean;
} {
  const selectable = candidates.filter((item) => item.eligibility === 'eligible');
  const selectedSelectableCount = selectable.filter((item) => selected.has(item.id)).length;
  const checked = selectable.length > 0 && selectedSelectableCount === selectable.length;
  return {
    selectedSelectableCount,
    selectableCount: selectable.length,
    checked,
    indeterminate: selectedSelectableCount > 0 && !checked,
  };
}

export function setPageSelection(
  selected: ReadonlyMap<string, SelectedGroup>,
  candidates: readonly GroupSelectionCandidate[],
  shouldSelect: boolean,
): Map<string, SelectedGroup> {
  const next = new Map(selected);
  for (const candidate of candidates) {
    if (!shouldSelect) {
      next.delete(candidate.id);
    } else if (candidate.eligibility === 'eligible') {
      next.set(candidate.id, {
        label: candidate.label,
        eligibility: candidate.eligibility,
        eligibilityReason: candidate.eligibilityReason,
      });
    }
  }
  return next;
}
