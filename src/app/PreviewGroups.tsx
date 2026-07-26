import { useState } from 'react';
import { GroupsView } from '@/features/groups/GroupsView';
import { Button, DescriptionItem, DescriptionList, Drawer, Field, Input, Panel, Status, Switch } from '@/ui';
import { groupDetailFixture, groupsFixture } from './preview-fixtures';

function Fact({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return <DescriptionItem label={label} mono={mono}>{value}</DescriptionItem>;
}

/** Dev-only: Groups workbench + an open group drawer with sample data. */
export function PreviewGroups() {
  const [open, setOpen] = useState(true);
  const g = groupDetailFixture;
  return (
    <div className="min-h-dvh bg-bg">
      <GroupsView
        refreshing={false}
        onRefresh={() => {}}
        onNew={() => {}}
        metrics={{ loaded: 3, members: 62, admins: 7, announce: 2 }}
        searchDraft=""
        onSearchDraft={() => {}}
        onApply={(e) => e.preventDefault()}
        applyDisabled
        initialLoading={false}
        empty={false}
        groups={groupsFixture}
        selectedId={g.id}
        onOpen={() => setOpen(true)}
        cursor={undefined}
        nextCursor="cursor_next"
        onCursor={() => {}}
      />

      <Drawer open={open} onClose={() => setOpen(false)} title={g.subject ?? 'Group'} subtitle={g.id}>
        <div className="grid gap-4">
          <Status tone="ok">Active</Status>
          <Panel title="Group facts" bodyClassName="pt-2">
            <DescriptionList>
              <Fact label="Group JID" value={g.id} mono />
              <Fact label="Members" value="42" />
              <Fact label="Admins" value="4" />
              <Fact label="Updated" value="30m ago" />
            </DescriptionList>
          </Panel>
          <Panel title="Group settings" description="Each switch submits one explicit paired group-setting action.">
            <div>
              {['Announcement only', 'Locked metadata', 'Join approval'].map((s, i) => (
                <Switch key={s} className="border-b border-line last:border-b-0" label={s} defaultChecked={i === 0} />
              ))}
            </div>
          </Panel>
          <Panel title="Members">
            <div className="grid gap-3">
              <form className="grid grid-cols-[minmax(0,1fr)_auto] gap-2" onSubmit={(e) => e.preventDefault()}>
                <Field label="Phone or JID">{(id) => <Input id={id} placeholder="15551230000" />}</Field>
                <div className="flex items-end"><Button type="submit">Add member</Button></div>
              </form>
              <ul className="grid">
                {g.members.map((m) => (
                  <li key={m.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 py-2 border-b border-line last:border-b-0">
                    <span className="grid min-w-0"><strong className="truncate text-[13px] font-medium text-fg">{m.displayName}</strong><small className="truncate font-mono text-xs text-fg-3">{m.memberRef}</small></span>
                    <Status tone={m.role === 'member' ? 'neutral' : 'ok'}>{m.role}</Status>
                    <div className="col-span-2 flex gap-2">
                      <Button>{m.role === 'member' ? 'Promote' : 'Demote'}</Button>
                      <Button variant="danger">Remove…</Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Panel>
          <Panel title="Danger zone" description="Leaving removes the active account from this group.">
            <Button variant="danger">Leave group…</Button>
          </Panel>
        </div>
      </Drawer>
    </div>
  );
}
