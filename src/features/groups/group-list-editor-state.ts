export type GroupListEditorSnapshot = {
  name: string;
  description: string;
  source: string;
  authorizedAt: string;
  selectedIds: readonly string[];
};

function normalizedIds(ids: readonly string[]): string[] {
  return [...ids].sort((left, right) => left.localeCompare(right));
}

export function editorSnapshotChanged(baseline: GroupListEditorSnapshot, current: GroupListEditorSnapshot): boolean {
  return baseline.name !== current.name
    || baseline.description !== current.description
    || baseline.source !== current.source
    || baseline.authorizedAt !== current.authorizedAt
    || normalizedIds(baseline.selectedIds).join('\n') !== normalizedIds(current.selectedIds).join('\n');
}

export function groupListEditorDiff(baseline: GroupListEditorSnapshot, current: GroupListEditorSnapshot) {
  const before = new Set(baseline.selectedIds);
  const after = new Set(current.selectedIds);
  return {
    factsChanged: baseline.name !== current.name || baseline.description !== current.description,
    authorizationChanged: baseline.source !== current.source || baseline.authorizedAt !== current.authorizedAt,
    added: [...after].filter((id) => !before.has(id)).length,
    removed: [...before].filter((id) => !after.has(id)).length,
  };
}
