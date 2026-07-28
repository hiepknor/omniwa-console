import { describe, expect, it } from 'vitest';
import { editorSnapshotChanged, groupListEditorDiff, type GroupListEditorSnapshot } from './group-list-editor-state';

const baseline: GroupListEditorSnapshot = {
  name: 'Operations', description: 'Approved', source: 'ticket', authorizedAt: '2026-07-29T01:00', selectedIds: ['a@g.us', 'b@g.us'],
};

describe('Group List editor state', () => {
  it('ignores selection ordering when detecting an unsaved draft', () => {
    expect(editorSnapshotChanged(baseline, { ...baseline, selectedIds: ['b@g.us', 'a@g.us'] })).toBe(false);
    expect(editorSnapshotChanged(baseline, { ...baseline, name: 'Updated' })).toBe(true);
  });

  it('summarizes immutable-version changes without inferring recipient counts', () => {
    expect(groupListEditorDiff(baseline, {
      ...baseline, description: 'Updated', source: 'operator_attestation', selectedIds: ['b@g.us', 'c@g.us'],
    })).toEqual({ factsChanged: true, authorizationChanged: true, added: 1, removed: 1 });
  });
});
