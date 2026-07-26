import { useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApiSession } from '@/api/ApiProvider';
import { useServerCapabilities } from '@/api/CapabilitiesProvider';
import { ApiFailureNotice } from '@/components/ApiFailureNotice';
import { Button, Field, Input, PageHeader, Panel, StateNotice, Status, Table, Td, Textarea, Th, Tr } from '@/ui';
import { useCreateCampaign } from './hooks';
import { inspectConsentRows, type ConsentInspection } from './consent';

const RECIPIENT_PREVIEW_LIMIT = 5;

function RecipientReadiness({ inspection }: { inspection: ConsentInspection }) {
  const preview = inspection.recipients.slice(0, RECIPIENT_PREVIEW_LIMIT);
  const hidden = inspection.recipients.length - preview.length;
  const tone = !inspection.rowCount ? 'neutral' : inspection.issues.length ? 'failed' : 'ok';
  const label = !inspection.rowCount
    ? 'No recipients'
    : inspection.issues.length
      ? `${inspection.issues.length} invalid`
      : `${inspection.recipients.length} ready`;

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border border-line bg-elevated p-3" aria-live="polite" aria-atomic="true">
        <div className="grid gap-0.5">
          <strong className="text-sm font-semibold text-fg">Recipient validation</strong>
          <span className="text-xs text-fg-3">{inspection.rowCount} non-empty source {inspection.rowCount === 1 ? 'line' : 'lines'}</span>
        </div>
        <Status tone={tone}>{label}</Status>
      </div>

      {inspection.issues.length ? (
        <ul className="grid gap-1 border border-line bg-recessed p-3 text-xs text-danger">
          {inspection.issues.slice(0, RECIPIENT_PREVIEW_LIMIT).map((issue) => <li key={`${issue.line}-${issue.message}`}>{issue.message}</li>)}
          {inspection.issues.length > RECIPIENT_PREVIEW_LIMIT ? <li>{inspection.issues.length - RECIPIENT_PREVIEW_LIMIT} more invalid rows.</li> : null}
        </ul>
      ) : null}

      {preview.length ? (
        <div className="grid gap-2">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <strong className="text-xs font-semibold text-fg">Recipient preview</strong>
            <span className="text-xs text-fg-3">Evidence references remain in the source editor only.</span>
          </div>
          <Table>
            <thead><tr><Th>Recipient</Th><Th>Source</Th><Th>Opted in</Th><Th>Evidence</Th></tr></thead>
            <tbody>
              {preview.map((recipient, index) => (
                <Tr key={`${recipient.jid}-${index}`}>
                  <Td className="font-mono text-xs">{recipient.jid}</Td>
                  <Td>{recipient.optInSource}</Td>
                  <Td className="font-mono text-xs whitespace-nowrap">{recipient.optedInAt}</Td>
                  <Td>Provided</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
          {hidden > 0 ? <p className="text-xs text-fg-3">Previewing {preview.length} of {inspection.recipients.length} valid recipients.</p> : null}
        </div>
      ) : null}
    </div>
  );
}

export function CreateCampaign() {
  const session = useApiSession();
  const capabilities = useServerCapabilities();
  const create = useCreateCampaign();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [rows, setRows] = useState('');
  const recipientInput = useRef<HTMLTextAreaElement>(null);
  const inspection = useMemo(() => inspectConsentRows(rows), [rows]);
  const recipientsReady = inspection.rowCount > 0 && inspection.issues.length === 0;
  const canSubmit = Boolean(name.trim() && text.trim() && recipientsReady && !create.isPending);
  const clearFailure = () => { if (create.error) create.reset(); };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!recipientsReady) {
      recipientInput.current?.focus();
      return;
    }
    try {
      const result = await create.mutateAsync({ name: name.trim(), text, recipients: inspection.recipients });
      setRows('');
      navigate(`/campaigns/${encodeURIComponent(result.campaign.id)}?created=1`, { replace: true });
    } catch { /* rendered below */ }
  };
  const instanceScope = session.keyKind === 'api';
  const orchestration = capabilities.data?.capabilities.includes('campaign_orchestration') ?? false;

  if (!instanceScope || capabilities.isPending || capabilities.isError || !orchestration) {
    const detail = !instanceScope
      ? 'Campaign creation requires an instance credential. No campaign request was sent.'
      : capabilities.isPending
        ? 'Discovering instance capabilities before enabling campaign creation.'
        : capabilities.isError
          ? 'Capability discovery failed. Campaign creation remains disabled.'
          : 'The backend does not advertise campaign_orchestration. The Console does not emulate campaign execution.';
    return (
      <div className="grid gap-6 p-6 max-sm:p-4">
        <PageHeader eyebrow="Messaging / Campaigns" title="Create campaign draft" description="Submit consent evidence once; execution remains in OmniWA GO." />
        <StateNotice kind="empty" title={!instanceScope ? 'Instance credential required' : capabilities.isPending ? 'Discovering capabilities' : 'Unsupported'} detail={detail} action={<Link to="/campaigns" className="underline">Return to campaigns</Link>} />
      </div>
    );
  }

  return (
    <div className="grid gap-6 p-6 max-sm:p-4">
      <PageHeader
        eyebrow="Messaging / Campaigns"
        title="Create campaign draft"
        description="Submit consent evidence once; execution, pacing, leases, and recipient retry remain in OmniWA GO."
      />

      <form className="grid min-w-0 gap-4 xl:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.2fr)] xl:items-start" aria-busy={create.isPending} onSubmit={(e) => void submit(e)}>
        <Panel title="Campaign content" description="Define the operator-facing draft and the text submitted for server-owned execution.">
          <div className="grid gap-4">
            <Field label="Campaign name" required>{(id) => <Input id={id} required maxLength={255} autoComplete="off" disabled={create.isPending} value={name} onChange={(e) => { clearFailure(); setName(e.target.value); }} />}</Field>
            <Field label="Message text" required description="Creation acknowledges the draft only; it does not prove send or delivery.">
              {(id) => <Textarea id={id} rows={10} required disabled={create.isPending} value={text} onChange={(e) => { clearFailure(); setText(e.target.value); }} />}
            </Field>
          </div>
        </Panel>

        <Panel title="Recipients & consent" description="Validate every consent-backed recipient before submitting the draft.">
          <div className="grid gap-4">
            <StateNotice kind="info" title="Consent evidence" detail="Raw evidence references are sent once and are not retained by the Console after successful submission." />
            <Field
              label="Consent-backed recipients"
              required
              description="One recipient per line: JID | opt-in source | evidence reference | ISO opt-in time."
              error={rows.trim() && inspection.issues[0] ? inspection.issues[0].message : undefined}
            >
              {(id) => (
                <Textarea
                  ref={recipientInput}
                  id={id}
                  rows={10}
                  required
                  disabled={create.isPending}
                  value={rows}
                  className="font-mono text-xs"
                  placeholder="84901234567@s.whatsapp.net | checkout | consent-record-id | 2026-07-22T08:00:00Z"
                  onChange={(e) => { clearFailure(); setRows(e.target.value); }}
                />
              )}
            </Field>
            <RecipientReadiness inspection={inspection} />
          </div>
        </Panel>

        {create.error ? <div className="xl:col-span-2"><ApiFailureNotice error={create.error} title="Command failed" /></div> : null}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 xl:col-span-2">
          <p className="text-xs text-fg-3">The refreshed campaign detail remains authoritative after creation.</p>
          <div className="flex flex-wrap justify-end gap-2 max-sm:w-full">
            <Button className="max-sm:flex-1" disabled={create.isPending} onClick={() => navigate('/campaigns')}>Cancel</Button>
            <Button className="max-sm:flex-1" variant="primary" type="submit" disabled={!canSubmit}>{create.isPending ? 'Creating draft…' : 'Create draft'}</Button>
          </div>
        </div>
      </form>
    </div>
  );
}
