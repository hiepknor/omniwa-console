import { useState } from 'react';
import type { CommandResult } from '@/api/envelopes';
import type { InstanceResource } from '@/api/instances';
import { StatusIndicator } from '@/components/badges';
import { InlineError } from '@/components/InlineError';
import { SurfaceNotice } from '@/components/feedback/SurfaceNotice';
import { TypedConfirmationDialog } from '@/components/TypedConfirmationDialog';
import { DetailDrawer, DetailDrawerState, DrawerIdentifier } from '@/components/drawer/DetailDrawer';
import { useFeedback } from '@/components/feedback/FeedbackProvider';
import { relativeTime } from '@/lib/format';
import {
  useConnectInstance,
  useDestroyInstance,
  useDisconnectInstance,
  useInstanceQr,
  useInstanceStatus,
  useReconnectInstance,
} from './hooks';

function statusDot(connected: boolean) {
  return connected ? 'dot-ok' : 'dot-failed';
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
  const [confirmation, setConfirmation] = useState<'disconnect' | 'destroy'>();
  const feedback = useFeedback();
  const tokenAvailable = Boolean(instance.token);

  const status = useInstanceStatus(instance.id, instance.token);
  const connected = status.data?.connected ?? instance.connected;
  const loggedIn = status.data?.loggedIn ?? false;

  const qr = useInstanceQr(instance.id, instance.token, tokenAvailable && !connected);
  const connect = useConnectInstance(instance.id, instance.token);
  const reconnect = useReconnectInstance(instance.id, instance.token);
  const disconnect = useDisconnectInstance(instance.id, instance.token);
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
      <DetailDrawer titleId="instance-detail-title" eyebrow="Instance management" title={instanceName} status={<StatusIndicator dotClass={statusDot(connected)}>{connected ? 'connected' : 'disconnected'}</StatusIndicator>} subtitle={<DrawerIdentifier value={instance.id} label="Copy instance identifier" />} className="instances-drawer" closeLabel="Close instance details" suppressEscape={confirmation !== undefined} onClose={onClose}>
          <section aria-labelledby="instance-facts-title">
            <h3 id="instance-facts-title" className="visually-hidden">Instance facts</h3>
            <dl className="kv">
              <dt>Connection</dt><dd><StatusIndicator size="small" dotClass={statusDot(connected)}>{connected ? 'connected' : 'disconnected'}</StatusIndicator></dd>
              <dt>Logged in</dt><dd>{loggedIn ? 'yes' : 'no'}</dd>
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

          {tokenAvailable && !connected && (
            <section aria-labelledby="pair-device-title">
              <div className="drawer-section-head"><div><span className="eyebrow">Pairing workflow</span><h3 id="pair-device-title">Pair device</h3></div></div>
              <div className="qrwell">
                {qr.data?.qrcode ? (
                  <>
                    <img src={qr.data.qrcode} alt="Scan this QR code with WhatsApp to pair the device" className="max-w-[220px]" />
                    <p>Scan with WhatsApp on the phone that owns this account. The code refreshes automatically.</p>
                  </>
                ) : qr.isError ? (
                  <InlineError error={qr.error} onRetry={qr.refetch} />
                ) : (
                  <>
                    <span className="eyebrow">QR not ready</span>
                    <p>Start a connection to generate a pairing QR code.</p>
                  </>
                )}
                <button className="btn primary" type="button" disabled={commandPending} onClick={() => connect.mutate(undefined, { onSuccess: (result) => commandFeedback(result, 'Connect') })}>
                  {connect.isPending ? 'Connecting…' : 'Connect'}
                </button>
                {connect.error && <InlineError error={connect.error} announce onRetry={() => connect.mutate()} />}
              </div>
            </section>
          )}

          <section aria-labelledby="lifecycle-title">
            <span className="eyebrow">Instance controls</span>
            <h3 id="lifecycle-title">Lifecycle</h3>
            <div className="lifecycle-groups">
              <div className="action-group">
                <span>Manage the live connection for this instance.</span>
                <div className="actions">
                  {connected ? (
                    <button className="btn" type="button" disabled={!tokenAvailable || commandPending} onClick={() => reconnect.mutate(undefined, { onSuccess: (result) => commandFeedback(result, 'Reconnect') })}>Reconnect</button>
                  ) : (
                    <button className="btn" type="button" disabled={!tokenAvailable || commandPending} onClick={() => connect.mutate(undefined, { onSuccess: (result) => commandFeedback(result, 'Connect') })}>Connect</button>
                  )}
                </div>
              </div>
              {reconnect.error && <InlineError error={reconnect.error} announce onRetry={() => reconnect.mutate()} />}
            </div>
          </section>

          <section aria-labelledby="instance-danger-title">
            <span className="eyebrow">Danger zone</span>
            <h3 id="instance-danger-title">Destructive actions</h3>
            <div className="action-group destructive">
              <span>Disconnecting logs the device out; destroying removes the instance entirely. Both require typed confirmation.</span>
              <div className="actions">
                <button className="btn danger" type="button" disabled={!tokenAvailable} onClick={() => setConfirmation('disconnect')}>Disconnect</button>
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
