import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useInstanceCredential, useSetInstanceCredential } from '@/api/ApiProvider';
import { useServerCapabilities } from '@/api/CapabilitiesProvider';
import type { InstanceAdvancedSettings, InstanceResource } from '@/api/instances';
import { queryKeys } from '@/api/keys';
import { Button, CommandAck, Dialog, Field, Inspector, StateNotice, Status, Surface } from '@/components/v2';
import { humanizeToken, relativeTime } from '@/lib/format';
import {
  useAdvancedSettingsV2,
  useConnectInstanceV2,
  useDestroyInstanceV2,
  useDisconnectInstanceV2,
  useInstanceQrV2,
  useInstanceStatusV2,
  useLogoutInstanceV2,
  useReconnectInstanceV2,
  useRotateInstanceTokenV2,
  useUpdateAdvancedSettingsV2,
} from './hooks';
import { FailureNotice } from './ui';

type ConfirmAction = 'disconnect' | 'logout' | 'destroy';

const settings: Array<{ key: keyof InstanceAdvancedSettings; label: string; hint: string }> = [
  { key: 'alwaysOnline', label: 'Always online', hint: 'Keep account presence online.' },
  { key: 'readMessages', label: 'Read receipts', hint: 'Send read receipts for incoming messages.' },
  { key: 'rejectCall', label: 'Reject calls', hint: 'Automatically decline incoming calls.' },
  { key: 'ignoreGroups', label: 'Ignore groups', hint: 'Do not process group messages.' },
  { key: 'ignoreStatus', label: 'Ignore status', hint: 'Do not process status updates.' },
];

function Ack({ action }: { action: string }) {
  return <CommandAck action={action} note="Refreshed status remains authoritative; acknowledgement does not prove final connectivity or pairing." />;
}

function AdvancedSettingsV2({ instanceId, token }: { instanceId: string; token: string }) {
  const query = useAdvancedSettingsV2(instanceId, token);
  const update = useUpdateAdvancedSettingsV2(instanceId, token);
  const [draft, setDraft] = useState<InstanceAdvancedSettings>();
  useEffect(() => { if (query.data) setDraft(query.data); }, [query.data]);
  const dirty = draft && query.data && JSON.stringify(draft) !== JSON.stringify(query.data);
  return <Surface title="Advanced settings" description="Instance-scoped live configuration. Saving does not imply provider delivery.">
    {query.isPending ? <StateNotice value={{ axis: 'resource', state: 'initial-loading' }} /> : !draft && query.isError ? <FailureNotice error={query.error} onRetry={() => query.refetch()} /> : draft ? <div className="ui-v2-settings-list">
      {query.isError ? <FailureNotice error={query.error} stale onRetry={() => query.refetch()} /> : null}
      {settings.map(({ key, label, hint }) => <label key={key} className="ui-v2-setting"><span><strong>{label}</strong><small>{hint}</small></span><input type="checkbox" checked={Boolean(draft[key])} disabled={update.isPending} onChange={() => setDraft({ ...draft, [key]: !draft[key] })} /></label>)}
      <Field label="Call rejection message" value={draft.msgRejectCall} disabled={!draft.rejectCall || update.isPending} onChange={(event) => setDraft({ ...draft, msgRejectCall: event.target.value })} />
      <Button onClick={() => update.mutate(draft)} disabled={!dirty || update.isPending}>{update.isPending ? 'Saving…' : 'Save settings'}</Button>
      {update.data ? <Ack action="Advanced settings update" /> : null}
      {update.error ? <FailureNotice error={update.error} command /> : null}
    </div> : null}
  </Surface>;
}

