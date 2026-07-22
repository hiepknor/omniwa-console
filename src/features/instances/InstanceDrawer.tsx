import { useEffect, useState } from 'react';
import type { CommandResult } from '@/api/envelopes';
import type { InstanceAdvancedSettings, InstanceResource } from '@/api/instances';
import { StatusIndicator } from '@/components/badges';
import { InlineError } from '@/components/InlineError';
import { SurfaceNotice } from '@/components/feedback/SurfaceNotice';
import { TypedConfirmationDialog } from '@/components/TypedConfirmationDialog';
import { DetailDrawer, DetailDrawerState, DrawerIdentifier } from '@/components/drawer/DetailDrawer';
import { useFeedback } from '@/components/feedback/FeedbackProvider';
import { relativeTime } from '@/lib/format';
import { useResilientReadState } from '@/lib/query-state';
import {
  useConnectInstance,
  useDestroyInstance,
  useDisconnectInstance,
  useInstanceAdvancedSettings,
  useInstanceQr,
  useInstanceStatus,
  useLogoutInstance,
  useReconnectInstance,
  useUpdateAdvancedSettings,
} from './hooks';

function SettingToggle({ label, hint, checked, disabled, onChange }: {
  label: string;
  hint: string;
  checked: boolean;
  disabled: boolean;
  onChange: () => void;
}) {
  return (
    <div className="toggle-row">
      <span><strong>{label}</strong><small>{hint}</small></span>
      <button
        className={`toggle-switch${checked ? ' is-on' : ''}`}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={`${label}: ${checked ? 'on' : 'off'}`}
        disabled={disabled}
        onClick={onChange}
      >
        <span aria-hidden="true" />
      </button>
    </div>
  );
}

const ADVANCED_TOGGLES: { key: keyof InstanceAdvancedSettings; label: string; hint: string }[] = [
  { key: 'alwaysOnline', label: 'Always online', hint: 'Keep the account presence online' },
  { key: 'readMessages', label: 'Read receipts', hint: 'Send read receipts for incoming messages' },
  { key: 'rejectCall', label: 'Reject calls', hint: 'Automatically decline incoming calls' },
  { key: 'ignoreGroups', label: 'Ignore groups', hint: 'Do not process group messages' },
  { key: 'ignoreStatus', label: 'Ignore status', hint: 'Do not process status updates' },
];

function AdvancedSettings({ instanceId, token }: { instanceId: string; token: string | undefined }) {
  const query = useInstanceAdvancedSettings(instanceId, token);
  const update = useUpdateAdvancedSettings(instanceId, token);
  const feedback = useFeedback();
  const readState = useResilientReadState(query, query.data !== undefined);
  const [draft, setDraft] = useState<InstanceAdvancedSettings>();

  useEffect(() => { if (query.data) setDraft(query.data); }, [query.data]);

  const dirty = draft !== undefined && query.data !== undefined && JSON.stringify(draft) !== JSON.stringify(query.data);
  const save = () => {
    if (!draft) return;
    update.mutate(draft, {
      onSuccess: (result) => feedback.command(result.disposition, {
        action: 'Advanced settings',
        acceptedDetail: 'omniwa-go accepted the settings update.',
        completedDetail: 'omniwa-go saved the advanced settings.',
        requestId: result.requestId,
        dedupeKey: `instance:${instanceId}:advanced-settings`,
      }),
    });
  };

  return (
    <section aria-labelledby="instance-advanced-title">
      <span className="eyebrow">Configuration</span>
      <h3 id="instance-advanced-title">Advanced settings</h3>
      {readState.isInitialLoading ? (
        <div className="empty">Loading settings…</div>
      ) : readState.isInitialError ? (
        <InlineError error={readState.error} onRetry={query.refetch} />
      ) : draft ? (
        <>
          <div className="toggle-list">
            {ADVANCED_TOGGLES.map(({ key, label, hint }) => (
              <SettingToggle
                key={key}
                label={label}
                hint={hint}
                checked={Boolean(draft[key])}
                disabled={update.isPending}
                onChange={() => setDraft({ ...draft, [key]: !draft[key] })}
              />
            ))}
          </div>
          <div className="field !mt-3">
            <label htmlFor="instance-reject-message">Call rejection message</label>
            <input
              id="instance-reject-message"
              className="input"
              value={draft.msgRejectCall}
              disabled={update.isPending || !draft.rejectCall}
              placeholder={draft.rejectCall ? 'Message sent when a call is rejected' : 'Enable "Reject calls" first'}
              onChange={(event) => setDraft({ ...draft, msgRejectCall: event.target.value })}
            />
          </div>
          <button className="btn !mt-3" type="button" disabled={!dirty || update.isPending} onClick={save}>
            {update.isPending ? 'Saving…' : 'Save settings'}
          </button>
          {update.error && <InlineError error={update.error} announce onRetry={save} />}
        </>
      ) : null}
      {readState.isStaleError && <InlineError error={readState.error} onRetry={query.refetch} />}
    </section>
  );
}

