import { useEffect, useState } from 'react';
import type { JoinGroupResult } from '@/api/groups';
import { ApiFailureNotice } from '@/components/ApiFailureNotice';
import { humanizeToken } from '@/lib/format';
import { Button, DescriptionItem, DescriptionList, Dialog, Field, Input, StateNotice, Status } from '@/ui';

export function JoinGroup({ open, pending, error, result, onJoin, onClose }: { open: boolean; pending: boolean; error: unknown; result?: JoinGroupResult; onJoin: (code: string) => void; onClose: () => void }) {
  const [code, setCode] = useState('');
  useEffect(() => { if (!open) setCode(''); }, [open]);
  return <Dialog open={open} onClose={onClose} closeDisabled={pending} title="Join group" footer={result ? <Button variant="primary" onClick={onClose}>Close outcome</Button> : <><Button disabled={pending} onClick={onClose}>Cancel</Button><Button variant="primary" disabled={pending || !code.trim()} aria-busy={pending || undefined} onClick={() => onJoin(code.trim())}>{pending ? 'Submitting…' : 'Join group'}</Button></>}>
    <div className="grid gap-3">
      <p className="text-sm text-fg-2">Submit the invite code once. An unknown outcome requires operator review and is never retried automatically.</p>
      {!result ? <Field label="Invite code" required>{(id) => <Input id={id} value={code} autoFocus autoComplete="off" disabled={pending} onChange={(event) => setCode(event.target.value)} />}</Field> : <><StateNotice kind={result.joinStatus === 'joined' || result.joinStatus === 'already_member' ? 'info' : result.joinStatus === 'rejected' ? 'error' : 'empty'} title={`Join ${humanizeToken(result.joinStatus)}`} detail={result.joinStatus === 'unknown' ? 'The backend could not establish final membership. Inspect the directory before submitting another command.' : result.reason} /><DescriptionList><DescriptionItem label="Status"><Status tone={result.joinStatus === 'joined' || result.joinStatus === 'already_member' ? 'ok' : result.joinStatus === 'rejected' ? 'failed' : 'degraded'}>{humanizeToken(result.joinStatus)}</Status></DescriptionItem><DescriptionItem label="Group JID" mono>{result.groupJid ?? 'Not resolved'}</DescriptionItem><DescriptionItem label="Command ID" mono>{result.commandId ?? 'Not reported'}</DescriptionItem></DescriptionList></>}
      {error ? <ApiFailureNotice error={error} title="Join command failed" /> : null}
    </div>
  </Dialog>;
}