export function InstanceWorkspaceV2({ instance, refreshError, onRetry, onClose, onDestroyed }: { instance: InstanceResource; refreshError?: unknown; onRetry: () => void; onClose: () => void; onDestroyed: () => void }) {
  const token = useInstanceCredential(instance.id);
  const setCredential = useSetInstanceCredential();
  const queryClient = useQueryClient();
  const capabilities = useServerCapabilities();
  const [credentialDraft, setCredentialDraft] = useState('');
  const [confirm, setConfirm] = useState<ConfirmAction>();
  const [confirmText, setConfirmText] = useState('');
  const [rotationOpen, setRotationOpen] = useState(false);
  const [rotationReason, setRotationReason] = useState('');
  const status = useInstanceStatusV2(instance.id, token);
  const statusReady = status.data !== undefined;
  const connected = status.data?.connected ?? false;
  const loggedIn = status.data?.loggedIn ?? false;
  const pairing = Boolean(token && statusReady && !loggedIn);
  const qr = useInstanceQrV2(instance.id, token, pairing && connected);
  const connect = useConnectInstanceV2(instance.id, token);
  const reconnect = useReconnectInstanceV2(instance.id, token);
  const disconnect = useDisconnectInstanceV2(instance.id, token);
  const logout = useLogoutInstanceV2(instance.id, token);
  const destroy = useDestroyInstanceV2(instance.id);
  const rotate = useRotateInstanceTokenV2(instance.id);
  const rotationAvailable = capabilities.data?.capabilities.includes('instance_token_rotation') && (instance.credentialVersion ?? 0) > 0;
  const lifecyclePending = connect.isPending || reconnect.isPending || disconnect.isPending || logout.isPending;
  const confirmMutation = confirm === 'disconnect' ? disconnect : confirm === 'logout' ? logout : destroy;
  const lastAck = connect.data ? 'Connect' : reconnect.data ? 'Reconnect' : disconnect.data ? 'Disconnect' : logout.data ? 'Logout' : undefined;
  const commandError = connect.error ?? reconnect.error ?? disconnect.error ?? logout.error;

  const closeConfirm = () => { setConfirm(undefined); setConfirmText(''); disconnect.reset(); logout.reset(); destroy.reset(); };
  const submitConfirm = () => {
    if (!confirm || confirmText !== instance.id || confirmMutation.isPending) return;
    confirmMutation.mutate(undefined, { onSuccess: () => {
      if (confirm === 'destroy') onDestroyed();
      closeConfirm();
    } });
  };
  const runPairing = () => (connected ? reconnect : connect).mutate();
  const updateCredential = (nextToken: string | undefined) => {
    for (const queryKey of [
      queryKeys.instanceStatus(instance.id),
      queryKeys.instanceQr(instance.id),
      queryKeys.instanceAdvancedSettings(instance.id),
    ]) {
      queryClient.removeQueries({ queryKey, exact: true });
    }
    setCredential(instance.id, nextToken);
  };

  return <>
    <Inspector titleId="instance-v2-details" eyebrow="Instance workspace" title={instance.displayName ?? 'Unnamed instance'} subtitle={<span className="ui-v2-mono">{instance.id}</span>} status={<Status tone={!statusReady ? 'pending' : loggedIn ? 'healthy' : connected ? 'pending' : 'failed'}>{!statusReady ? 'Status not read' : loggedIn ? 'Paired' : connected ? 'Pairing' : 'Disconnected'}</Status>} modal onClose={onClose}>
      <div className="ui-v2-stack">
        {refreshError ? <FailureNotice error={refreshError} stale onRetry={onRetry} /> : null}
        <Surface title="Instance facts" description="Admin metadata and instance-scoped status remain separate.">
          <dl className="ui-v2-detail-list">
            <div><dt>Metadata status</dt><dd>{humanizeToken(instance.status)}</dd></div><div><dt>Metadata connection</dt><dd>{instance.connected ? 'Connected' : 'Disconnected'}</dd></div><div><dt>Live connection</dt><dd>{statusReady ? connected ? 'Connected' : 'Disconnected' : 'Not read'}</dd></div><div><dt>Paired</dt><dd>{statusReady ? loggedIn ? 'Yes' : 'No' : 'Not read'}</dd></div><div><dt>WhatsApp ID</dt><dd className="ui-v2-mono">{instance.jid ?? 'Not reported'}</dd></div><div><dt>Credential version</dt><dd>{instance.credentialVersion ?? 'Not reported'}</dd></div><div><dt>Created</dt><dd title={instance.createdAt}>{relativeTime(instance.createdAt) || 'Not reported'}</dd></div>
          </dl>
        </Surface>

        {!token ? <Surface title="Attach instance token" description="Required for status, pairing, settings, and lifecycle commands. Held in memory only.">
          <div className="ui-v2-stack"><Field label="Instance token" type="password" value={credentialDraft} autoComplete="off" spellCheck={false} onChange={(event) => setCredentialDraft(event.target.value)} /><Button variant="primary" disabled={!credentialDraft.trim()} onClick={() => { updateCredential(credentialDraft.trim()); setCredentialDraft(''); }}>Use for this session</Button></div>
        </Surface> : <Button onClick={() => updateCredential(undefined)}>Forget session token</Button>}

        {token ? <Surface title="Connection and pairing" description="Connected and paired are different server facts.">
          <div className="ui-v2-stack">
            {status.isPending ? <StateNotice value={{ axis: 'resource', state: 'initial-loading' }} detail="Reading instance status." /> : status.error ? <FailureNotice error={status.error} stale={status.data !== undefined} onRetry={() => status.refetch()} /> : null}
            {lastAck ? <Ack action={lastAck} /> : null}{commandError ? <FailureNotice error={commandError} command /> : null}
            {pairing ? <div className="ui-v2-qr-workspace">{qr.error ? <FailureNotice error={qr.error} onRetry={() => qr.refetch()} /> : qr.data?.qrcode ? <img src={qr.data.qrcode} alt="QR code to pair this OmniWA instance" /> : connected ? <StateNotice value={{ axis: 'resource', state: 'initial-loading' }} detail="Waiting for the rotating pairing QR." /> : <StateNotice value={{ axis: 'resource', state: 'empty' }} detail="Start a connection to request a QR." />}<p>WhatsApp → Linked Devices → Link a Device. Pairing is complete only when status reports loggedIn.</p></div> : null}
            <div className="ui-v2-command-bar"><Button variant="primary" disabled={lifecyclePending || loggedIn} onClick={runPairing}>{connected ? 'Restart pairing' : 'Connect'}</Button><Button disabled={lifecyclePending || !loggedIn} onClick={() => reconnect.mutate()}>Reconnect</Button></div>
          </div>
        </Surface> : null}

        {token && loggedIn ? <AdvancedSettingsV2 instanceId={instance.id} token={token} /> : null}

        {rotationAvailable ? <Surface title="Credential rotation" description="Requires current version and an audit reason; the replacement token is shown once."><Button variant="danger" onClick={() => { rotate.reset(); setRotationReason(''); setRotationOpen(true); }}>Rotate token…</Button></Surface> : null}

        <Surface title="Destructive actions" description="Disconnect drops the live connection; logout unpairs; destroy permanently removes the instance."><div className="ui-v2-command-bar ui-v2-instance-command-bar"><Button variant="danger" disabled={!token} onClick={() => setConfirm('disconnect')}>Disconnect…</Button><Button variant="danger" disabled={!token || !loggedIn} onClick={() => setConfirm('logout')}>Log out…</Button><Button variant="danger" onClick={() => setConfirm('destroy')}>Destroy…</Button></div></Surface>
      </div>
    </Inspector>

    {confirm ? <Dialog titleId="instance-v2-confirm" eyebrow="Destructive command" title={`${confirm === 'destroy' ? 'Destroy' : confirm === 'logout' ? 'Log out' : 'Disconnect'} instance?`} description={`Type the exact instance ID to confirm. ${confirm === 'destroy' ? 'This cannot be undone.' : 'Server acknowledgement is not final refreshed state.'}`} canClose={!confirmMutation.isPending} onClose={closeConfirm} actions={<><Button disabled={confirmMutation.isPending} onClick={closeConfirm}>Cancel</Button><Button variant="danger" disabled={confirmText !== instance.id || confirmMutation.isPending} onClick={submitConfirm}>{confirmMutation.isPending ? 'Submitting…' : 'Confirm command'}</Button></>}><Field label="Instance ID" value={confirmText} autoComplete="off" autoFocus disabled={confirmMutation.isPending} onChange={(event) => setConfirmText(event.target.value)} />{confirmMutation.error ? <FailureNotice error={confirmMutation.error} command /> : null}</Dialog> : null}

    {rotationOpen ? <Dialog titleId="instance-v2-rotation" eyebrow="Credential command" title={rotate.data ? 'Store the replacement token' : 'Rotate instance token?'} description={rotate.data ? 'This token is shown once and remains in Console memory only until reload or sign-out.' : `Expected credential version ${instance.credentialVersion}. Rotation invalidates the previous token.`} canClose={!rotate.isPending && !rotate.data} onClose={() => setRotationOpen(false)} actions={rotate.data ? <Button variant="primary" onClick={() => setRotationOpen(false)}>I stored the token</Button> : <><Button disabled={rotate.isPending} onClick={() => setRotationOpen(false)}>Cancel</Button><Button variant="danger" disabled={!rotationReason.trim() || rotate.isPending} onClick={() => rotate.mutate({ expectedVersion: instance.credentialVersion ?? 0, reason: rotationReason.trim() })}>{rotate.isPending ? 'Rotating…' : 'Rotate token'}</Button></>}>
      {rotate.data ? <><Ack action="Token rotation" /><Field label="One-time replacement token" value={rotate.data.token} readOnly autoComplete="off" spellCheck={false} onFocus={(event) => event.currentTarget.select()} /></> : <Field label="Operator reason" value={rotationReason} maxLength={255} autoFocus disabled={rotate.isPending} onChange={(event) => setRotationReason(event.target.value)} />}{rotate.error ? <FailureNotice error={rotate.error} command /> : null}
    </Dialog> : null}
  </>;
}
