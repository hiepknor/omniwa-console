import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useBeforeUnload, useBlocker, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ApiFailure } from '@/api/envelopes';
import { useApiSession } from '@/api/ApiProvider';
import { useServerCapabilities } from '@/api/CapabilitiesProvider';
import { ApiFailureNotice } from '@/components/ApiFailureNotice';
import { eligibilityIssues, type GroupEligibility, type GroupListEntry } from '@/api/group-lists';
import { humanizeToken } from '@/lib/format';
import { omitSearchParams, updateSearchParams, withSearchParams } from '@/lib/url-search-state';
import { useInvalidCursorReset } from '@/lib/useInvalidCursorReset';
import { Button, Checkbox, CursorPagination, DateTimeInput, DescriptionItem, DescriptionList, Dialog, Field, FilterToolbar, IconButton, Input, MetadataBadge, PageHeader, Panel, SelectionBar, SelectionReview, StateNotice, Status, Table, Td, Textarea, Th, Tr, type SelectionReviewItem, type Tone } from '@/ui';
import { GroupSectionTabs } from './GroupSectionTabs';
import { GroupTargetEligibility, GroupTargetIdentity, ProjectedMemberCount } from './GroupTargetCells';
import { groupStatusTone } from './group-status-tone';
import { editorSnapshotChanged, groupListEditorDiff, type GroupListEditorSnapshot } from './group-list-editor-state';
import { pageSelectionState, selectionsOutsidePage, setPageSelection, type GroupSelectionCandidate, type SelectedGroup } from './group-list-selection';
import { groupListRouteState, setGroupListParam } from './group-list-route-state';
import { useGroups } from './hooks';
import { useAllGroupListEntries, useCreateGroupList, useGroupEligibility, useGroupList, useUpdateGroupList } from '@/api/group-list-hooks';

function localNow(): string {
  const date = new Date(Date.now() - new Date().getTimezoneOffset() * 60_000);
  return date.toISOString().slice(0, 16);
}

function EditorStatePage({ title, description, children, actions }: { title: string; description: string; children: ReactNode; actions?: ReactNode }) {
  return <div className="grid gap-6 p-6 max-sm:p-4"><PageHeader eyebrow="Messaging" title={title} description={description} /><GroupSectionTabs />{children}{actions ? <div className="flex flex-wrap justify-end gap-2 border-t border-line pt-4">{actions}</div> : null}</div>;
}

