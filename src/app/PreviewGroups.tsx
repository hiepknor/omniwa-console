import { useState } from 'react';
import { GroupOverview } from '@/features/groups/GroupWorkspace';
import { GroupsView } from '@/features/groups/GroupsView';
import { Drawer, Status } from '@/ui';
import { groupDetailFixture, groupsFixture } from './preview-fixtures';

/** Dev-only: Groups workbench + an open group drawer with sample data. */
export function PreviewGroups() {
  const [open, setOpen] = useState(true);
  const g = groupDetailFixture;
  return (
    <main className="min-h-dvh bg-bg">
      <GroupsView
        refreshing={false}
        onRefresh={() => {}}
        onNew={() => {}}
        onJoin={() => {}}
        normalized
        filters={{}}
        onFilter={() => {}}
        searchDraft=""
        onSearchDraft={() => {}}
        onApply={(e) => e.preventDefault()}
        applyDisabled
        initialLoading={false}
        groups={groupsFixture}
        selectedId={g.id}
        onOpen={() => setOpen(true)}
        cursor={undefined}
        nextCursor="cursor_next"
        onCursor={() => {}}
      />

      <Drawer open={open} onClose={() => setOpen(false)} title={g.subject ?? 'Group'} subtitle={g.id}>
        <div className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3"><Status tone="ok">Group active</Status><Status tone="ok">Projection ready</Status></div>
          <GroupOverview group={g} normalized />
        </div>
      </Drawer>
    </main>
  );
}