// omniwa-go distinguishes `connected` (websocket to WhatsApp is up) from
// `loggedIn` (a phone has scanned the QR and the account is paired). Pairing is
// only complete once loggedIn is true.
function pairStatus(connected: boolean, loggedIn: boolean): { dot: string; label: string } {
  if (loggedIn) return { dot: 'dot-ok', label: 'connected' };
  if (connected) return { dot: 'dot-pending', label: 'pairing' };
  return { dot: 'dot-failed', label: 'disconnected' };
}

export function InstanceDrawer({
  instance,
  onClose,
  onDestroyed,
}: {
  instance: InstanceResource;
  onClose: () => void;
  onDestroyed: (result: CommandResult) => void;
}) {
  const instanceName = instance.displayName || 'Unnamed instance';
  const [confirmation, setConfirmation] = useState<'disconnect' | 'logout' | 'destroy'>();
  const feedback = useFeedback();
  const tokenAvailable = Boolean(instance.token);

  const status = useInstanceStatus(instance.id, instance.token);
  // Only trust the pairing state once status has actually loaded — otherwise
  // loggedIn defaults to false and we would fetch a QR for an already-paired
  // instance (omniwa-go answers /instance/qr with 400 in that case).
  const statusReady = status.data !== undefined;
  const connected = status.data?.connected ?? instance.connected;
  const loggedIn = status.data?.loggedIn ?? false;
  const pair = pairStatus(connected, loggedIn);
  const needsPairing = tokenAvailable && statusReady && !loggedIn;

  // A pairing QR only exists once the websocket is connected and login is pending.
  const qr = useInstanceQr(instance.id, instance.token, needsPairing && connected);
  const connect = useConnectInstance(instance.id, instance.token);
  const reconnect = useReconnectInstance(instance.id, instance.token);
  const disconnect = useDisconnectInstance(instance.id, instance.token);
  const logout = useLogoutInstance(instance.id, instance.token);
  const destroy = useDestroyInstance(instance.id);

  const commandFeedback = (result: CommandResult, action: string) => {
    feedback.command(result.disposition, {
      action,
      acceptedDetail: 'omniwa-go accepted the command. Status refreshes automatically.',
      completedDetail: 'omniwa-go completed the command. Status refreshes automatically.',
      requestId: result.requestId,
      dedupeKey: `instance:${instance.id}:${action.toLowerCase().replaceAll(' ', '-')}`,
    });
  };
  const commandPending = connect.isPending || reconnect.isPending || disconnect.isPending;

  return (
    <>
      <DetailDrawer titleId="instance-detail-title" eyebrow="Instance management" title={instanceName} status={<StatusIndicator dotClass={pair.dot}>{pair.label}</StatusIndicator>} subtitle={<DrawerIdentifier value={instance.id} label="Copy instance identifier" />} className="instances-drawer" closeLabel="Close instance details" suppressEscape={confirmation !== undefined} onClose={onClose}>
          <section aria-labelledby="instance-facts-title">
            <h3 id="instance-facts-title" className="visually-hidden">Instance facts</h3>
            <dl className="kv">
              <dt>Status</dt><dd><StatusIndicator size="small" dotClass={pair.dot}>{pair.label}</StatusIndicator></dd>
              <dt>Websocket</dt><dd>{connected ? 'connected' : 'disconnected'}</dd>
              <dt>Paired</dt><dd>{loggedIn ? 'yes' : 'no'}</dd>
              <dt>WhatsApp ID</dt><dd className="mono" title={instance.jid}>{instance.jid ?? '—'}</dd>
              <dt>Created</dt><dd className="ts" title={instance.createdAt}>{relativeTime(instance.createdAt) || '—'}</dd>
            </dl>
          </section>

          {!tokenAvailable && (
            <SurfaceNotice
              kind="warning"
              label="Scope"
              title="Per-instance token unavailable"
              detail="This session cannot read this instance's token, so connect, pairing, and disconnect are disabled. Connect using the instance's own key to manage it."
            />
          )}

          {needsPairing && (
            <section aria-labelledby="pair-device-title">
              <div className="drawer-section-head"><div><span className="eyebrow">Pairing workflow</span><h3 id="pair-device-title">Pair device</h3></div></div>
              <div className="qrwell">
                {qr.data?.qrcode ? (
                  <>
                    <img src={qr.data.qrcode} alt="Scan this QR code with WhatsApp to pair the device" className="max-w-[220px]" />
                    <p>On the phone that owns this account: WhatsApp → Linked Devices → Link a Device, then scan. The code refreshes automatically.</p>
                  </>
                ) : qr.isError ? (
                  <InlineError error={qr.error} onRetry={qr.refetch} />
                ) : connected ? (
                  <>
                    <span className="eyebrow">Generating QR…</span>
                    <p>The connection is up; waiting for a pairing code.</p>
                  </>
                ) : (
                  <>
                    <span className="eyebrow">Not connected</span>
                    <p>Start a connection to generate a pairing QR code.</p>
                  </>
                )}
                <button className="btn primary" type="button" disabled={commandPending} onClick={() => (connected ? reconnect : connect).mutate(undefined, { onSuccess: (result) => commandFeedback(result, connected ? 'Restart pairing' : 'Connect') })}>
                  {commandPending ? 'Working…' : connected ? 'Restart pairing' : 'Connect'}
                </button>
                {(connect.error ?? reconnect.error) && <InlineError error={connect.error ?? reconnect.error} announce onRetry={() => (connected ? reconnect : connect).mutate()} />}
              </div>
            </section>
          )}

          {tokenAvailable && loggedIn && <AdvancedSettings instanceId={instance.id} token={instance.token} />}

          {tokenAvailable && loggedIn && (
            <section aria-labelledby="lifecycle-title">
              <span className="eyebrow">Instance controls</span>
              <h3 id="lifecycle-title">Lifecycle</h3>
              <div className="lifecycle-groups">
                <div className="action-group">
                  <span>Bounce the live connection for this instance.</span>
                  <div className="actions">
                    <button className="btn" type="button" disabled={commandPending} onClick={() => reconnect.mutate(undefined, { onSuccess: (result) => commandFeedback(result, 'Reconnect') })}>Reconnect</button>
                  </div>
                </div>
                {reconnect.error && <InlineError error={reconnect.error} announce onRetry={() => reconnect.mutate()} />}
              </div>
            </section>
          )}

          <section aria-labelledby="instance-danger-title">
            <span className="eyebrow">Danger zone</span>
            <h3 id="instance-danger-title">Destructive actions</h3>
            <div className="action-group destructive">
              <span>Disconnecting drops the live connection; logging out unpairs the device (re-scan a QR to use it again); destroying removes the instance entirely. All require typed confirmation.</span>
              <div className="actions">
                <button className="btn danger" type="button" disabled={!tokenAvailable} onClick={() => setConfirmation('disconnect')}>Disconnect…</button>
                <button className="btn danger" type="button" disabled={!tokenAvailable || !loggedIn} onClick={() => setConfirmation('logout')}>Log out…</button>
                <button className="btn danger" type="button" onClick={() => setConfirmation('destroy')}>Destroy…</button>
              </div>
            </div>
          </section>
      </DetailDrawer>

      {confirmation === 'disconnect' && (
        <TypedConfirmationDialog
          title="Disconnect instance"
          description={<p>This disconnects {instanceName} from WhatsApp. You can reconnect and re-pair afterwards.</p>}
          resourceId={instance.id}
          confirmValue={instance.id}
          confirmLabel="Disconnect instance"
          pendingLabel="Submitting…"
          error={disconnect.error}
          isPending={disconnect.isPending}
          onCancel={() => { disconnect.reset(); setConfirmation(undefined); }}
          onConfirm={() => disconnect.mutate(undefined, { onSuccess: (result) => { commandFeedback(result, 'Disconnect'); setConfirmation(undefined); } })}
        />
      )}
      {confirmation === 'logout' && (
        <TypedConfirmationDialog
          title="Log out instance"
          description={<p>This logs {instanceName} out of WhatsApp and unpairs the device. You will need to scan a new QR code to use it again.</p>}
          resourceId={instance.id}
          confirmValue={instance.id}
          confirmLabel="Log out instance"
          pendingLabel="Submitting…"
          error={logout.error}
          isPending={logout.isPending}
          onCancel={() => { logout.reset(); setConfirmation(undefined); }}
          onConfirm={() => logout.mutate(undefined, { onSuccess: (result) => { commandFeedback(result, 'Log out'); setConfirmation(undefined); } })}
        />
      )}
      {confirmation === 'destroy' && (
        <TypedConfirmationDialog
          title="Destroy instance"
          description={<p>This permanently destroys {instanceName} and its pairing state. This cannot be undone.</p>}
          resourceId={instance.id}
          confirmValue={instance.id}
          confirmLabel="Destroy instance"
          pendingLabel="Submitting…"
          error={destroy.error}
          isPending={destroy.isPending}
          onCancel={() => { destroy.reset(); setConfirmation(undefined); }}
          onConfirm={() => destroy.mutate(undefined, { onSuccess: onDestroyed })}
        />
      )}
    </>
  );
}

export function InstanceDrawerState({ instanceId, onClose, children, announce = false }: { instanceId: string; onClose: () => void; children: React.ReactNode; announce?: boolean }) {
  return <DetailDrawer titleId="instance-detail-title" eyebrow="Instance management" title="Instance details" subtitle={<DrawerIdentifier value={instanceId} label="Copy instance identifier" />} className="instances-drawer" closeLabel="Close instance details" onClose={onClose}><DetailDrawerState announce={announce}>{children}</DetailDrawerState></DetailDrawer>;
}
