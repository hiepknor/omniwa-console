import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiFailure } from '@/api/envelopes';
import { Button, Field, Input, PageHeader, Panel, StateNotice } from '@/ui';
import { useCreateCampaignV2 } from './hooks';
import { parseConsentRows } from './consent';

const textarea = 'w-full px-2.5 py-2 text-[13px] bg-recessed text-fg border border-line placeholder:text-fg-3 focus-visible:outline-none focus-visible:border-line-strong resize-y';

export function CreateCampaignV2() {
  const create = useCreateCampaignV2();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [rows, setRows] = useState('');
  const [validation, setValidation] = useState<string>();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setValidation(undefined);
    let recipients;
    try { recipients = parseConsentRows(rows); } catch (error) { setValidation(error instanceof Error ? error.message : 'Invalid consent records.'); return; }
    try {
      const result = await create.mutateAsync({ name: name.trim(), text, recipients });
      setRows('');
      navigate(`/messages/${encodeURIComponent(result.campaign.id)}?created=1`, { replace: true });
    } catch { /* rendered below */ }
  };
  const failure = create.error instanceof ApiFailure ? create.error : undefined;

  return (
    <div className="grid gap-6 p-6 max-sm:p-4 max-w-3xl">
      <PageHeader
        eyebrow="Messaging / Campaigns"
        title="Create campaign draft"
        description="Submit consent evidence once; execution, pacing, leases, and recipient retry remain in OmniWA GO."
        actions={<Link to="/messages" className="inline-flex items-center h-9 px-3 text-[13px] font-medium border border-line hover:bg-elevated hover:border-line-strong">Cancel</Link>}
      />

      <StateNotice kind="info" title="Consent evidence" detail="Raw evidence references are sent to the backend and are not retained by the Console after successful submission." />

      <Panel title="Campaign definition" description="Text campaigns only. Every recipient must carry explicit opt-in evidence.">
        <form className="grid gap-4" onSubmit={(e) => void submit(e)}>
          <Field label="Campaign name">{(id) => <Input id={id} required maxLength={255} value={name} onChange={(e) => setName(e.target.value)} />}</Field>
          <label className="grid gap-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-fg-3">Message text</span>
            <textarea rows={4} required className={textarea} value={text} onChange={(e) => setText(e.target.value)} />
          </label>
          <label className="grid gap-1.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-fg-3">Consent-backed recipients</span>
            <textarea rows={8} required className={textarea} value={rows} placeholder="84901234567@s.whatsapp.net | checkout | consent-record-id | 2026-07-22T08:00:00Z" onChange={(e) => setRows(e.target.value)} />
            <span className={validation ? 'text-xs text-danger' : 'text-xs text-fg-3'}>{validation ?? 'One recipient per line: JID | opt-in source | evidence reference | ISO opt-in time.'}</span>
          </label>
          {failure ? <StateNotice kind="error" title="Command failed" detail={failure.message} requestId={failure.requestId} /> : null}
          <div className="flex justify-end gap-2">
            <Button disabled={create.isPending} onClick={() => navigate('/messages')}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={create.isPending || !name.trim() || !text.trim() || !rows.trim()}>{create.isPending ? 'Creating draft…' : 'Create draft'}</Button>
          </div>
        </form>
      </Panel>
    </div>
  );
}
