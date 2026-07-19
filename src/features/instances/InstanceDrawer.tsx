import { useEffect, useRef, useState } from 'react';
import type { CommandResult } from '@/api/envelopes';
import type { InstanceResource } from '@/api/instances';
import { InlineError } from '@/components/InlineError';
import { TypedConfirmationDialog } from '@/components/TypedConfirmationDialog';
import { useFeedback } from '@/components/feedback/FeedbackProvider';
import { useDrawerFocus } from '@/components/useDrawerFocus';
import { relativeTime } from '@/lib/format';
import { useResilientReadState } from '@/lib/query-state';
import {
  useConnectInstance,
  useDestroyInstance,
  useDisconnectInstance,
  useInstanceSessions,
  useProviderCapabilities,
  useReconnectInstance,
  useRefreshInstanceQr,
  useRefreshProviderCapabilities,
  useUpdateInstance,
} from './hooks';

function statusDot(status: string | undefined) {
  switch (status?.toLowerCase()) {
    case 'connected': return 'dot-ok';
    case 'pairing':
    case 'connecting': return 'dot-pending';
    case 'failed':
    case 'disconnected': return 'dot-failed';
    default: return 'dot-info';
  }
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
  const instanceName = instance.displayName ?? instance.id;
  const [displayName, setDisplayName] = useState(instanceName);
  const [confirmation, setConfirmation] = useState<'disconnect' | 'destroy'>();
  const closeRef = useRef<HTMLButtonElement>(null);
  const feedback = useFeedback();
  const sessions = useInstanceSessions(instance.id);
  const provider = useProviderCapabilities(true);
  const sessionsReadState = useResilientReadState(sessions, sessions.data?.resource !== undefined);
  const providerReadState = useResilientReadState(provider, provider.data?.resource !== undefined);
  const update = useUpdateInstance(instance.id);
  const connect = useConnectInstance(instance.id);
  const disconnect = useDisconnectInstance(instance.id);
  const destroy = useDestroyInstance(instance.id);
  const reconnect = useReconnectInstance(instance.id);
  const refreshQr = useRefreshInstanceQr(instance.id);
  const refreshCapabilities = useRefreshProviderCapabilities();
  const sessionItems = [...(sessions.data?.resource?.items ?? [])].sort((left, right) => (
    left.id === instance.activeSessionId ? -1 : right.id === instance.activeSessionId ? 1 : 0
  ));
  const capabilities = provider.data?.resource?.capabilities
    ?? (provider.data?.resource?.capability ? [provider.data.resource.capability] : []);

  useEffect(() => setDisplayName(instanceName), [instanceName]);
  useDrawerFocus({ onClose, closeRef, suppressEscape: confirmation !== undefined });

  const commandFeedback = (result: CommandResult, action: string) => {
    feedback.command(result.disposition, {
      action,
      acceptedDetail: 'The platform accepted the command. Status refreshes automatically.',
      completedDetail: 'The platform completed the command. Status refreshes automatically.',
      requestId: result.requestId,
      dedupeKey: `instance:${instance.id}:${action.toLowerCase().replaceAll(' ', '-')}`,
    });
  };
  const commandError = update.error ?? connect.error ?? reconnect.error ?? refreshQr.error ?? refreshCapabilities.error;
  const commandPending = update.isPending || connect.isPending || reconnect.isPending || refreshQr.isPending || refreshCapabilities.isPending;

  return (
    <>
      <aside className="drawer instances-drawer" aria-labelledby="instance-detail-title">
        <header className="drawer-head">
          <div className="drawer-identity">
            <span className="eyebrow">Instance management</span>
            <div className="drawer-title-row">
              <h2 id="instance-detail-title">{instanceName}</h2>
              <span className="status"><span className={`dot ${statusDot(instance.status)}`}></span>{instance.status ?? '—'}</span>
            </div>
            <span className="mono">{instance.id}</span>
          </div>
          <button ref={closeRef} className="close" type="button" aria-label="Close instance details" title="Close" onClick={onClose}>✕</button>
        </header>

        <div className="drawer-scroll">
          {commandError && (
            <InlineError
              error={commandError}
              announce
              onRetry={() => {
                if (update.error) update.mutate(displayName.trim());
                else if (connect.error) connect.mutate();
                else if (reconnect.error) reconnect.mutate();
                else if (refreshQr.error) refreshQr.mutate();
                else refreshCapabilities.mutate();
              }}
            />
          )}

          <section aria-labelledby="instance-facts-title">
            <h3 id="instance-facts-title" className="visually-hidden">Instance facts</h3>
            <dl className="kv">
              <dt>Status</dt><dd><span className="status"><span className={`dot ${statusDot(instance.status)}`}></span>{instance.status ?? '—'}</span></dd>
              <dt>Provider</dt><dd>{provider.data?.resource?.providerName ?? '—'}</dd>
              <dt>Created</dt><dd className="ts" title={instance.createdAt}>{relativeTime(instance.createdAt) || '—'}</dd>
              <dt>Updated</dt><dd className="ts" title={instance.updatedAt}>{relativeTime(instance.updatedAt) || '—'}</dd>
            </dl>
          </section>

          <section aria-labelledby="instance-name-title">
            <span className="eyebrow">Instance metadata</span>
            <h3 id="instance-name-title">Display name</h3>
            <form onSubmit={(event) => {
              event.preventDefault();
              update.mutate(displayName.trim(), { onSuccess: (result) => commandFeedback(result, 'Update') });
            }}>
              <div className="field">
                <label htmlFor="instance-display-name">Name</label>
                <input id="instance-display-name" className="input" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
              </div>
              <button className="btn" type="submit" disabled={!displayName.trim() || displayName.trim() === instanceName || commandPending}>Update name</button>
            </form>
          </section>

          {(instance.status === 'pairing' || instance.status === 'connecting') && (
            <section aria-labelledby="pair-device-title">
              <div className="drawer-section-head"><div><span className="eyebrow">Pairing workflow</span><h3 id="pair-device-title">Pair device</h3></div></div>
              <div className="qrwell">
                <span className="eyebrow">QR unavailable</span>
                <p>The public API accepts QR refresh requests but does not expose QR material.</p>
                <button className="btn" type="button" disabled={commandPending} onClick={() => refreshQr.mutate(undefined, { onSuccess: (result) => commandFeedback(result, 'QR refresh') })}>
                  {refreshQr.isPending ? 'Requesting…' : 'Request new QR'}
                </button>
                <div className="steps" aria-label="Pairing progress">
                  <span className="on"><b>1</b> waiting</span><span><b>2</b> scanned</span><span><b>3</b> paired</span>
                </div>
              </div>
            </section>
          )}

          <section aria-labelledby="lifecycle-title">
            <span className="eyebrow">Instance controls</span>
            <h3 id="lifecycle-title">Lifecycle</h3>
            <div className="lifecycle-groups">
              <div className="action-group">
                <span>Connection commands may complete immediately or continue asynchronously.</span>
                <div className="actions">
                  {instance.status !== 'connected' && (
                    <button className="btn" type="button" disabled={commandPending} onClick={() => connect.mutate(undefined, { onSuccess: (result) => commandFeedback(result, 'Connect') })}>Connect</button>
                  )}
                  <button className="btn" type="button" disabled={commandPending} onClick={() => reconnect.mutate(undefined, { onSuccess: () => feedback.accepted({ title: 'Reconnect accepted', detail: 'Connection state refreshes automatically.', dedupeKey: `instance:${instance.id}:reconnect` }) })}>Reconnect</button>
                </div>
              </div>
              <div className="action-group destructive">
                <span>Destructive actions require confirmation.</span>
                <div className="actions">
                  <button className="btn danger" type="button" onClick={() => setConfirmation('disconnect')}>Disconnect</button>
                  <button className="btn danger" type="button" onClick={() => setConfirmation('destroy')}>Destroy…</button>
                </div>
              </div>
            </div>
          </section>

          <section aria-labelledby="sessions-title">
            <span className="eyebrow">Current and recent</span>
            <h3 id="sessions-title">Sessions</h3>
            {sessionsReadState.isInitialError ? (
              <InlineError error={sessionsReadState.error} onRetry={sessions.refetch} />
            ) : sessionsReadState.isInitialLoading ? (
              <div className="empty">—</div>
            ) : sessions.data?.unavailable ? (
              <div className="empty">No session data yet.</div>
            ) : (sessions.data?.resource?.items.length ?? 0) === 0 ? (
              <div className="empty">No sessions recorded.</div>
            ) : (
              <table className="minitable responsive-minitable">
                <thead><tr><th scope="col">Session</th><th scope="col">State</th><th scope="col">Updated</th></tr></thead>
                <tbody>{sessionItems.map((session) => (
                  <tr key={session.id}>
                    <td data-label="Session"><span className="mono">{session.id}</span>{session.id === instance.activeSessionId && <span className="pill ml-2">Active</span>}</td>
                    <td data-label="State"><span className="status sm"><span className={`dot ${statusDot(session.status)}`}></span>{session.status ?? '—'}</span></td>
                    <td data-label="Updated" className="ts" title={session.updatedAt}>{relativeTime(session.updatedAt) || '—'}</td>
                  </tr>
                ))}</tbody>
              </table>
            )}
            {sessionsReadState.isStaleError && <InlineError error={sessionsReadState.error} onRetry={sessions.refetch} />}
          </section>

          <section aria-labelledby="capabilities-title">
            <div className="drawer-section-head">
              <div><span className="eyebrow">Provider surface</span><h3 id="capabilities-title">Provider capabilities</h3></div>
              <button className="btn sm" type="button" disabled={commandPending} onClick={() => refreshCapabilities.mutate(undefined, { onSuccess: () => feedback.accepted({ title: 'Capability refresh accepted', detail: 'Provider data refreshes automatically.', dedupeKey: `instance:${instance.id}:capability-refresh` }) })}>Refresh</button>
            </div>
            {providerReadState.isInitialError ? (
              <InlineError error={providerReadState.error} onRetry={provider.refetch} />
            ) : providerReadState.isInitialLoading ? (
              <div className="empty">—</div>
            ) : provider.data?.unavailable ? (
              <div className="empty">No capability data yet.</div>
            ) : capabilities.length > 0 ? (
              <div className="capchips">{capabilities.map((capability) => <span className="chip" key={capability}>{capability}</span>)}</div>
            ) : (
              <div className="empty">No capabilities reported.</div>
            )}
            {providerReadState.isStaleError && <InlineError error={providerReadState.error} onRetry={provider.refetch} />}
          </section>
        </div>
      </aside>

      {confirmation === 'disconnect' && (
        <TypedConfirmationDialog
          title="Disconnect instance"
          description={<p>This requests a disconnect for {instanceName}. The platform may complete the command immediately or continue processing it asynchronously.</p>}
          resourceId={instance.id}
          confirmValue={instanceName}
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
          description={<p>This permanently destroys {instanceName}, its sessions, and pairing state. This cannot be undone.</p>}
          resourceId={instance.id}
          confirmValue={instanceName}
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
