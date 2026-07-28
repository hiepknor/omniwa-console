import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApiSession } from '@/api/ApiProvider';
import { useServerCapabilities } from '@/api/CapabilitiesProvider';
import { ApiFailureNotice } from '@/components/ApiFailureNotice';
import { GroupEligibilitySummary } from '@/components/GroupEligibilitySummary';
import { eligibilityIssues } from '@/api/group-lists';
import { humanizeToken } from '@/lib/format';
import { Button, Field, Input, PageHeader, Panel, Select, StateNotice, Status, Table, Td, Textarea, Th, Tr } from '@/ui';
import { useGroupList, useGroupListEligibility, useGroupListEntries, useGroupLists } from '@/api/group-list-hooks';
import { useCreateCampaign } from './hooks';

export function CreateCampaign() {
  const session = useApiSession();
  const capabilities = useServerCapabilities();
  const navigate = useNavigate();
  const create = useCreateCampaign();
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [listSearchDraft, setListSearchDraft] = useState('');
  const [listSearch, setListSearch] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const instanceScope = session.keyKind === 'api';
  const orchestration = capabilities.data?.capabilities.includes('campaign_orchestration') ?? false;
  const groupListsEnabled = capabilities.data?.capabilities.includes('group_lists') ?? false;
  const groupTargetsEnabled = capabilities.data?.capabilities.includes('campaign_group_targets') ?? false;
  const eligibilityEnabled = capabilities.data?.capabilities.includes('group_list_eligibility') ?? false;
  const enabled = instanceScope && orchestration && groupListsEnabled && groupTargetsEnabled;
  const lists = useGroupLists(listSearch, undefined, enabled);
  const selected = useGroupList(selectedId || undefined, enabled);
  const preview = useGroupListEntries(selectedId || undefined, undefined, enabled && Boolean(selectedId));
  const assessment = useGroupListEligibility(selectedId || undefined, selected.data?.version, enabled && eligibilityEnabled && Boolean(selected.data));
  const canSubmit = Boolean(name.trim() && text.trim() && selected.data?.id && selected.data.groupCount > 0 && !create.isPending && (!eligibilityEnabled || assessment.data?.aggregate.readyToTarget));
  const createIssues = eligibilityIssues(create.error);
  useEffect(() => {
    if (create.error && eligibilityEnabled && selected.data) void assessment.refetch();
  }, [create.error]);
  const clearFailure = () => { if (create.error) create.reset(); };
  const applyListSearch = () => {
    const nextSearch = listSearchDraft.trim();
    if (nextSearch === listSearch) return;
    setListSearch(nextSearch);
    setSelectedId('');
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit || !selected.data) return;
    try {
      const result = await create.mutateAsync({ name: name.trim(), text, target: { type: 'group_list', groupListId: selected.data.id, groupListVersion: selected.data.version } });
      navigate(`/campaigns/${encodeURIComponent(result.campaign.id)}?created=1`, { replace: true });
    } catch { /* rendered below */ }
  };

  if (!enabled) {
    const detail = !instanceScope ? 'Campaign creation requires an instance credential.' : capabilities.isPending ? 'Discovering backend capabilities.' : !orchestration ? 'The backend does not advertise campaign_orchestration.' : !groupListsEnabled ? 'The backend does not advertise group_lists.' : 'The backend does not advertise campaign_group_targets.';
    return <div className="grid gap-6 p-6 max-sm:p-4"><PageHeader eyebrow="Messaging" title="Create campaign draft" description="Create a campaign draft from one reviewed Group List." /><StateNotice kind="empty" title="Group campaign creation unavailable" detail={`${detail} No campaign request was sent.`} action={<Link to="/campaigns" className="underline">Return to campaigns</Link>} /></div>;
  }

  return <div className="grid gap-6 p-6 max-sm:p-4"><PageHeader eyebrow="Messaging" title="Create campaign draft" description="Create a campaign draft from one reviewed Group List." /><form className="grid min-w-0 gap-4 xl:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.2fr)] xl:items-start" aria-busy={create.isPending} onSubmit={(event) => void submit(event)}><Panel title="Campaign content" description="Creation acknowledges a text draft only; it does not prove send or delivery."><div className="grid gap-4"><Field label="Campaign name" required>{(id) => <Input id={id} required maxLength={255} value={name} disabled={create.isPending} onChange={(event) => { clearFailure(); setName(event.target.value); }} />}</Field><Field label="Message text" required>{(id) => <Textarea id={id} rows={10} required maxLength={4096} value={text} disabled={create.isPending} onChange={(event) => { clearFailure(); setText(event.target.value); }} />}</Field></div></Panel><Panel title="Target Group List" description="The backend snapshots this exact list version and never expands groups into members."><div className="grid gap-4"><div className="flex items-end gap-2 max-sm:items-stretch"><Field label="Find Group Lists" className="min-w-0 flex-1" description="Prefix search is server-owned and bounded to the active instance.">{(id) => <Input id={id} type="search" value={listSearchDraft} disabled={create.isPending} onChange={(event) => setListSearchDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); applyListSearch(); } }} />}</Field><Button disabled={create.isPending || lists.isFetching || listSearchDraft.trim() === listSearch} onClick={applyListSearch}>Search</Button></div>{lists.error ? <ApiFailureNotice error={lists.error} onRetry={() => lists.refetch()} /> : lists.isPending ? <StateNotice kind="loading" title="Loading Group Lists" /> : <Field label="Target Group List" required>{(id, labelId) => <Select id={id} aria-labelledby={labelId} value={selectedId} disabled={create.isPending || !lists.data?.items.length} placeholder="Select Group List" onValueChange={(value) => { clearFailure(); setSelectedId(value); }}><option value="">Select Group List</option>{lists.data?.items.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.groupCount} groups · v{item.version}</option>)}</Select>}</Field>}{selected.isPending && selectedId ? <StateNotice kind="loading" title="Loading selected Group List" /> : selected.error ? <ApiFailureNotice error={selected.error} onRetry={() => selected.refetch()} /> : selected.data ? <div className="grid gap-3"><div className="flex flex-wrap items-center justify-between gap-2 border border-line bg-elevated p-3" aria-live="polite"><div className="grid"><strong className="text-sm">{selected.data.name}</strong><span className="text-xs text-fg-3">Reviewed version {selected.data.version}</span></div><Status tone={selected.data.groupCount ? 'ok' : 'failed'}>{selected.data.groupCount} groups</Status></div>{eligibilityEnabled ? assessment.isPending ? <StateNotice kind="loading" title="Checking the complete target" detail="Draft creation remains disabled until this exact Group List version is assessed." /> : assessment.error ? <ApiFailureNotice error={assessment.error} title="Target eligibility check failed" onRetry={() => assessment.refetch()} /> : assessment.data ? <GroupEligibilitySummary value={assessment.data.aggregate} /> : null : <StateNotice kind="info" title="Eligibility preflight unavailable" detail="The backend will validate the complete Group List atomically when the draft is created." />}{preview.isPending ? <StateNotice kind="loading" title="Loading target preview" /> : preview.error ? <ApiFailureNotice error={preview.error} onRetry={() => preview.refetch()} /> : preview.data ? <><Table><thead><tr><Th>Group</Th><Th>Eligibility</Th></tr></thead><tbody>{preview.data.items.slice(0, 5).map((entry) => <Tr key={entry.groupJid}><Td><div className="grid gap-0.5"><span className="font-medium">{entry.currentName ?? entry.snapshotName ?? entry.groupJid}</span><small className="font-mono text-xs text-fg-3">{entry.groupJid}</small></div></Td><Td><Status tone={entry.eligibility === 'eligible' ? 'ok' : entry.eligibility === 'unavailable' ? 'failed' : 'degraded'}>{humanizeToken(entry.eligibilityReason ?? entry.eligibility)}</Status></Td></Tr>)}</tbody></Table><p className="text-xs text-fg-3">Previewing {Math.min(5, preview.data.items.length)} groups. The aggregate above covers the complete exact version.</p></> : null}</div> : <StateNotice kind="info" title="Select a Group List" detail="Create and authorize reusable targets under Groups / Group Lists." action={<Link className="underline" to="/groups/lists/new">New Group List</Link>} />}</div></Panel>{create.error ? <div className="xl:col-span-2 grid gap-3"><ApiFailureNotice error={create.error} title="Campaign creation failed" />{createIssues ? <StateNotice kind="error" title={`${createIssues.issueCount} target groups changed eligibility`} detail="Refresh and explicitly review the same Group List version before creating another draft. No campaign retry was submitted." /> : null}</div> : null}<div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 xl:col-span-2"><p className="text-xs text-fg-3">A version conflict or unavailable target requires refresh and explicit review.</p><div className="flex gap-2 max-sm:w-full"><Button className="max-sm:flex-1" disabled={create.isPending} onClick={() => navigate('/campaigns')}>Cancel</Button><Button className="max-sm:flex-1" type="submit" variant="primary" disabled={!canSubmit}>{create.isPending ? 'Creating draft…' : 'Create draft'}</Button></div></div></form></div>;
}
