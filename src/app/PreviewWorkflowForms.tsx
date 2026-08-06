import { useState } from 'react';
import {
  Button,
  Checkbox,
  DateTimeInput,
  Field,
  FilterToolbar,
  IconButton,
  Input,
  PageHeader,
  Panel,
  SelectionBar,
  StateNotice,
  Status,
  Table,
  Td,
  Textarea,
  Th,
  Tr,
} from '@/ui';

const targets = [
  { id: '120363000001@g.us', name: 'Regional operations', members: 1284, eligibility: 'Eligible' },
  { id: '120363000002@g.us', name: 'Support escalations', members: 84, eligibility: 'Eligible' },
  { id: '120363000003@g.us', name: 'Editorial review', members: 32, eligibility: 'Unavailable' },
];

function TargetTable({ selectable = false }: { selectable?: boolean }) {
  return (
    <div className="grid">
      {selectable ? <SelectionBar scopeLabel="Select eligible on this page" selectedCount={1} pageSelectedCount={1} pageSelectableCount={2} checked={false} indeterminate onTogglePage={() => {}} onClear={() => {}} /> : null}
      <Table className={selectable ? 'border-t-0' : undefined}>
        <thead><tr>{selectable ? <Th className="w-12"><span className="sr-only">Select</span></Th> : null}<Th>Group</Th><Th className="w-24 text-right">Members</Th><Th>Eligibility</Th></tr></thead>
        <tbody>{targets.map((target, index) => <Tr key={target.id}>{selectable ? <Td mobileLabel="Select" className="w-12"><Checkbox visuallyHiddenLabel label={<>Select {target.name}</>} checked={index === 0} disabled={target.eligibility !== 'Eligible'} onChange={() => {}} /></Td> : null}<Td mobileLabel="Group" multiline><span className="grid gap-0.5"><strong className="font-medium">{target.name}</strong><small className="font-mono text-xs text-fg-3 [overflow-wrap:anywhere]">{target.id}</small></span></Td><Td mobileLabel="Members" className="text-right font-mono tabular-nums">{target.members}</Td><Td mobileLabel="Eligibility"><Status tone={target.eligibility === 'Eligible' ? 'ok' : 'failed'}>{target.eligibility}</Status></Td></Tr>)}</tbody>
      </Table>
    </div>
  );
}

function CampaignFormPreview() {
  return (
    <section aria-label="Create campaign workflow" className="grid gap-6 border-b border-line pb-8">
      <PageHeader eyebrow="Messaging" title="Create campaign draft" description="Create a campaign draft from one reviewed Group List." />
      <form className="grid min-w-0 gap-4 xl:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.2fr)] xl:items-start">
        <Panel title="Campaign content" description="Creation acknowledges a text draft only; it does not prove send or delivery."><div className="grid gap-4"><Field label="Campaign name" required>{(id) => <Input id={id} defaultValue="August service update" />}</Field><Field label="Message text" required>{(id) => <Textarea id={id} rows={7} defaultValue="Scheduled maintenance begins at 22:00. Reply to the support channel if assistance is required." />}</Field></div></Panel>
        <Panel title="Target Group List" description="The backend snapshots this exact list version and never expands groups into members."><div className="grid gap-4"><Field label="Find Group Lists" description="Prefix search is server-owned and bounded to the active instance.">{(id) => <div className="flex gap-2"><Input id={id} defaultValue="regional" /><Button>Search</Button></div>}</Field><StateNotice kind="info" title="Regional notification targets" detail="Reviewed version 4 · 3 groups. Eligibility covers the complete exact version." /><TargetTable /></div></Panel>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 xl:col-span-2"><p className="text-xs text-fg-3">A version conflict requires refresh and explicit review.</p><div className="flex gap-2 max-sm:w-full"><Button className="max-sm:flex-1">Cancel</Button><Button className="max-sm:flex-1" variant="primary">Create draft</Button></div></div>
      </form>
    </section>
  );
}

function GroupListFormPreview() {
  const [search, setSearch] = useState('');
  return (
    <section aria-label="Edit Group List workflow" className="grid gap-6 pt-8">
      <PageHeader eyebrow="Messaging" title="Edit Group List" description="Review and replace one complete Group List version." />
      <form className="grid gap-4 xl:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.2fr)] xl:items-start">
        <Panel title="List facts" description="Group membership changes create a new immutable list version for campaign review."><div className="grid gap-4"><Field label="Name" required>{(id) => <Input id={id} defaultValue="Regional notification targets" />}</Field><Field label="Description">{(id) => <Textarea id={id} rows={4} defaultValue="Authorized operational announcement groups." />}</Field><Field label="Authorization source" required>{(id) => <Input id={id} defaultValue="operator_attestation" />}</Field><Field label="Evidence reference" required description="Sent once for backend hashing; never retained after submit.">{(id) => <Input id={id} defaultValue="ticket-2841" />}</Field><Field label="Authorized at" required>{(id) => <DateTimeInput id={id} defaultValue="2026-08-06T20:00" />}</Field></div></Panel>
        <Panel title="Target groups" description="Eligibility comes from the persisted Groups projection; members are never expanded."><div className="grid gap-4"><FilterToolbar><Field label="Group prefix" className="flex-1">{(id) => <Input id={id} value={search} onChange={(event) => setSearch(event.target.value)} />}</Field><div className="flex items-end"><IconButton icon="search" label="Apply group prefix search" /></div></FilterToolbar><TargetTable selectable /></div></Panel>
        <Panel className="xl:col-span-2" title="Submission readiness" description="Every prerequisite remains explicit before replacement."><div className="grid gap-2 sm:grid-cols-2"><Status tone="ok">Command authority ready</Status><Status tone="ok">List facts ready</Status><Status tone="ok">Authorization ready</Status><Status tone="degraded">1 target requires review</Status></div></Panel>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 xl:col-span-2"><p className="text-xs text-fg-3">Saving replaces the complete reviewed target set.</p><div className="flex gap-2 max-sm:w-full"><Button className="max-sm:flex-1">Cancel</Button><Button className="max-sm:flex-1" variant="primary" disabled>Save new version</Button></div></div>
      </form>
    </section>
  );
}

/** Dev-only deterministic coverage for the two densest responsive form workflows. */
export function PreviewWorkflowForms() {
  return <main className="min-h-dvh bg-bg px-4 py-6 text-fg sm:px-8"><div className="mx-auto grid max-w-[1180px] gap-8"><CampaignFormPreview /><GroupListFormPreview /></div></main>;
}
