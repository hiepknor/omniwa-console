import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useApiSession } from '@/api/ApiProvider';
import { useServerCapabilities } from '@/api/CapabilitiesProvider';
import { omitSearchParams, updateSearchParams, withSearchParams } from '@/lib/url-search-state';
import { useInvalidCursorReset } from '@/lib/useInvalidCursorReset';
import { ProjectionFailureNotice as FailureNotice, ProjectionStatus } from '@/components/ProjectionReadState';
import { CountBadge, CursorPagination, Drawer, Field, FilterToolbar, IconButton, Input, PageHeader, StateNotice, WorkspacePageFrame } from '@/ui';
import { DirectoryDetails } from './Details';
import { ContactTable, LabelList } from './DirectoryView';
import { useContact, useContacts, useLabel, useLabels } from './hooks';
import { contactRegistryLocation, contactsRouteState, labelCatalogLocation, updateContactsParams } from './route-state';

function BlockedPage({ title, detail }: { title: string; detail: string }) {
  return <div className="grid gap-6 p-6 max-sm:p-4"><PageHeader eyebrow="Messaging" title="Contacts" description="Inspect canonical contacts and the projected label catalog." /><StateNotice kind="empty" title={title} detail={detail} /></div>;
}

export function ContactsPage() {
  const session = useApiSession();
  const capabilities = useServerCapabilities();
  const navigate = useNavigate();
  const { contactId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const route = contactsRouteState(searchParams);
  const labelsOpen = route.panel === 'labels';
  const selectedContactId = labelsOpen ? undefined : contactId;
  const [searchDraft, setSearchDraft] = useState(route.search);
  const [labelSearchDraft, setLabelSearchDraft] = useState(route.labelSearch);
  useEffect(() => setSearchDraft(route.search), [route.search]);
  useEffect(() => setLabelSearchDraft(route.labelSearch), [route.labelSearch]);

  const instanceScope = session.keyKind === 'api';
  const cap = (name: string) => capabilities.data?.capabilities.includes(name) ?? false;
  const contactsReady = instanceScope && cap('contacts_projection');
  const labelsReady = instanceScope && cap('labels_projection');
  const canonicalIdentity = cap('canonical_contact_identity');
  const contacts = useContacts(route.search, route.cursor, contactsReady, canonicalIdentity);
  const contact = useContact(selectedContactId, contactsReady, canonicalIdentity);
  const labels = useLabels(labelsOpen && labelsReady);
  const label = useLabel(labelsOpen ? route.labelId : undefined, labelsReady);
  const loadedLabels = labels.data?.resource ?? [];
  const filteredLabels = useMemo(() => {
    const term = route.labelSearch.toLocaleLowerCase();
    return loadedLabels.filter((item) => !term || item.id.toLocaleLowerCase().includes(term) || item.name?.toLocaleLowerCase().includes(term));
  }, [loadedLabels, route.labelSearch]);

  const contactsSupported = contactsReady || contacts.data !== undefined;
  const labelsSupported = labelsReady || labels.data !== undefined;
  const contactsAuthoritative = contacts.data?.meta?.syncStatus === undefined || contacts.data.meta.syncStatus === 'ready';
  const labelsAuthoritative = labels.data?.meta?.syncStatus === undefined || labels.data.meta.syncStatus === 'ready';
  const contactsEmpty = Boolean(contactsSupported && contacts.data && contactsAuthoritative && contacts.data.resource.items.length === 0);
  const labelsEmpty = Boolean(labelsSupported && labels.data && labelsAuthoritative && filteredLabels.length === 0);
  const selectedName = contact.data?.resource.displayName ?? contact.data?.resource.phoneNumber ?? (contact.data?.resource ? 'Unknown contact' : undefined);
  const selectedLabelName = label.data?.resource.name ?? (label.data?.resource ? 'Unknown label' : undefined);
  const replaceParams = (next: URLSearchParams) => setSearchParams(next, { replace: true });
  const replaceContactList = (next: URLSearchParams) => navigate(withSearchParams('/contacts', next), { replace: true });
  const selectContact = (id: string) => navigate(withSearchParams(`/contacts/${encodeURIComponent(id)}`, omitSearchParams(searchParams, ['panel', 'label', 'labelSearch'])));
  const closeContact = () => navigate(contactRegistryLocation(searchParams));
  const openLabels = () => navigate(labelCatalogLocation(searchParams), { replace: true });
  const closeLabels = () => navigate(contactRegistryLocation(searchParams), { replace: true });
  const selectLabel = (id: string) => replaceParams(updateSearchParams(searchParams, { panel: 'labels', label: id }));
  const closeLabel = () => replaceParams(updateSearchParams(searchParams, { label: undefined }));
  const applySearch = () => replaceContactList(updateContactsParams(searchParams, { search: searchDraft.trim() }, ['cursor']));
  const applyLabelSearch = () => replaceParams(updateContactsParams(searchParams, { panel: 'labels', labelSearch: labelSearchDraft.trim(), label: undefined }));
  const refreshContacts = () => { if (contactsReady) void contacts.refetch(); };
  const refreshContact = () => { if (contactsReady && selectedContactId) void contact.refetch(); };
  const refreshPage = () => { refreshContacts(); refreshContact(); };
  const refreshLabels = () => { if (labelsReady) void labels.refetch(); if (labelsReady && route.labelId) void label.refetch(); };
  const contactsRefreshing = contacts.isFetching || contact.isFetching;
  useInvalidCursorReset(contacts.error, route.cursor, () => replaceContactList(updateContactsParams(searchParams, { cursor: undefined })));

  useEffect(() => {
    const returnedId = contact.data?.resource.id;
    if (canonicalIdentity && selectedContactId && returnedId && returnedId !== selectedContactId) {
      navigate(withSearchParams(`/contacts/${encodeURIComponent(returnedId)}`, searchParams), { replace: true });
    }
  }, [canonicalIdentity, contact.data?.resource.id, navigate, searchParams, selectedContactId]);

  useEffect(() => {
    if (labelsOpen && contactId) navigate(labelCatalogLocation(searchParams), { replace: true });
  }, [contactId, labelsOpen, navigate, searchParams]);

  if (!instanceScope) return <BlockedPage title="Instance credential required" detail="Contacts requires an instance credential. Admin scope cannot read token-scoped projections, and no request was sent." />;
  if (capabilities.isPending) return <BlockedPage title="Discovering capabilities" detail="Discovering instance capabilities before enabling projection reads." />;
  if (capabilities.isError && contacts.data === undefined) return <BlockedPage title="Unsupported" detail="Capability discovery failed. Contact projections remain disabled; no fallback read was sent." />;

  const labelCatalog = route.labelId ? (
    <div className="grid gap-4">
      <div><IconButton icon="arrow-left" label="Back to labels" onClick={closeLabel} /></div>
      {!labelsSupported || (!labelsReady && !label.data?.resource) ? <StateNotice kind="empty" title="Label projection unavailable" detail="The selected definition cannot be read because labels_projection is not advertised." /> : <DirectoryDetails label={label.data?.resource} meta={label.data?.meta} error={label.error} loading={label.isPending} onRetry={refreshLabels} />}
    </div>
  ) : (
    <div className="grid gap-3">
      <FilterToolbar as="form" className="border" onSubmit={(event) => { event.preventDefault(); applyLabelSearch(); }}>
        <Field label="Filter labels" className="min-w-48 flex-1">
          {(id) => <Input id={id} type="search" value={labelSearchDraft} placeholder="Name or label ID" onChange={(event) => setLabelSearchDraft(event.target.value)} />}
        </Field>
        <div className="flex items-end"><IconButton type="submit" icon="search" label="Apply label filter" disabled={labelSearchDraft.trim() === route.labelSearch} /></div>
      </FilterToolbar>
      {!labelsSupported ? <StateNotice kind="empty" title="Label projection unavailable" detail="The backend does not currently advertise labels_projection. Contacts remain available independently." /> : null}
      {labelsSupported && !labelsReady ? <StateNotice kind="empty" title="Label capability changed" detail="Keeping the last usable label snapshot visible while capability discovery no longer advertises this projection." /> : null}
      {labelsSupported && labels.isPending ? <StateNotice kind="loading" title="Loading labels" /> : null}
      {labelsSupported && labels.error && !labels.data ? <FailureNotice error={labels.error} onRetry={refreshLabels} /> : null}
      {labelsSupported && labels.data ? <>
        {labels.error ? <FailureNotice error={labels.error} stale onRetry={refreshLabels} /> : null}
        <ProjectionStatus meta={labels.data.meta} />
        <div className="flex items-center justify-between gap-3 border-b border-line pb-2"><strong className="text-sm font-semibold">Label definitions</strong><CountBadge count={filteredLabels.length} /></div>
        <LabelList items={filteredLabels} selectedId={route.labelId} onSelect={selectLabel} />
        {labelsEmpty ? <StateNotice kind="empty" title="No labels" detail={route.labelSearch ? 'No projected Label matches the URL-backed filter.' : 'The ready Label projection contains no definitions.'} /> : null}
      </> : null}
    </div>
  );

  return (
    <WorkspacePageFrame
      eyebrow="Messaging"
      title={<span className="inline-flex items-center gap-2">Contacts{typeof contacts.data?.resource.total === 'number' ? <CountBadge count={contacts.data.resource.total} /> : null}</span>}
      description="Inspect canonical contacts and consult projected label definitions."
      secondaryActions={<><IconButton icon="tag" label="Open Label catalog" onClick={openLabels} /><IconButton icon="refresh" label="Refresh contacts" disabled={!contactsReady} busy={contactsRefreshing} onClick={refreshPage} /></>}
      compactTitle="Contacts"
      compactDescription="Canonical projected identities"
      compactActions={<><IconButton icon="tag" label="Open Labels" onClick={openLabels} /><IconButton icon="refresh" label="Refresh contacts" disabled={!contactsReady} busy={contactsRefreshing} onClick={refreshContacts} /></>}
    >
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-4 max-sm:p-3">
        <div className="grid gap-3">
          <FilterToolbar as="form" className="border" onSubmit={(event) => { event.preventDefault(); applySearch(); }}>
            <Field label="Search contacts" className="min-w-48 flex-1">
              {(id) => <Input id={id} type="search" value={searchDraft} placeholder="Name, phone, ID, alias, or username" onChange={(event) => setSearchDraft(event.target.value)} />}
            </Field>
            <div className="flex items-end"><IconButton type="submit" icon="search" label="Apply contact search" disabled={searchDraft.trim() === route.search} /></div>
          </FilterToolbar>
          {!contactsSupported ? <StateNotice kind="empty" title="Projection unavailable" detail="The backend does not currently advertise contacts_projection; capability polling continues because the projection may be unsupported or waiting for readiness." /> : null}
          {contactsSupported && !contactsReady ? <StateNotice kind="empty" title="Capability changed" detail="Keeping the last usable Contact projection snapshot visible." /> : null}
          {contactsSupported && contacts.isPending ? <StateNotice kind="loading" title="Loading contacts" /> : null}
          {contactsSupported && contacts.error && !contacts.data ? <FailureNotice error={contacts.error} onRetry={refreshContacts} /> : null}
          {contactsSupported && contacts.data ? <>
            {contacts.error ? <FailureNotice error={contacts.error} stale onRetry={refreshContacts} /> : null}
            <ProjectionStatus meta={contacts.data.meta} />
            <ContactTable items={contacts.data.resource.items} selectedId={contactId} onSelect={selectContact} />
            {contactsEmpty ? <StateNotice kind="empty" title="No contacts" detail={route.search ? 'No projected Contact matches the URL-backed search.' : 'The ready Contact projection contains no items.'} /> : null}
            <CursorPagination cursor={route.cursor} nextCursor={contacts.data.resource.pagination.nextCursor ?? undefined} info={`${contacts.data.resource.items.length} shown on this page`} onCursor={(cursor) => replaceContactList(updateSearchParams(searchParams, { cursor }))} />
          </> : null}
        </div>
      </div>
      <Drawer
        open={labelsOpen || Boolean(selectedContactId)}
        onClose={labelsOpen ? closeLabels : closeContact}
        title={labelsOpen ? route.labelId ? selectedLabelName ?? 'Label details' : 'Label catalog' : selectedName ?? 'Contact details'}
        subtitle={labelsOpen ? route.labelId : selectedContactId}
      >
        {labelsOpen ? labelCatalog : !contactsSupported || (!contactsReady && !contact.data?.resource) ? <StateNotice kind="empty" title="Contact detail unavailable" detail="The cached directory remains visible, but this Contact cannot be read while contacts_projection is not advertised." /> : <DirectoryDetails contact={contact.data?.resource} meta={contact.data?.meta} error={contact.error} loading={contact.isPending} onRetry={refreshContact} />}
      </Drawer>
    </WorkspacePageFrame>
  );
}