export function GroupListEditorPage() {
  const { groupListId } = useParams();
  const editing = Boolean(groupListId);
  const session = useApiSession();
  const capabilities = useServerCapabilities();
  const readEnabled = session.keyKind === 'api' && (capabilities.data?.capabilities.includes('group_lists') ?? false);
  const commandsEnabled = readEnabled && !capabilities.isPending && !capabilities.isError;
  const groupsReady = capabilities.data?.capabilities.includes('groups_projection') ?? false;
  const eligibilityEnabled = capabilities.data?.capabilities.includes('group_list_eligibility') ?? false;
  const normalizedGroups = capabilities.data?.capabilities.includes('group_management_permissions') ?? false;
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const route = groupListRouteState(params);
  const [searchDraft, setSearchDraft] = useState(route.groupSearch);
  const detail = useGroupList(groupListId, readEnabled && editing);
  const allEntries = useAllGroupListEntries(groupListId, detail.data?.groupCount, readEnabled && editing && Boolean(detail.data));
  const groups = useGroups({ search: route.groupSearch, cursor: route.groupSearchCursor }, readEnabled && groupsReady, normalizedGroups);
  const create = useCreateGroupList();
  const update = useUpdateGroupList(groupListId ?? '');
  const mutation = editing ? update : create;
  const initialized = useRef(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [source, setSource] = useState('operator_attestation');
  const [evidence, setEvidence] = useState('');
  const [authorizedAt, setAuthorizedAt] = useState(localNow);
  const [selected, setSelected] = useState<Map<string, SelectedGroup>>(new Map());
  const baseline = useRef<GroupListEditorSnapshot>({ name: '', description: '', source: 'operator_attestation', authorizedAt, selectedIds: [] });
  const allowNavigation = useRef(false);
  const versionConflict = mutation.error instanceof ApiFailure && mutation.error.code === 'group_list_version_conflict';
  const directoryParams = omitSearchParams(params, ['groupSearch', 'groupSearchCursor', 'tab', 'groupCursor', 'auditCursor', 'notice']);
  const directoryUrl = withSearchParams('/groups/lists', directoryParams);
  const detailUrl = groupListId ? withSearchParams(`/groups/lists/${encodeURIComponent(groupListId)}`, directoryParams) : directoryUrl;

  useEffect(() => setSearchDraft(route.groupSearch), [route.groupSearch]);
  useEffect(() => {
    if (versionConflict) setEvidence('');
  }, [versionConflict]);

  const initializeEditor = useCallback((list: NonNullable<typeof detail.data>, entries: GroupListEntry[]) => {
    const nextAuthorizedAt = localNow();
    const selectedIds = entries.map((entry) => entry.groupJid);
    baseline.current = { name: list.name, description: list.description ?? '', source: list.authorizationSource ?? 'operator_attestation', authorizedAt: nextAuthorizedAt, selectedIds };
    setName(list.name);
    setDescription(list.description ?? '');
    setSource(list.authorizationSource ?? 'operator_attestation');
    setAuthorizedAt(nextAuthorizedAt);
    setSelected(new Map(entries.map((entry) => [entry.groupJid, { label: entry.currentName ?? entry.snapshotName ?? entry.groupJid, eligibility: entry.eligibility, eligibilityReason: entry.eligibilityReason }])));
  }, []);

  useEffect(() => {
    if (!editing || initialized.current || !detail.data || !allEntries.data) return;
    initialized.current = true;
    initializeEditor(detail.data, allEntries.data);
  }, [allEntries.data, detail.data, editing, initializeEditor]);

  const groupItems = useMemo(() => groups.data?.resource?.items ?? [], [groups.data]);
  const eligibility = useGroupEligibility(groupItems.map((group) => group.id), readEnabled && eligibilityEnabled && groupItems.length > 0);
  const eligibilityById = useMemo(() => new Map((eligibility.data?.items ?? []).map((item) => [item.groupJid, item])), [eligibility.data]);
  const pageCandidates = useMemo<GroupSelectionCandidate[]>(() => groupItems.map((group) => {
    const assessment = eligibilityById.get(group.id);
    return { id: group.id, label: group.subject ?? group.id, eligibility: assessment?.eligibility, eligibilityReason: assessment?.eligibilityReason };
  }), [eligibilityById, groupItems]);
  useEffect(() => {
    if (!eligibility.data) return;
    setSelected((current) => {
      const next = new Map(current);
      for (const item of eligibility.data.items) {
        const stored = next.get(item.groupJid);
        if (stored) next.set(item.groupJid, { ...stored, eligibility: item.eligibility, eligibilityReason: item.eligibilityReason });
      }
      return next;
    });
  }, [eligibility.data]);
  const mutationIssues = eligibilityIssues(mutation.error);
  useEffect(() => {
    if (!mutationIssues) return;
    setSelected((current) => {
      const next = new Map(current);
      for (const item of mutationIssues.issues) {
        const stored = next.get(item.groupJid);
        if (stored) next.set(item.groupJid, { ...stored, eligibility: item.eligibility, eligibilityReason: item.eligibilityReason });
      }
      return next;
    });
  }, [mutation.error]);
  const entriesReady = !editing || Boolean(allEntries.data && detail.data?.groupCount !== undefined && detail.data.version !== undefined && allEntries.data.length === detail.data.groupCount);
  const selectedCounts = [...selected.values()].reduce((counts, item) => ({ ...counts, [item.eligibility ?? 'unknown']: counts[item.eligibility ?? 'unknown'] + 1 }), { eligible: 0, unavailable: 0, unknown: 0 } as Record<GroupEligibility, number>);
  const selectedReviewItems = useMemo<SelectionReviewItem[]>(() => [...selectionsOutsidePage(selected, pageCandidates).entries()]
    .sort(([, left], [, right]) => {
      const leftBlocked = left.eligibility === 'unavailable' || left.eligibility === 'unknown';
      const rightBlocked = right.eligibility === 'unavailable' || right.eligibility === 'unknown';
      if (leftBlocked !== rightBlocked) return leftBlocked ? -1 : 1;
      return left.label.localeCompare(right.label);
    })
    .map(([id, item]) => ({
      id,
      label: item.label,
      meta: id,
      detail: item.eligibilityReason ? humanizeToken(item.eligibilityReason) : undefined,
      status: eligibilityEnabled ? humanizeToken(item.eligibility ?? 'unknown') : 'Validated on submit',
      tone: eligibilityEnabled ? item.eligibility === 'eligible' ? 'ok' : item.eligibility === 'unavailable' ? 'failed' : 'degraded' : 'neutral',
    })), [eligibilityEnabled, pageCandidates, selected]);
  const pageSelection = pageSelectionState(selected, pageCandidates);
  const eligibilityAuthoritative = !eligibilityEnabled || (!eligibility.isPending && !eligibility.error && (!eligibility.data?.meta?.syncStatus || eligibility.data.meta.syncStatus === 'ready'));
  const hasBlockedSelection = eligibilityEnabled && (selectedCounts.unavailable > 0 || selectedCounts.unknown > 0);
  const factsComplete = Boolean(name.trim() && source.trim());
  const authorizationComplete = Boolean(evidence.trim() && authorizedAt && !Number.isNaN(Date.parse(authorizedAt)));
  const targetsComplete = selected.size > 0;
  const targetReviewComplete = groupsReady && entriesReady && eligibilityAuthoritative && !hasBlockedSelection;
  const readiness = [
    { label: 'Command authority', ready: commandsEnabled, detail: commandsEnabled ? 'Capability discovery is authoritative.' : 'Wait for authoritative capability discovery.' },
    { label: 'List facts', ready: factsComplete, detail: factsComplete ? 'Name and authorization source are complete.' : 'Name and authorization source are required.' },
    { label: 'Authorization', ready: authorizationComplete, detail: authorizationComplete ? 'Evidence and authorization time are complete.' : 'Evidence reference and a valid authorization time are required.' },
    { label: 'Target selection', ready: targetsComplete && targetReviewComplete, detail: !targetsComplete ? 'Select at least one target.' : targetReviewComplete ? `${selected.size} ${selected.size === 1 ? 'target is' : 'targets are'} ready for server revalidation.` : 'Resolve unavailable, unknown, or stale target eligibility.' },
  ];
  const canSubmit = readiness.every((item) => item.ready) && !versionConflict && !mutation.isPending;
  const currentSnapshot = useMemo<GroupListEditorSnapshot>(() => ({ name, description, source, authorizedAt, selectedIds: [...selected.keys()] }), [authorizedAt, description, name, selected, source]);
  const diff = useMemo(() => groupListEditorDiff(baseline.current, currentSnapshot), [currentSnapshot]);
  const isDirty = evidence.length > 0 || editorSnapshotChanged(baseline.current, currentSnapshot);
  const dirtyRef = useRef(isDirty);
  dirtyRef.current = isDirty;
  const blocker = useBlocker(({ currentLocation, nextLocation }) => !allowNavigation.current && dirtyRef.current && currentLocation.pathname !== nextLocation.pathname);
  useBeforeUnload(useCallback((event) => {
    if (!dirtyRef.current || allowNavigation.current) return;
    event.preventDefault();
    event.returnValue = '';
  }, []));
  const clearFailure = () => { if (mutation.error && !versionConflict) mutation.reset(); };
  const toggle = (jid: string, label: string, assessment?: GroupListEntry) => setSelected((current) => { const next = new Map(current); if (next.has(jid)) next.delete(jid); else if (!eligibilityEnabled || assessment?.eligibility === 'eligible') next.set(jid, { label, eligibility: assessment?.eligibility, eligibilityReason: assessment?.eligibilityReason }); return next; });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    const timestamp = Date.parse(authorizedAt);
    if (Number.isNaN(timestamp)) return;
    const base = { name: name.trim(), description: description.trim() || undefined, groupJids: [...selected.keys()], authorization: { source: source.trim(), evidenceReference: evidence.trim(), authorizedAt: new Date(timestamp).toISOString() } };
    const onSuccess = (result: { id: string }) => {
      allowNavigation.current = true;
      setEvidence('');
      mutation.reset();
      navigate(withSearchParams(`/groups/lists/${encodeURIComponent(result.id)}`, updateSearchParams(directoryParams, { notice: editing ? 'updated' : 'created' })), { replace: true });
    };
    if (editing && detail.data?.version !== undefined) update.mutate({ ...base, expectedVersion: detail.data.version }, { onSuccess });
    else create.mutate(base, { onSuccess });
  };

  const reloadFromServer = async () => {
    setEvidence('');
    mutation.reset();
    initialized.current = false;
    const [freshDetail, freshEntries] = await Promise.all([detail.refetch(), allEntries.refetch()]);
    if (freshDetail.data && freshEntries.data) {
      initialized.current = true;
      initializeEditor(freshDetail.data, freshEntries.data);
    }
  };

  const retryInitialLoad = async () => {
    if (detail.error || !detail.data) await detail.refetch();
    else await allEntries.refetch();
  };

  useInvalidCursorReset(groups.error, route.groupSearchCursor, () => setParams(setGroupListParam(params, 'groupSearchCursor'), { replace: true }));

  if (!readEnabled) return <EditorStatePage title={editing ? 'Edit Group List' : 'Create Group List'} description={editing ? 'Review and replace one complete Group List version.' : 'Create an authorized, reusable set of campaign target groups.'}><StateNotice kind="empty" title="Group Lists unavailable" detail={session.keyKind !== 'api' ? 'An instance credential is required.' : capabilities.isError ? 'Capability discovery failed and no cached Group List data is available.' : 'The backend does not advertise group_lists.'} /></EditorStatePage>;
  if (editing && detail.data && (detail.data.groupCount === undefined || detail.data.version === undefined)) return <EditorStatePage title="Edit Group List" description="Review and replace one complete Group List version." actions={<><Button onClick={() => navigate(detailUrl)}>Return to Group List</Button><Button onClick={() => void detail.refetch()}>Retry</Button></>}><StateNotice kind="error" title="Group List facts incomplete" detail="The backend did not report both group count and version. The Console will not guess command preconditions." /></EditorStatePage>;
  if (editing && (detail.isPending || (detail.data && allEntries.isPending))) return <EditorStatePage title="Edit Group List" description="Review and replace one complete Group List version." actions={<Button onClick={() => navigate(detailUrl)}>Cancel</Button>}><StateNotice kind="loading" title="Loading the complete Group List" detail={`Reading every server-owned target for exact version replacement${detail.data?.groupCount === undefined ? '.' : ` · ${detail.data.groupCount} expected.`}`} /></EditorStatePage>;
  if (editing && (detail.error || allEntries.error || !detail.data)) return <EditorStatePage title="Edit Group List" description="Review and replace one complete Group List version." actions={<><Button onClick={() => navigate(detailUrl)}>Return to Group List</Button><Button onClick={() => void retryInitialLoad()}>Retry loading</Button></>}><ApiFailureNotice error={detail.error ?? allEntries.error ?? new Error('Group List unavailable.')} title="Group List load failed" /></EditorStatePage>;
  if (editing && allEntries.data && detail.data && allEntries.data.length !== detail.data.groupCount) return <EditorStatePage title="Edit Group List" description="Review and replace one complete Group List version." actions={<><Button onClick={() => navigate(detailUrl)}>Return to Group List</Button><Button onClick={() => void reloadFromServer()}>Reload from server</Button></>}><StateNotice kind="error" title="Group List changed while loading" detail="The complete entry set no longer matches the selected version. Reload and review the current server-owned list before editing." /></EditorStatePage>;

  const applyGroupSearch = () => setParams(setGroupListParam(params, 'groupSearch', searchDraft.trim()), { replace: true });
  return <div className="grid gap-6 p-6 max-sm:p-4">
    <PageHeader eyebrow="Messaging" title={editing ? 'Edit Group List' : 'Create Group List'} description={editing ? 'Review and replace one complete Group List version.' : 'Create an authorized, reusable set of campaign target groups.'} />
    <GroupSectionTabs />
    {!commandsEnabled ? <StateNotice kind="error" title="Commands unavailable" detail="Capability discovery is not authoritative. Cached read-only data remains visible, but this Group List cannot be submitted." /> : null}
    <form className="grid gap-4 xl:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.2fr)] xl:items-start" aria-busy={mutation.isPending} onSubmit={submit}>
      <Panel title="List facts" description="Group membership changes create a new immutable list version for campaign review."><div className="grid gap-4">
        <Field label="Name" required>{(id) => <Input id={id} required maxLength={255} value={name} disabled={mutation.isPending || versionConflict} onChange={(event) => { clearFailure(); setName(event.target.value); }} />}</Field>
        <Field label="Description">{(id) => <Textarea id={id} rows={4} maxLength={2000} value={description} disabled={mutation.isPending || versionConflict} onChange={(event) => { clearFailure(); setDescription(event.target.value); }} />}</Field>
        <Field label="Authorization source" required>{(id) => <Input id={id} required maxLength={64} value={source} disabled={mutation.isPending || versionConflict} onChange={(event) => { clearFailure(); setSource(event.target.value); }} />}</Field>
        <Field label="Evidence reference" required description="Sent once for backend hashing; never retained or displayed after submit.">{(id) => <Input id={id} required autoComplete="off" value={evidence} disabled={mutation.isPending || versionConflict} onChange={(event) => { clearFailure(); setEvidence(event.target.value); }} />}</Field>
        <Field label="Authorized at" required>{(id) => <DateTimeInput id={id} required value={authorizedAt} disabled={mutation.isPending || versionConflict} onChange={(event) => { clearFailure(); setAuthorizedAt(event.target.value); }} />}</Field>
      </div></Panel>
      <Panel title="Target groups" description="Eligibility comes from the persisted Groups projection; members are never expanded." actions={editing && detail.data ? <MetadataBadge>Version {detail.data.version}</MetadataBadge> : undefined}><div className="grid gap-4">
        {!eligibilityEnabled ? <StateNotice kind="info" title="Eligibility preflight unavailable" detail="This backend version will validate every selected group when the list is submitted." /> : null}
        <FilterToolbar><Field label="Group prefix" className="flex-1">{(id) => <Input id={id} type="search" value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); applyGroupSearch(); } }} />}</Field><div className="flex items-end"><IconButton icon="search" label="Apply group prefix search" disabled={searchDraft.trim() === route.groupSearch || groups.isFetching} onClick={applyGroupSearch} /></div></FilterToolbar>
        {groups.error ? <ApiFailureNotice error={groups.error} onRetry={() => groups.refetch()} /> : null}
        {eligibility.error ? <ApiFailureNotice error={eligibility.error} title="Eligibility check failed" onRetry={() => eligibility.refetch()} /> : null}
        {hasBlockedSelection ? <StateNotice kind="empty" title="Selection requires review" detail={`${selectedCounts.unavailable + selectedCounts.unknown} selected ${selectedCounts.unavailable + selectedCounts.unknown === 1 ? 'group is' : 'groups are'} unavailable or not yet verified. Remove them before saving.`} /> : null}
        {!groupsReady ? <StateNotice kind="empty" title="Groups projection unavailable" detail="groups_projection is not advertised for this instance. The target directory is unavailable, not empty." /> : groups.isPending ? <StateNotice kind="loading" title="Loading groups" /> : groups.data ? <div className="grid">
          <SelectionBar
            scopeLabel={eligibilityEnabled ? 'Select eligible on this page' : 'Bulk selection unavailable'}
            scopeDescription={!eligibilityEnabled ? 'Select groups individually; eligibility will be validated on submit.' : eligibility.isPending ? 'Waiting for page eligibility.' : eligibility.error ? 'Eligibility could not be verified for this page.' : undefined}
            selectedCount={selected.size}
            pageSelectedCount={pageSelection.selectedSelectableCount}
            pageSelectableCount={pageSelection.selectableCount}
            checked={pageSelection.checked}
            indeterminate={pageSelection.indeterminate}
            disabled={!commandsEnabled || !eligibilityEnabled || !eligibilityAuthoritative || !pageSelection.selectableCount || mutation.isPending || versionConflict}
            clearDisabled={mutation.isPending || versionConflict}
            onTogglePage={(checked) => setSelected((current) => setPageSelection(current, pageCandidates, checked))}
            onClear={() => setSelected(new Map())}
          />
          {groupItems.length ? <Table className="border-t-0 min-[900px]:max-h-[28rem] min-[900px]:overflow-y-auto">
            <thead className="sticky top-0 z-10 bg-surface"><tr><Th className="w-12"><span className="sr-only">Select</span></Th><Th className="min-w-56">Group</Th><Th className="w-24 min-w-24 text-right">Members</Th><Th className="min-w-28">State</Th><Th className="w-44 min-w-44">Eligibility</Th></tr></thead>
            <tbody>{groupItems.map((group) => {
              const assessment = eligibilityById.get(group.id);
              const checked = selected.has(group.id);
              const groupState = group.status ?? 'unreported';
              const eligibilityState = !eligibilityEnabled ? 'validated on submit' : eligibility.isPending ? 'checking' : assessment?.eligibility ?? 'unknown';
              const eligibilityTone: Tone = !eligibilityEnabled ? 'neutral' : eligibility.isPending ? 'pending' : assessment?.eligibility === 'eligible' ? 'ok' : assessment?.eligibility === 'unavailable' ? 'failed' : 'degraded';
              return <Tr key={group.id}>
                <Td mobileLabel="Select" className="w-12"><Checkbox visuallyHiddenLabel checked={checked} disabled={!commandsEnabled || mutation.isPending || versionConflict || (eligibilityEnabled && (!eligibilityAuthoritative || (!checked && assessment?.eligibility !== 'eligible')))} label={<>Select {group.subject ?? group.id}</>} onChange={() => toggle(group.id, group.subject ?? group.id, assessment)} /></Td>
                <Td mobileLabel="Group" multiline><GroupTargetIdentity id={group.id} name={group.subject} type={group.groupType} /></Td>
                <Td mobileLabel="Members" className="w-24 min-w-24 text-right"><ProjectedMemberCount count={group.memberCount} /></Td>
                <Td mobileLabel="State"><Status tone={groupStatusTone(group.status)}>{humanizeToken(groupState)}</Status></Td>
                <Td mobileLabel="Eligibility" multiline className="w-44 min-w-44"><GroupTargetEligibility label={humanizeToken(eligibilityState)} tone={eligibilityTone} reason={assessment?.eligibilityReason} /></Td>
              </Tr>;
            })}</tbody>
          </Table> : <div className="border border-t-0 border-line-strong p-3"><StateNotice kind="empty" title="No groups" detail={route.groupSearch ? 'No projected group matches this prefix.' : 'The ready group projection contains no groups.'} /></div>}
          <CursorPagination
            cursor={route.groupSearchCursor}
            nextCursor={groups.data.resource?.pagination.nextCursor ?? undefined}
            onCursor={(cursor) => setParams(setGroupListParam(params, 'groupSearchCursor', cursor), { replace: true })}
            info={route.groupSearchCursor ? 'Opaque cursor page' : `${groupItems.length} groups on first page`}
          />
        </div> : null}
        <SelectionReview
          title="Selected outside this page"
          description="These targets remain selected across search and pagination. Targets visible above are reviewed and removed directly in the table."
          items={selectedReviewItems}
          disabled={mutation.isPending || versionConflict}
          onRemove={(id) => setSelected((current) => { const next = new Map(current); next.delete(id); return next; })}
        />
      </div></Panel>
      {versionConflict ? <div className="xl:col-span-2"><StateNotice kind="error" title="Group List changed" detail="Reload the current version and review every selection before submitting a new authorization assertion." action={<Button onClick={() => void reloadFromServer()}>Reload from server</Button>} /></div> : mutation.error ? <div className="xl:col-span-2 grid gap-3"><ApiFailureNotice error={mutation.error} />{mutationIssues ? <StateNotice kind="error" title={`${mutationIssues.issueCount} selected groups require review`} detail={`${mutationIssues.issues.map((item) => item.currentName || item.groupJid).slice(0, 3).join(', ')}${mutationIssues.truncated || mutationIssues.issueCount > 3 ? '…' : ''}`} /> : null}</div> : null}
      <Panel className="xl:col-span-2" title="Submission review" description="Every write is revalidated atomically by the backend against the complete target set.">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.65fr)]">
          <div className="grid border border-line">{readiness.map((item) => <div key={item.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-line p-3 last:border-b-0"><span className="grid min-w-0 gap-0.5"><strong className="text-[13px] font-medium">{item.label}</strong><small className="text-xs text-fg-3">{item.detail}</small></span><Status tone={item.ready ? 'ok' : 'degraded'}>{item.ready ? 'Ready' : 'Required'}</Status></div>)}</div>
          {editing && detail.data ? <DescriptionList>
            <DescriptionItem label="Version">{detail.data.version} → new version</DescriptionItem>
            <DescriptionItem label="List facts">{diff.factsChanged ? 'Changed' : 'Unchanged'}</DescriptionItem>
            <DescriptionItem label="Targets">{baseline.current.selectedIds.length} → {selected.size} · {diff.added} added · {diff.removed} removed</DescriptionItem>
            <DescriptionItem label="Authorization">{authorizationComplete ? 'New assertion supplied' : 'New assertion required'}</DescriptionItem>
          </DescriptionList> : <DescriptionList><DescriptionItem label="New target set">{selected.size} groups</DescriptionItem><DescriptionItem label="Authorization">{authorizationComplete ? 'Assertion supplied' : 'Assertion required'}</DescriptionItem></DescriptionList>}
        </div>
      </Panel>
      <div className="sticky bottom-0 z-20 flex flex-wrap items-center justify-between gap-3 border-y border-line-strong bg-surface py-3 xl:col-span-2"><p className="px-3 text-xs text-fg-3">{canSubmit ? 'Ready for final server revalidation.' : readiness.find((item) => !item.ready)?.detail ?? 'Review the current version before submitting.'}</p><div className="flex gap-2 px-3 max-sm:w-full"><Button className="max-sm:flex-1" disabled={mutation.isPending} onClick={() => navigate(editing ? detailUrl : directoryUrl)}>Cancel</Button><Button className="max-sm:flex-1" type="submit" variant="primary" disabled={!canSubmit}>{mutation.isPending ? 'Submitting…' : editing ? 'Save new version' : 'Create Group List'}</Button></div></div>
    </form>
    <Dialog open={blocker.state === 'blocked'} onClose={() => blocker.state === 'blocked' && blocker.reset()} title="Discard unsaved Group List changes?" footer={<><Button onClick={() => blocker.state === 'blocked' && blocker.reset()}>Continue editing</Button><Button variant="danger" onClick={() => { if (blocker.state !== 'blocked') return; allowNavigation.current = true; blocker.proceed(); }}>Discard and leave</Button></>}><p className="text-sm text-fg-2">List facts, target selection, and the evidence reference exist only in memory and will be destroyed if you leave this editor.</p></Dialog>
  </div>;
}
