import { useMemo, useState } from 'react';
import { ContactList, LabelList } from '@/features/directory/DirectoryView';
import { DirectoryDetails } from '@/features/directory/Details';
import { Button, CountBadge, Field, FilterToolbar, Input, SplitWorkspace, Tabs, useWorkspacePageFocus, WorkspacePageFrame, WorkspacePaneHeader } from '@/ui';
import { contactsFixture, labelsFixture } from './preview-fixtures';

/** Dev-only: projected Contacts and Labels directory with responsive list/detail behavior. */
export function PreviewDirectory() {
  const [view, setView] = useState<'contacts' | 'labels'>('contacts');
  const [selectedId, setSelectedId] = useState<string>();
  const [search, setSearch] = useState('');
  const { compactHeadingRef, rememberFocusOrigin } = useWorkspacePageFocus(selectedId);
  const items = view === 'contacts' ? contactsFixture : labelsFixture;
  const filtered = useMemo(() => items.filter((item) => !search || JSON.stringify(item).toLocaleLowerCase().includes(search.toLocaleLowerCase())), [items, search]);
  const contact = view === 'contacts' ? contactsFixture.find((item) => item.id === selectedId) : undefined;
  const label = view === 'labels' ? labelsFixture.find((item) => item.id === selectedId) : undefined;
  const selectedName = contact?.displayName ?? label?.name;
  const switchView = (next: string) => { setView(next as 'contacts' | 'labels'); setSelectedId(undefined); setSearch(''); };
  const select = (id: string) => { rememberFocusOrigin(); setSelectedId(id); };
  return (
    <main className="h-dvh overflow-hidden bg-bg">
      <WorkspacePageFrame
        eyebrow="Messaging"
        title="Directory"
        description="Inspect canonical contacts and projected label definitions."
        secondaryActions={<Button>Refresh</Button>}
        compactTitle={selectedId ? selectedName ?? `${view === 'contacts' ? 'Contact' : 'Label'} details` : 'Directory'}
        compactDescription={selectedId ? `Projected ${view === 'contacts' ? 'contact' : 'label'}` : view === 'contacts' ? 'Contacts' : 'Labels'}
        compactLeadingAction={selectedId ? <Button onClick={() => setSelectedId(undefined)}>Back</Button> : undefined}
        compactActions={<Button>Refresh</Button>}
        compactHeadingRef={compactHeadingRef}
      >
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <Tabs className={selectedId ? 'max-[900px]:hidden' : undefined} active={view} onChange={switchView} tabs={[{ id: 'contacts', label: 'Contacts', panelId: 'directory-preview' }, { id: 'labels', label: 'Labels', panelId: 'directory-preview' }]} />
          <div id="directory-preview" role="tabpanel" aria-labelledby={`directory-preview-${view}-tab`} className="flex min-h-0 min-w-0 flex-1">
          <SplitWorkspace
            frame="attached"
            detailOpen={Boolean(selectedId)}
            directoryLabel={`${view} directory preview`}
            detailLabel={`${view} detail preview`}
            directoryScrollKey={`${view}:${search}`}
            detailScrollKey={selectedId}
            directory={<>
              <div className="sticky top-0 z-10 bg-surface">
                <WorkspacePaneHeader title={<span className="inline-flex items-center gap-2">{view === 'contacts' ? 'Contacts' : 'Labels'}<CountBadge count={filtered.length} /></span>} description={view === 'contacts' ? 'Canonical projected identities' : 'Projected definitions'} />
                <FilterToolbar as="form" className="border-b-0" onSubmit={(event) => event.preventDefault()}>
                  <Field label={view === 'contacts' ? 'Search contacts' : 'Filter labels'} className="min-w-48 flex-1">{(id) => <Input id={id} type="search" value={search} placeholder={view === 'contacts' ? 'Name, ID, alias, or username' : 'Name or label ID'} onChange={(event) => setSearch(event.target.value)} />}</Field>
                  <div className="flex items-end"><Button type="submit">Apply</Button></div>
                </FilterToolbar>
              </div>
              {view === 'contacts' ? <ContactList items={filtered as typeof contactsFixture} selectedId={selectedId} onSelect={select} /> : <LabelList items={filtered as typeof labelsFixture} selectedId={selectedId} onSelect={select} />}
            </>}
            detail={<>
              <WorkspacePaneHeader className="max-[900px]:hidden" title={selectedName ?? `${view === 'contacts' ? 'Contact' : 'Label'} details`} description={selectedId ? `Projected ${view === 'contacts' ? 'contact identity' : 'label definition'}` : `Select a projected ${view === 'contacts' ? 'contact' : 'label'}`} />
              {selectedId ? <DirectoryDetails contact={contact} label={label} loading={false} onRetry={() => {}} /> : null}
            </>}
          />
          </div>
        </div>
      </WorkspacePageFrame>
    </main>
  );
}
