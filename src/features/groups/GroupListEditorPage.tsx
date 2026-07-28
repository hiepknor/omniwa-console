import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ApiFailure } from '@/api/envelopes';
import { useApiSession } from '@/api/ApiProvider';
import { useServerCapabilities } from '@/api/CapabilitiesProvider';
import { ApiFailureNotice } from '@/components/ApiFailureNotice';
import { eligibilityIssues, type GroupEligibility, type GroupListEntry } from '@/api/group-lists';
import { humanizeToken } from '@/lib/format';
import { Button, Checkbox, DateTimeInput, Field, FilterToolbar, Input, PageHeader, Panel, ProgressBar, StateNotice, Status, Textarea } from '@/ui';
import { GroupSectionTabs } from './GroupSectionTabs';
import { groupListRouteState, setGroupListParam } from './group-list-route-state';
import { useGroups } from './hooks';
import { useAllGroupListEntries, useCreateGroupList, useGroupEligibility, useGroupList, useUpdateGroupList } from '@/api/group-list-hooks';

type SelectedGroup = { label: string; eligibility?: GroupEligibility; eligibilityReason?: string };

function localNow(): string {
  const date = new Date(Date.now() - new Date().getTimezoneOffset() * 60_000);
  return date.toISOString().slice(0, 16);
}

