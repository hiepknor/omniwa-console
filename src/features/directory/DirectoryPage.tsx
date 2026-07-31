import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useApiSession } from '@/api/ApiProvider';
import { useServerCapabilities } from '@/api/CapabilitiesProvider';
import { updateSearchParams, withSearchParams } from '@/lib/url-search-state';
import { useInvalidCursorReset } from '@/lib/useInvalidCursorReset';
import { ProjectionFailureNotice as FailureNotice, ProjectionStatus } from '@/components/ProjectionReadState';
import { Button, CountBadge, CursorPagination, Field, FilterToolbar, Input, PageHeader, SplitWorkspace, StateNotice, Tabs, useWorkspacePageFocus, WorkspacePageFrame, WorkspacePaneHeader } from '@/ui';
import { DirectoryDetails } from './Details';
import { ContactList, LabelList } from './DirectoryView';
import { useContact, useContacts, useLabel, useLabels } from './hooks';
import { directoryRouteState, type DirectoryView, updateDirectoryParams } from './route-state';

function BlockedPage({ title, detail }: { title: string; detail: string }) {
  return <div className="grid gap-6 p-6 max-sm:p-4"><PageHeader eyebrow="Messaging" title="Directory" description="Inspect canonical contacts and projected label definitions." /><StateNotice kind="empty" title={title} detail={detail} /></div>;
}

function viewFromPath(pathname: string): DirectoryView {
  return pathname.startsWith('/directory/labels') ? 'labels' : 'contacts';
}

