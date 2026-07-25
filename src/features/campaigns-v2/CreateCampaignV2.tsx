import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiFailureNotice, Button, Field, PageHeader, StateNotice, Surface } from '@/components/v2';
import { useCreateCampaignV2 } from './hooks';
import { parseConsentRows } from './consent';

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
    try { recipients = parseConsentRows(rows); }
    catch (error) { setValidation(error instanceof Error ? error.message : 'Invalid consent records.'); return; }
    try {
      const result = await create.mutateAsync({ name: name.trim(), text, recipients });
      setRows('');
      navigate(`/messages/${encodeURIComponent(result.campaign.id)}?created=1`, { replace: true });
    } catch { /* Normalized mutation error is rendered below. */ }
  };

  return <div className="ui-v2-page">
    <PageHeader eyebrow="Messaging / Campaigns" title="Create campaign draft" description="Submit consent evidence once; execution, pacing, leases, and recipient retry remain in OmniWA GO." actions={<Link className="ui-v2-button ui-v2-button--secondary" to="/messages">Cancel</Link>} />
    <div className="ui-v2-page__content ui-v2-campaign-create">
      <StateNotice value={{ axis: 'command', state: 'idle' }} detail="Raw evidence references are sent to the backend and are not retained by the Console after successful submission." />
      <Surface title="Campaign definition" description="Text campaigns only. Every recipient must carry explicit opt-in evidence.">
        <form className="ui-v2-stack" onSubmit={(event) => void submit(event)}>
          <Field label="Campaign name" required maxLength={255} value={name} onChange={(event) => setName(event.target.value)} />
          <label className="ui-v2-field"><span className="ui-v2-field__label">Message text</span><textarea className="ui-v2-input ui-v2-textarea" required value={text} onChange={(event) => setText(event.target.value)} /></label>
          <label className="ui-v2-field"><span className="ui-v2-field__label">Consent-backed recipients</span><textarea className="ui-v2-input ui-v2-consent-rows" required rows={8} value={rows} onChange={(event) => setRows(event.target.value)} placeholder="84901234567@s.whatsapp.net | checkout | consent-record-id | 2026-07-22T08:00:00Z" aria-describedby="campaign-consent-hint" /><span id="campaign-consent-hint" className="ui-v2-field__hint" data-error={validation ? true : undefined}>{validation ?? 'One recipient per line: JID | opt-in source | evidence reference | ISO opt-in time.'}</span></label>
          {create.error ? <ApiFailureNotice error={create.error} command /> : null}
          <div className="ui-v2-command-bar"><Button disabled={create.isPending} onClick={() => navigate('/messages')}>Cancel</Button><Button variant="primary" type="submit" disabled={create.isPending || !name.trim() || !text.trim() || !rows.trim()}>{create.isPending ? 'Creating draft…' : 'Create draft'}</Button></div>
        </form>
      </Surface>
    </div>
  </div>;
}
