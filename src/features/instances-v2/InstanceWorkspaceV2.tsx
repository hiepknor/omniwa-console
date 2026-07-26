import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useInstanceCredential, useSetInstanceCredential } from '@/api/ApiProvider';
import { useServerCapabilities } from '@/api/CapabilitiesProvider';
import type { InstanceAdvancedSettings, InstanceResource } from '@/api/instances';
import { queryKeys } from '@/api/keys';
import { humanizeToken, relativeTime } from '@/lib/format';
import { Button, Dialog, Field, Input, Panel, StateNotice, Status } from '@/ui';
import { Drawer } from '@/ui';
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
  return (
    <StateNotice
      kind="info"
      title={`${action} accepted`}
      detail="Refreshed status remains authoritative; acknowledgement does not prove final connectivity or pairing."
    />
  );
}

function Toggle({ label, hint, checked, disabled, onChange }: { label: string; hint: string; checked: boolean; disabled?: boolean; onChange: () => void }) {
  return (
    <label className="flex items-start justify-between gap-4 py-2 border-b border-line last:border-b-0">
      <span className="grid gap-0.5">
        <strong className="text-[13px] font-medium text-fg">{label}</strong>
        <small className="text-xs text-fg-3">{hint}</small>
      </span>
      <input type="checkbox" className="mt-1 size-4 accent-fg" checked={checked} disabled={disabled} onChange={onChange} />
    </label>
  );
}

function AdvancedSettingsV2({ instanceId, token }: { instanceId: string; token: string }) {
  const query = useAdvancedSettingsV2(instanceId, token);
  const update = useUpdateAdvancedSettingsV2(instanceId, token);
  const [draft, setDraft] = useState<InstanceAdvancedSettings>();
  useEffect(() => { if (query.data) setDraft(query.data); }, [query.data]);
  const dirty = draft && query.data && JSON.stringify(draft) !== JSON.stringify(query.data);
  return (
    <Panel title="Advanced settings" description="Instance-scoped live configuration. Saving does not imply provider delivery.">
      {query.isPending ? (
        <StateNotice kind="loading" title="Loading settings" />
      ) : !draft && query.isError ? (
        <FailureNotice error={query.error} onRetry={() => query.refetch()} />
      ) : draft ? (
        <div className="grid gap-3">
          {query.isError ? <FailureNotice error={query.error} stale onRetry={() => query.refetch()} /> : null}
          <div>
            {settings.map(({ key, label, hint }) => (
              <Toggle key={key} label={label} hint={hint} checked={Boolean(draft[key])} disabled={update.isPending} onChange={() => setDraft({ ...draft, [key]: !draft[key] })} />
            ))}
          </div>
          <Field label="Call rejection message">
            {(id) => (
              <Input id={id} value={draft.msgRejectCall ?? ''} disabled={!draft.rejectCall || update.isPending} onChange={(e) => setDraft({ ...draft, msgRejectCall: e.target.value })} />
            )}
          </Field>
          <Button onClick={() => update.mutate(draft)} disabled={!dirty || update.isPending}>{update.isPending ? 'Saving…' : 'Save settings'}</Button>
          {update.data ? <Ack action="Advanced settings update" /> : null}
          {update.error ? <FailureNotice error={update.error} command /> : null}
        </div>
      ) : null}
    </Panel>
  );
}