export function DirectoryPage() {
  const session = useApiSession();
  const capabilities = useServerCapabilities();
  const location = useLocation();
  const navigate = useNavigate();
  const { contactId, labelId } = useParams();
  const [searchParams] = useSearchParams();
  const route = directoryRouteState(searchParams);
  const view = viewFromPath(location.pathname);
  const selectedId = view === 'contacts' ? contactId : labelId;
  const { compactHeadingRef, rememberFocusOrigin } = useWorkspacePageFocus(selectedId);
  const [searchDraft, setSearchDraft] = useState(route.search);
  useEffect(() => setSearchDraft(route.search), [route.search]);

  const instanceScope = session.keyKind === 'api';
  const cap = (name: string) => capabilities.data?.capabilities.includes(name) ?? false;
  const contactsReady = instanceScope && cap('contacts_projection');
  const labelsReady = instanceScope && cap('labels_projection');
  const canonicalIdentity = cap('canonical_contact_identity');
  const contacts = useContacts(route.search, route.cursor, view === 'contacts' && contactsReady, canonicalIdentity);
  const labels = useLabels(view === 'labels' && labelsReady);
  const contact = useContact(view === 'contacts' ? selectedId : undefined, contactsReady, canonicalIdentity);
  const label = useLabel(view === 'labels' ? selectedId : undefined, labelsReady);
  const loadedLabels = labels.data?.resource ?? [];
  const filteredLabels = useMemo(() => {
    const term = route.search.trim().toLocaleLowerCase();
    return loadedLabels.filter((item) => !term || item.id.toLocaleLowerCase().includes(term) || item.name?.toLocaleLowerCase().includes(term));
  }, [loadedLabels, route.search]);
  const currentQuery = view === 'contacts' ? contacts : labels;
  const detailQuery = view === 'contacts' ? contact : label;
  const advertised = view === 'contacts' ? contactsReady : labelsReady;
  const viewSupported = advertised || currentQuery.data !== undefined;
  const currentMeta = currentQuery.data?.meta;
  const authoritative = currentMeta?.syncStatus === undefined || currentMeta.syncStatus === 'ready';
  const items = view === 'contacts' ? contacts.data?.resource.items ?? [] : filteredLabels;
  const total = view === 'contacts' ? contacts.data?.resource.total : labels.data?.resource.length;
  const empty = Boolean(viewSupported && currentQuery.data && authoritative && items.length === 0);
  const selectedName = view === 'contacts'
    ? contact.data?.resource.displayName ?? (contact.data?.resource ? 'Unknown contact' : undefined)
    : label.data?.resource.name ?? (label.data?.resource ? 'Unknown label' : undefined);
  const basePath = `/directory/${view}`;
  const switchView = (next: string) => navigate(`/directory/${next}`);
  const select = (id: string) => { rememberFocusOrigin(); navigate(withSearchParams(`${basePath}/${encodeURIComponent(id)}`, searchParams)); };
  const close = () => navigate(withSearchParams(basePath, searchParams));
  const applySearch = () => navigate(withSearchParams(basePath, updateDirectoryParams(searchParams, { search: searchDraft.trim() }, ['cursor'])), { replace: true });
  const refreshDirectory = () => { if (advertised) void currentQuery.refetch(); };
  const refreshDetail = () => { if (advertised && selectedId) void detailQuery.refetch(); };
  const refresh = () => { refreshDirectory(); refreshDetail(); };
  const refreshing = currentQuery.isFetching || detailQuery.isFetching;
  useInvalidCursorReset(contacts.error, route.cursor, () => navigate(withSearchParams(basePath, updateDirectoryParams(searchParams, { cursor: undefined })), { replace: true }));

  useEffect(() => {
    const returnedId = contact.data?.resource.id;
    if (canonicalIdentity && view === 'contacts' && selectedId && returnedId && returnedId !== selectedId) {
      navigate(withSearchParams(`/directory/contacts/${encodeURIComponent(returnedId)}`, searchParams), { replace: true });
    }
  }, [canonicalIdentity, contact.data?.resource.id, navigate, searchParams, selectedId, view]);

  if (!instanceScope) return <BlockedPage title="Instance credential required" detail="Directory requires an instance credential. Admin scope cannot read token-scoped projections, and no request was sent." />;
  if (capabilities.isPending) return <BlockedPage title="Discovering capabilities" detail="Discovering instance capabilities before enabling projection reads." />;
  if (capabilities.isError && currentQuery.data === undefined) return <BlockedPage title="Unsupported" detail="Capability discovery failed. Directory projections remain disabled; no fallback read was sent." />;

  return (
    <WorkspacePageFrame
      eyebrow="Messaging"
      title="Directory"
      description="Inspect canonical contacts and projected label definitions."
      secondaryActions={<Button disabled={!advertised || refreshing} onClick={refresh}>{refreshing ? 'Refreshing…' : 'Refresh'}</Button>}
      compactTitle={selectedId ? selectedName ?? `${view === 'contacts' ? 'Contact' : 'Label'} details` : 'Directory'}
      compactDescription={selectedId ? (view === 'contacts' ? 'Projected contact' : 'Projected label') : view === 'contacts' ? 'Contacts' : 'Labels'}
      compactLeadingAction={selectedId ? <Button onClick={close}>Back</Button> : undefined}
      compactActions={<Button disabled={!advertised || refreshing} onClick={selectedId ? refreshDetail : refreshDirectory}>{refreshing ? 'Refreshing…' : 'Refresh'}</Button>}
      compactHeadingRef={compactHeadingRef}
    >
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Tabs className={selectedId ? 'max-[900px]:hidden' : undefined} active={view} onChange={switchView} tabs={[{ id: 'contacts', label: 'Contacts', panelId: 'directory-panel' }, { id: 'labels', label: 'Labels', panelId: 'directory-panel' }]} />
        <div id="directory-panel" role="tabpanel" aria-labelledby={`directory-panel-${view}-tab`} className="flex min-h-0 min-w-0 flex-1">
        <SplitWorkspace
          frame="attached"
          detailOpen={Boolean(selectedId)}
          directoryLabel={`${view} directory`}
          detailLabel={`${view === 'contacts' ? 'Contact' : 'Label'} details`}
          directoryScrollKey={JSON.stringify([view, route.search, route.cursor])}
          detailScrollKey={selectedId}
          directory={(
            <>
              <div className="sticky top-0 z-10 bg-surface">
                <WorkspacePaneHeader
                  title={<span className="inline-flex items-center gap-2">{view === 'contacts' ? 'Contacts' : 'Labels'}{typeof total === 'number' ? <CountBadge count={total} /> : null}</span>}
                  description={route.search ? `${view === 'contacts' ? 'Normalized search' : 'Filtered definitions'} for “${route.search}”` : view === 'contacts' ? 'Canonical projected identities' : 'Projected definitions'}
                />
                <FilterToolbar as="form" className="border-b-0" onSubmit={(event) => { event.preventDefault(); applySearch(); }}>
                  <Field label={view === 'contacts' ? 'Search contacts' : 'Filter labels'} className="min-w-48 flex-1">
                    {(id) => <Input id={id} type="search" value={searchDraft} placeholder={view === 'contacts' ? 'Name, ID, alias, or username' : 'Name or label ID'} onChange={(event) => setSearchDraft(event.target.value)} />}
                  </Field>
                  <div className="flex items-end"><Button type="submit" disabled={searchDraft.trim() === route.search}>Apply</Button></div>
                </FilterToolbar>
              </div>
              {!viewSupported ? <div className="p-3"><StateNotice kind="empty" title="Projection unavailable" detail={`The backend does not currently advertise ${view === 'contacts' ? 'contacts_projection' : 'labels_projection'}; capability polling continues because the projection may be unsupported or waiting for readiness.`} /></div> : null}
              {viewSupported && !advertised ? <div className="p-3"><StateNotice kind="empty" title="Capability changed" detail="Keeping the last usable projection snapshot visible while capability discovery no longer advertises this resource." /></div> : null}
              {viewSupported && currentQuery.isPending ? <div className="p-3"><StateNotice kind="loading" title={`Loading ${view}`} /></div> : null}
              {viewSupported && currentQuery.error && !currentQuery.data ? <div className="p-3"><FailureNotice error={currentQuery.error} onRetry={refreshDirectory} /></div> : null}
              {viewSupported && currentQuery.data ? <>
                {currentQuery.error ? <div className="p-3"><FailureNotice error={currentQuery.error} stale onRetry={refreshDirectory} /></div> : null}
                <div className="px-3"><ProjectionStatus meta={currentMeta} /></div>
                {view === 'contacts' ? <ContactList items={contacts.data?.resource.items ?? []} selectedId={selectedId} onSelect={select} /> : <LabelList items={filteredLabels} selectedId={selectedId} onSelect={select} />}
                {empty ? <div className="p-3"><StateNotice kind="empty" title="Empty" detail={route.search ? `No projected ${view === 'contacts' ? 'contact' : 'label'} matches the URL-backed search.` : `The ready ${view === 'contacts' ? 'Contact' : 'Label'} projection contains no items.`} /></div> : null}
              </> : null}
            </>
          )}
          directoryFooter={view === 'contacts' && viewSupported && contacts.data ? <CursorPagination cursor={route.cursor} nextCursor={contacts.data.resource.pagination.nextCursor ?? undefined} onCursor={(cursor) => navigate(withSearchParams(basePath, updateSearchParams(searchParams, { cursor })), { replace: true })} /> : undefined}
          detail={(
            <>
              <WorkspacePaneHeader className="max-[900px]:hidden" title={selectedName ?? `${view === 'contacts' ? 'Contact' : 'Label'} details`} description={selectedId ? `Projected ${view === 'contacts' ? 'contact identity' : 'label definition'}` : `Select a projected ${view === 'contacts' ? 'contact' : 'label'} to inspect its details`} />
              {!selectedId ? <div className="p-4"><StateNotice kind="empty" title={`No ${view === 'contacts' ? 'contact' : 'label'} selected`} detail={`Select a projected ${view === 'contacts' ? 'contact' : 'label'} from the directory.`} /></div> : !viewSupported ? <div className="p-4"><StateNotice kind="empty" title="Projection unavailable" /></div> : <DirectoryDetails contact={contact.data?.resource} label={label.data?.resource} meta={detailQuery.data?.meta} error={detailQuery.error} loading={detailQuery.isPending} onRetry={refreshDetail} />}
            </>
          )}
        />
        </div>
      </div>
    </WorkspacePageFrame>
  );
}