export function GroupListEditorPage() {
  const { groupListId } = useParams();
  const editing = Boolean(groupListId);
  const session = useApiSession();
  const capabilities = useServerCapabilities();
  const enabled = session.keyKind === 'api' && (capabilities.data?.capabilities.includes('group_lists') ?? false);
  const groupsReady = capabilities.data?.capabilities.includes('groups_projection') ?? false;
  const eligibilityEnabled = capabilities.data?.capabilities.includes('group_list_eligibility') ?? false;
  const normalizedGroups = capabilities.data?.capabilities.includes('group_management_permissions') ?? false;
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const route = groupListRouteState(params);
  const [searchDraft, setSearchDraft] = useState(route.groupSearch);
  const detail = useGroupList(groupListId, enabled && editing);
  const allEntries = useAllGroupListEntries(groupListId, detail.data?.groupCount ?? 0, enabled && editing && Boolean(detail.data));
  const groups = useGroups({ search: route.groupSearch, cursor: route.groupSearchCursor }, enabled && groupsReady, normalizedGroups);
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
  const versionConflict = mutation.error instanceof ApiFailure && mutation.error.code === 'group_list_version_conflict';

  useEffect(() => setSearchDraft(route.groupSearch), [route.groupSearch]);
  useEffect(() => {
    if (versionConflict) setEvidence('');
  }, [versionConflict]);

  useEffect(() => {
    if (!editing || initialized.current || !detail.data || !allEntries.data) return;
    initialized.current = true;
    setName(detail.data.name); setDescription(detail.data.description ?? ''); setSource(detail.data.authorizationSource ?? 'operator_attestation'); setAuthorizedAt(localNow());
    setSelected(new Map(allEntries.data.map((entry) => [entry.groupJid, { label: entry.currentName ?? entry.snapshotName ?? entry.groupJid, eligibility: entry.eligibility, eligibilityReason: entry.eligibilityReason }])));
  }, [allEntries.data, detail.data, editing]);

  const groupItems = useMemo(() => groups.data?.resource?.items ?? [], [groups.data]);
  const eligibility = useGroupEligibility(groupItems.map((group) => group.id), enabled && eligibilityEnabled && groupItems.length > 0);
  const eligibilityById = useMemo(() => new Map((eligibility.data?.items ?? []).map((item) => [item.groupJid, item])), [eligibility.data]);
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
  const entriesReady = !editing || Boolean(allEntries.data && detail.data && allEntries.data.length === detail.data.groupCount);
  const selectedCounts = [...selected.values()].reduce((counts, item) => ({ ...counts, [item.eligibility ?? 'unknown']: counts[item.eligibility ?? 'unknown'] + 1 }), { eligible: 0, unavailable: 0, unknown: 0 } as Record<GroupEligibility, number>);
  const hasBlockedSelection = eligibilityEnabled && (selectedCounts.unavailable > 0 || selectedCounts.unknown > 0);
  const canSubmit = enabled && groupsReady && entriesReady && !hasBlockedSelection && !versionConflict && !mutation.isPending && Boolean(name.trim() && source.trim() && evidence.trim() && authorizedAt && selected.size);
  const clearFailure = () => { if (mutation.error && !versionConflict) mutation.reset(); };
  const toggle = (jid: string, label: string, assessment?: GroupListEntry) => setSelected((current) => { const next = new Map(current); if (next.has(jid)) next.delete(jid); else if (!eligibilityEnabled || assessment?.eligibility === 'eligible') next.set(jid, { label, eligibility: assessment?.eligibility, eligibilityReason: assessment?.eligibilityReason }); return next; });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    const timestamp = Date.parse(authorizedAt);
    if (Number.isNaN(timestamp)) return;
    const base = { name: name.trim(), description: description.trim() || undefined, groupJids: [...selected.keys()], authorization: { source: source.trim(), evidenceReference: evidence.trim(), authorizedAt: new Date(timestamp).toISOString() } };
    const onSuccess = (result: { id: string }) => { setEvidence(''); mutation.reset(); navigate(`/groups/lists/${encodeURIComponent(result.id)}`, { replace: true }); };
    if (editing && detail.data) update.mutate({ ...base, expectedVersion: detail.data.version }, { onSuccess });
    else create.mutate(base, { onSuccess });
  };

  if (!enabled) return <div className="grid gap-6 p-6 max-sm:p-4"><PageHeader eyebrow="Messaging / Groups" title={editing ? 'Edit Group List' : 'Create Group List'} /><GroupSectionTabs /><StateNotice kind="empty" title="Group Lists unavailable" detail={session.keyKind !== 'api' ? 'An instance credential is required.' : 'The backend does not advertise group_lists.'} /></div>;
  if (editing && (detail.isPending || (detail.data && allEntries.isPending))) return <div className="grid gap-6 p-6 max-sm:p-4"><PageHeader eyebrow="Messaging / Group Lists" title="Edit Group List" /><ProgressBar label="Loading complete Group List" value={allEntries.data?.length ?? 0} max={detail.data?.groupCount ?? 1} /><StateNotice kind="loading" title="Loading every group before replacement" detail="Save remains disabled until the complete server-owned entry set is loaded." /></div>;
  if (editing && (detail.error || allEntries.error || !detail.data)) return <div className="grid gap-6 p-6 max-sm:p-4"><PageHeader eyebrow="Messaging / Group Lists" title="Edit Group List" /><ApiFailureNotice error={detail.error ?? allEntries.error ?? new Error('Group List unavailable.')} title="Group List load failed" /></div>;
  if (editing && allEntries.data && detail.data && allEntries.data.length !== detail.data.groupCount) return <div className="grid gap-6 p-6 max-sm:p-4"><PageHeader eyebrow="Messaging / Group Lists" title="Edit Group List" /><StateNotice kind="error" title="Group List changed while loading" detail="The complete entry set no longer matches the selected version. Reload and review the current server-owned list before editing." action={<Button onClick={() => window.location.reload()}>Reload</Button>} /></div>;

  const applyGroupSearch = () => setParams(setGroupListParam(params, 'groupSearch', searchDraft.trim()), { replace: true });
  return <div className="grid gap-6 p-6 max-sm:p-4">
    <PageHeader eyebrow="Messaging / Group Lists" title={editing ? 'Edit Group List' : 'Create Group List'} description="Select WhatsApp groups and record one audited authorization assertion for this list version." />
    <GroupSectionTabs />
    <form className="grid gap-4 xl:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.2fr)] xl:items-start" aria-busy={mutation.isPending} onSubmit={submit}>
      <Panel title="List facts" description="Group membership changes create a new immutable list version for campaign review."><div className="grid gap-4">
        <Field label="Name" required>{(id) => <Input id={id} required maxLength={255} value={name} disabled={mutation.isPending || versionConflict} onChange={(event) => { clearFailure(); setName(event.target.value); }} />}</Field>
        <Field label="Description">{(id) => <Textarea id={id} rows={4} maxLength={2000} value={description} disabled={mutation.isPending || versionConflict} onChange={(event) => { clearFailure(); setDescription(event.target.value); }} />}</Field>
        <Field label="Authorization source" required>{(id) => <Input id={id} required maxLength={64} value={source} disabled={mutation.isPending || versionConflict} onChange={(event) => { clearFailure(); setSource(event.target.value); }} />}</Field>
        <Field label="Evidence reference" required description="Sent once for backend hashing; never retained or displayed after submit.">{(id) => <Input id={id} required autoComplete="off" value={evidence} disabled={mutation.isPending || versionConflict} onChange={(event) => { clearFailure(); setEvidence(event.target.value); }} />}</Field>
        <Field label="Authorized at" required>{(id) => <DateTimeInput id={id} required value={authorizedAt} disabled={mutation.isPending || versionConflict} onChange={(event) => { clearFailure(); setAuthorizedAt(event.target.value); }} />}</Field>
      </div></Panel>
      <Panel title="Target groups" description="Eligibility comes from the persisted Groups projection; members are never expanded."><div className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2" aria-live="polite"><div className="flex flex-wrap gap-2"><Status tone={selected.size ? hasBlockedSelection ? 'degraded' : 'ok' : 'neutral'}>{selected.size} selected</Status>{eligibilityEnabled && selected.size ? <span className="text-xs text-fg-3">{selectedCounts.eligible} eligible · {selectedCounts.unavailable} unavailable · {selectedCounts.unknown} unknown</span> : null}</div>{editing && detail.data ? <span className="text-xs text-fg-3">Editing version {detail.data.version}</span> : null}</div>
        {!eligibilityEnabled ? <StateNotice kind="info" title="Eligibility preflight unavailable" detail="This backend version will validate every selected group when the list is submitted." /> : null}
        <FilterToolbar><Field label="Group prefix" className="flex-1">{(id) => <Input id={id} type="search" value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); applyGroupSearch(); } }} />}</Field><div className="flex items-end"><Button disabled={searchDraft.trim() === route.groupSearch || groups.isFetching} onClick={applyGroupSearch}>Search</Button></div></FilterToolbar>
        {groups.error ? <ApiFailureNotice error={groups.error} onRetry={() => groups.refetch()} /> : null}
        {eligibility.error ? <ApiFailureNotice error={eligibility.error} title="Eligibility check failed" onRetry={() => eligibility.refetch()} /> : null}
        {!groupsReady ? <StateNotice kind="empty" title="Groups projection unavailable" detail="groups_projection is not advertised for this instance. The target directory is unavailable, not empty." /> : groups.isPending ? <StateNotice kind="loading" title="Loading groups" /> : groupItems.length ? <div className="grid max-h-[28rem] overflow-y-auto border border-line px-3">{groupItems.map((group) => {
          const assessment = eligibilityById.get(group.id);
          const checked = selected.has(group.id);
          const eligibilityLabel = !eligibilityEnabled ? 'Validated on submit' : eligibility.isPending ? 'Checking send eligibility' : humanizeToken(assessment?.eligibilityReason ?? assessment?.eligibility ?? 'unknown');
          return <Checkbox key={group.id} checked={checked} disabled={mutation.isPending || versionConflict || (eligibilityEnabled && !checked && assessment?.eligibility !== 'eligible')} label={group.subject ?? group.id} description={<>{group.id} · {humanizeToken(group.status ?? 'unreported')} · <span className={assessment?.eligibility === 'unavailable' ? 'text-danger' : ''}>{eligibilityLabel}</span></>} onChange={() => toggle(group.id, group.subject ?? group.id, assessment)} />;
        })}</div> : <StateNotice kind="empty" title="No groups" detail={route.groupSearch ? 'No projected group matches this prefix.' : 'The ready group projection contains no groups.'} />}
        {groups.data ? <div className="flex justify-between gap-2"><Button disabled={!route.groupSearchCursor} onClick={() => setParams(setGroupListParam(params, 'groupSearchCursor'), { replace: true })}>First page</Button><Button disabled={!groups.data.resource?.pagination.nextCursor} onClick={() => setParams(setGroupListParam(params, 'groupSearchCursor', groups.data?.resource?.pagination.nextCursor ?? undefined), { replace: true })}>Next page</Button></div> : null}
      </div></Panel>
      {versionConflict ? <div className="xl:col-span-2"><StateNotice kind="error" title="Group List changed" detail="Reload the current version and review every selection before submitting a new authorization assertion." action={<Button onClick={() => window.location.reload()}>Reload</Button>} /></div> : mutation.error ? <div className="xl:col-span-2 grid gap-3"><ApiFailureNotice error={mutation.error} />{mutationIssues ? <StateNotice kind="error" title={`${mutationIssues.issueCount} selected groups require review`} detail={`${mutationIssues.issues.map((item) => item.currentName || item.groupJid).slice(0, 3).join(', ')}${mutationIssues.truncated || mutationIssues.issueCount > 3 ? '…' : ''}`} /> : null}</div> : null}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 xl:col-span-2"><p className="text-xs text-fg-3">Preflight is advisory. The backend validates the complete selection atomically on submit.</p><div className="flex gap-2 max-sm:w-full"><Button className="max-sm:flex-1" disabled={mutation.isPending} onClick={() => navigate(editing && groupListId ? `/groups/lists/${encodeURIComponent(groupListId)}` : '/groups/lists')}>Cancel</Button><Button className="max-sm:flex-1" type="submit" variant="primary" disabled={!canSubmit}>{mutation.isPending ? 'Submitting…' : editing ? 'Save new version' : 'Create Group List'}</Button></div></div>
    </form>
  </div>;
}
