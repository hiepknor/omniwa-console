import { useEffect, useState } from 'react';
import { ApiFailure } from '@/api/envelopes';
import { ApiFailureNotice } from '@/components/ApiFailureNotice';
import type { CreateGroupResult, GroupCreateRequest } from '@/api/groups';
import { humanizeToken } from '@/lib/format';
import { Button, DescriptionItem, DescriptionList, Dialog, Field, Input, StateNotice, Status, Textarea } from '@/ui';

export function CreateGroup({ open, pending, error, result, normalized, onCreate, onClose }: { open: boolean; pending: boolean; error: unknown; result?: CreateGroupResult; normalized: boolean; onCreate: (body: GroupCreateRequest) => void; onClose: () => void }) {
  const [name, setName] = useState('');
  const [participants, setParticipants] = useState('');
  useEffect(() => { if (!open) { setName(''); setParticipants(''); } }, [open]);
  const parsed = participants.split(/[\n,]/u).map((v) => v.trim()).filter(Boolean);
  const duplicate = new Set(parsed).size !== parsed.length;
  const invalidCount = parsed.length < 1 || parsed.length > 100;
  const submit = () => { if (name.trim() && !invalidCount && !duplicate && !pending) onCreate({ name: name.trim(), participants: parsed }); };
  const failure = error instanceof ApiFailure ? error : undefined;
  return (
    <Dialog
      open={open}
      onClose={onClose}
      closeDisabled={pending}
      title="Create group"
      footer={result ? <Button variant="primary" onClick={onClose}>Close outcome</Button> : <><Button disabled={pending} onClick={onClose}>Cancel</Button><Button variant="primary" disabled={!name.trim() || invalidCount || duplicate || pending} aria-busy={pending || undefined} onClick={submit}>{pending ? 'Submitting…' : 'Create group'}</Button></>}
    >
      <div className="grid gap-3">
        <p className="text-sm text-fg-2">Create once and inspect every participant outcome. Unknown outcomes are not retried automatically.</p>
        {!result ? <><Field label="Group name">{(id) => <Input id={id} value={name} autoComplete="off" autoFocus disabled={pending} onChange={(e) => setName(e.target.value)} />}</Field>
        <Field label="Initial participants" description={`${parsed.length} participant${parsed.length === 1 ? '' : 's'}. ${normalized ? 'Use canonical @s.whatsapp.net JIDs.' : 'Comma-separated values are accepted.'}`}>
          {(id) => <Textarea id={id} rows={4} value={participants} disabled={pending} placeholder="One phone or JID per line" onChange={(e) => setParticipants(e.target.value)} />}
        </Field>{duplicate ? <StateNotice kind="error" title="Duplicate participants" detail="Each participant may appear once." /> : invalidCount && parsed.length ? <StateNotice kind="error" title="Participant limit" detail="Create accepts 1 to 100 participants." /> : null}</> : <CreateOutcome result={result} />}
        {failure ? <ApiFailureNotice error={failure} title="Command failed" /> : null}
      </div>
    </Dialog>
  );
}

function CreateOutcome({ result }: { result: CreateGroupResult }) {
  return <div className="grid gap-3"><StateNotice kind={result.status === 'completed' ? 'info' : result.status === 'failed' ? 'error' : 'empty'} title={`Create ${humanizeToken(result.status)}`} detail={result.status === 'unknown' ? 'The final provider outcome is unknown. Inspect the directory before another command.' : 'The refreshed projection remains authoritative.'} /><DescriptionList><DescriptionItem label="Group JID" mono>{result.groupJid ?? 'Not resolved'}</DescriptionItem><DescriptionItem label="Requested">{String(result.requestedCount ?? 'Not reported')}</DescriptionItem><DescriptionItem label="Succeeded">{String(result.succeededCount ?? 'Not reported')}</DescriptionItem><DescriptionItem label="Failed">{String(result.failedCount ?? 'Not reported')}</DescriptionItem><DescriptionItem label="Unknown">{String(result.unknownCount ?? 'Not reported')}</DescriptionItem></DescriptionList>{result.outcomes.length ? <ul className="grid border border-line">{result.outcomes.map((outcome, index) => <li key={`${outcome.participant ?? 'participant'}-${index}`} className="flex items-start justify-between gap-3 border-b border-line p-3 last:border-b-0"><span className="grid min-w-0"><strong className="truncate font-mono text-xs">{outcome.participant ?? `Participant ${index + 1}`}</strong>{outcome.code || outcome.message ? <small className="text-xs text-fg-3">{humanizeToken(outcome.code ?? outcome.message ?? '')}</small> : null}</span><Status tone={outcome.status === 'succeeded' ? 'ok' : outcome.status === 'failed' ? 'failed' : 'degraded'}>{humanizeToken(outcome.status)}</Status></li>)}</ul> : null}</div>;
}