function Fact({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5 border-b border-line last:border-b-0">
      <dt className="text-xs text-fg-3">{label}</dt>
      <dd className={mono ? 'font-mono text-xs text-fg' : 'text-[13px] text-fg'}>{value}</dd>
    </div>
  );
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
    confirmMutation.mutate(undefined, { onSuccess: () => { if (confirm === 'destroy') onDestroyed(); closeConfirm(); } });
  };
  const runPairing = () => (connected ? reconnect : connect).mutate();
  const updateCredential = (nextToken: string | undefined) => {
    for (const queryKey of [queryKeys.instanceStatus(instance.id), queryKeys.instanceQr(instance.id), queryKeys.instanceAdvancedSettings(instance.id)]) {
      queryClient.removeQueries({ queryKey, exact: true });
    }
    setCredential(instance.id, nextToken);
  };

  const drawerStatus: { tone: 'pending' | 'ok' | 'failed'; label: string } = !statusReady
    ? { tone: 'pending', label: 'Status not read' }
    : loggedIn
      ? { tone: 'ok', label: 'Paired' }
      : connected
        ? { tone: 'pending', label: 'Pairing' }
        : { tone: 'failed', label: 'Disconnected' };

  return (
    <>
      <Drawer open onClose={onClose} title={instance.displayName ?? 'Unnamed instance'} subtitle={instance.id}>
        <div className="grid gap-4">
          <Status tone={drawerStatus.tone}>{drawerStatus.label}</Status>
          {refreshError ? <FailureNotice error={refreshError} stale onRetry={onRetry} /> : null}

          <Panel title="Instance facts" description="Admin metadata and instance-scoped status remain separate." bodyClassName="pt-2">
            <dl>
              <Fact label="Metadata status" value={humanizeToken(instance.status)} />
              <Fact label="Metadata connection" value={instance.connected ? 'Connected' : 'Disconnected'} />
              <Fact label="Live connection" value={statusReady ? (connected ? 'Connected' : 'Disconnected') : 'Not read'} />
              <Fact label="Paired" value={statusReady ? (loggedIn ? 'Yes' : 'No') : 'Not read'} />
              <Fact label="WhatsApp ID" value={instance.jid ?? 'Not reported'} mono />
              <Fact label="Credential version" value={String(instance.credentialVersion ?? 'Not reported')} />
              <Fact label="Created" value={relativeTime(instance.createdAt) || 'Not reported'} />
            </dl>
          </Panel>

          {!token ? (
            <Panel title="Attach instance token" description="Required for status, pairing, settings, and lifecycle commands. Held in memory only.">
              <div className="grid gap-3">
                <Field label="Instance token">
                  {(id) => <Input id={id} type="password" value={credentialDraft} autoComplete="off" spellCheck={false} onChange={(e) => setCredentialDraft(e.target.value)} />}
                </Field>
                <Button variant="primary" disabled={!credentialDraft.trim()} onClick={() => { updateCredential(credentialDraft.trim()); setCredentialDraft(''); }}>Use for this session</Button>
              </div>
            </Panel>
          ) : (
            <Button onClick={() => updateCredential(undefined)}>Forget session token</Button>
          )}

          {token ? (
            <Panel title="Connection and pairing" description="Connected and paired are different server facts.">
              <div className="grid gap-3">
                {status.isPending ? <StateNotice kind="loading" title="Reading status" detail="Reading instance status." /> : status.error ? <FailureNotice error={status.error} stale={status.data !== undefined} onRetry={() => status.refetch()} /> : null}
                {lastAck ? <Ack action={lastAck} /> : null}
                {commandError ? <FailureNotice error={commandError} command /> : null}
                {pairing ? (
                  <div className="grid gap-2">
                    {qr.error ? (
                      <FailureNotice error={qr.error} onRetry={() => qr.refetch()} />
                    ) : qr.data?.qrcode ? (
                      <div className="justify-self-start bg-white p-3 border border-line-strong">
                        <img src={qr.data.qrcode} alt="QR code to pair this OmniWA instance" className="size-52" />
                      </div>
                    ) : connected ? (
                      <StateNotice kind="loading" title="Waiting for QR" detail="Waiting for the rotating pairing QR." />
                    ) : (
                      <StateNotice kind="empty" title="No QR yet" detail="Start a connection to request a QR." />
                    )}
                    <p className="text-xs text-fg-3">WhatsApp → Linked Devices → Link a Device. Pairing is complete only when status reports loggedIn.</p>
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Button variant="primary" disabled={lifecyclePending || loggedIn} onClick={runPairing}>{connected ? 'Restart pairing' : 'Connect'}</Button>
                  <Button disabled={lifecyclePending || !loggedIn} onClick={() => reconnect.mutate()}>Reconnect</Button>
                </div>
              </div>
            </Panel>
          ) : null}

          {token && loggedIn ? <AdvancedSettingsV2 instanceId={instance.id} token={token} /> : null}

          {rotationAvailable ? (
            <Panel title="Credential rotation" description="Requires current version and an audit reason; the replacement token is shown once.">
              <Button variant="danger" onClick={() => { rotate.reset(); setRotationReason(''); setRotationOpen(true); }}>Rotate token…</Button>
            </Panel>
          ) : null}

          <Panel title="Destructive actions" description="Disconnect drops the live connection; logout unpairs; destroy permanently removes the instance.">
            <div className="flex flex-wrap gap-2">
              <Button variant="danger" disabled={!token} onClick={() => setConfirm('disconnect')}>Disconnect…</Button>
              <Button variant="danger" disabled={!token || !loggedIn} onClick={() => setConfirm('logout')}>Log out…</Button>
              <Button variant="danger" onClick={() => setConfirm('destroy')}>Destroy…</Button>
            </div>
          </Panel>
        </div>
      </Drawer>

      <Dialog
        open={Boolean(confirm)}
        onClose={closeConfirm}
        title={`${confirm === 'destroy' ? 'Destroy' : confirm === 'logout' ? 'Log out' : 'Disconnect'} instance?`}
        footer={
          <>
            <Button disabled={confirmMutation.isPending} onClick={closeConfirm}>Cancel</Button>
            <Button variant="danger" disabled={confirmText !== instance.id || confirmMutation.isPending} onClick={submitConfirm}>{confirmMutation.isPending ? 'Submitting…' : 'Confirm command'}</Button>
          </>
        }
      >
        <div className="grid gap-3">
          <p className="text-sm text-fg-2">Type the exact instance ID to confirm. {confirm === 'destroy' ? 'This cannot be undone.' : 'Server acknowledgement is not final refreshed state.'}</p>
          <Field label="Instance ID">
            {(id) => <Input id={id} value={confirmText} autoComplete="off" autoFocus disabled={confirmMutation.isPending} onChange={(e) => setConfirmText(e.target.value)} />}
          </Field>
          {confirmMutation.error ? <FailureNotice error={confirmMutation.error} command /> : null}
        </div>
      </Dialog>

      <Dialog
        open={rotationOpen}
        onClose={() => setRotationOpen(false)}
        title={rotate.data ? 'Store the replacement token' : 'Rotate instance token?'}
        footer={
          rotate.data ? (
            <Button variant="primary" onClick={() => setRotationOpen(false)}>I stored the token</Button>
          ) : (
            <>
              <Button disabled={rotate.isPending} onClick={() => setRotationOpen(false)}>Cancel</Button>
              <Button variant="danger" disabled={!rotationReason.trim() || rotate.isPending} onClick={() => rotate.mutate({ expectedVersion: instance.credentialVersion ?? 0, reason: rotationReason.trim() })}>{rotate.isPending ? 'Rotating…' : 'Rotate token'}</Button>
            </>
          )
        }
      >
        <div className="grid gap-3">
          {rotate.data ? (
            <>
              <Ack action="Token rotation" />
              <p className="text-sm text-fg-2">This token is shown once and remains in Console memory only until reload or sign-out.</p>
              <Field label="One-time replacement token">
                {(id) => <Input id={id} value={rotate.data.token} readOnly autoComplete="off" spellCheck={false} onFocus={(e) => e.currentTarget.select()} />}
              </Field>
            </>
          ) : (
            <>
              <p className="text-sm text-fg-2">Expected credential version {instance.credentialVersion}. Rotation invalidates the previous token.</p>
              <Field label="Operator reason">
                {(id) => <Input id={id} value={rotationReason} maxLength={255} autoFocus disabled={rotate.isPending} onChange={(e) => setRotationReason(e.target.value)} />}
              </Field>
            </>
          )}
          {rotate.error ? <FailureNotice error={rotate.error} command /> : null}
        </div>
      </Dialog>
    </>
  );
}
