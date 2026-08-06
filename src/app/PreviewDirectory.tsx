import { useMemo, useState } from 'react';
import { ContactTable, LabelList } from '@/features/directory/DirectoryView';
import { DirectoryDetails } from '@/features/directory/Details';
import { Button, CountBadge, CursorPagination, Drawer, Field, FilterToolbar, IconButton, Input, Panel, WorkspacePageFrame } from '@/ui';
import { contactsFixture, labelsFixture } from './preview-fixtures';

/** Dev-only: full-width Contacts registry with the projected Label catalog open. */
export function PreviewDirectory() {
  const [contactId, setContactId] = useState<string>();
  const [labelId, setLabelId] = useState<string>();
  const [labelsOpen, setLabelsOpen] = useState(true);
  const [search, setSearch] = useState('');
  const [labelSearch, setLabelSearch] = useState('');
  const contacts = useMemo(() => contactsFixture.filter((item) => !search || JSON.stringify(item).toLocaleLowerCase().includes(search.toLocaleLowerCase())), [search]);
  const labels = useMemo(() => labelsFixture.filter((item) => !labelSearch || JSON.stringify(item).toLocaleLowerCase().includes(labelSearch.toLocaleLowerCase())), [labelSearch]);
  const contact = contactsFixture.find((item) => item.id === contactId);
  const label = labelsFixture.find((item) => item.id === labelId);
  const closeDrawer = () => {
    if (labelsOpen) {
      setLabelsOpen(false);
      setLabelId(undefined);
    } else setContactId(undefined);
  };
  const labelCatalog = label ? (
    <div className="grid gap-4"><div><IconButton icon="arrow-left" label="Back to labels" onClick={() => setLabelId(undefined)} /></div><DirectoryDetails label={label} loading={false} onRetry={() => {}} /></div>
  ) : (
    <div className="grid gap-3">
      <FilterToolbar as="form" className="border" onSubmit={(event) => event.preventDefault()}><Field label="Filter labels" className="min-w-48 flex-1">{(id) => <Input id={id} type="search" value={labelSearch} placeholder="Name or label ID" onChange={(event) => setLabelSearch(event.target.value)} />}</Field><div className="flex items-end"><IconButton type="submit" icon="search" label="Apply label filter" /></div></FilterToolbar>
      <div className="flex items-center justify-between gap-3 border-b border-line pb-2"><strong className="text-sm font-semibold">Label definitions</strong><CountBadge count={labels.length} /></div>
      <LabelList items={labels} selectedId={labelId} onSelect={setLabelId} />
    </div>
  );
  return (
    <main className="h-dvh overflow-hidden bg-bg">
      <WorkspacePageFrame eyebrow="Messaging" title={<span className="inline-flex items-center gap-2">Contacts<CountBadge count={contactsFixture.length} /></span>} description="Search and inspect canonical contact records." secondaryActions={<><IconButton icon="tag" label="Open Label catalog" onClick={() => setLabelsOpen(true)} /><Button>Refresh</Button></>} compactTitle="Contacts" compactDescription="Canonical contact registry" compactActions={<><IconButton icon="tag" label="Open Labels" onClick={() => setLabelsOpen(true)} /><Button>Refresh</Button></>}>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 max-sm:p-3"><Panel title="Contact directory" description="Applied search, opaque cursor, and selected Contact remain URL-addressable." bodyPadding="none">
          <FilterToolbar as="form" onSubmit={(event) => event.preventDefault()}><Field label="Search contacts" className="min-w-48 flex-1">{(id) => <Input id={id} type="search" value={search} placeholder="Name, phone, ID, alias, or username" onChange={(event) => setSearch(event.target.value)} />}</Field><div className="flex items-end"><IconButton type="submit" icon="search" label="Apply contact search" /></div></FilterToolbar>
          <ContactTable className="border-0" items={contacts} selectedId={contactId} onSelect={(id) => { setLabelsOpen(false); setContactId(id); }} />
          <CursorPagination nextCursor="contacts-next" info={`${contacts.length} shown on this page`} onCursor={() => {}} />
        </Panel></div>
        <Drawer open={labelsOpen || Boolean(contactId)} onClose={closeDrawer} title={labelsOpen ? label?.name ?? 'Label catalog' : contact?.displayName ?? 'Contact details'} subtitle={labelsOpen ? label?.id : contact?.id}>
          {labelsOpen ? labelCatalog : contact ? <DirectoryDetails contact={contact} loading={false} onRetry={() => {}} /> : null}
        </Drawer>
      </WorkspacePageFrame>
    </main>
  );
}
