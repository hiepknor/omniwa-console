import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useApiSession } from '@/api/ApiProvider';
import { SESSION_QUERY_SCOPE } from '@/api/keys';
import { Button, DescriptionItem, DescriptionList, Dialog, Field, Input, PageHeader, Panel, StateNotice, Status, type Tone } from '@/ui';
import {
  ConnectionAndPairing,
  InstanceCommandAcknowledgement,
  type InstancePairingController,
  useInstancePairing,
} from './ConnectionAndPairing';
import { useDisconnectInstance, useLogoutInstance } from './hooks';
import { FailureNotice } from './ui';

type LifecycleAction = 'disconnect' | 'logout';
type LifecycleMutation = ReturnType<typeof useDisconnectInstance>;

export type InstanceLifecycleController = {
  disconnect: LifecycleMutation;
  logout: ReturnType<typeof useLogoutInstance>;
};

type ConsoleOutletContext = { onEndConsoleSession: () => void };

export function whatsappNameWhenLoggedIn(loggedIn: boolean | undefined, name: string | undefined): string | undefined {
  if (loggedIn !== true) return undefined;
  const normalized = name?.trim();
  return normalized || undefined;
}

export function instanceStatusPresentation({
  connected,
  loggedIn,
  statusError,
  statusPending,
  statusReady,
}: {
  connected?: boolean;
  loggedIn?: boolean;
  statusError: boolean;
  statusPending: boolean;
  statusReady: boolean;
}): { tone: Tone; label: string; factFallback: string } {
  if (statusPending) return { tone: 'pending', label: 'Reading status', factFallback: 'Reading' };
  if (!statusReady && statusError) return { tone: 'failed', label: 'Status unavailable', factFallback: 'Unavailable' };
  if (!statusReady) return { tone: 'degraded', label: 'Status incomplete', factFallback: 'Not reported' };

  const current = loggedIn === true
    ? { tone: 'ok' as const, label: 'Paired' }
    : connected === true
      ? { tone: 'pending' as const, label: 'Pairing' }
      : { tone: 'failed' as const, label: 'Disconnected' };
  return statusError
    ? { tone: 'degraded', label: `${current.label} · stale`, factFallback: 'Unavailable' }
    : { ...current, factFallback: 'Not reported' };
}

export function lifecycleConfirmationTarget(instanceId: string | undefined, action: LifecycleAction): string {
  return instanceId ?? (action === 'disconnect' ? 'DISCONNECT' : 'LOG OUT');
}

export function activeInstanceQueryScope(instanceId: string | undefined): string {
  return instanceId ?? SESSION_QUERY_SCOPE;
}

function ActiveInstanceLifecycle({
  instanceId,
  lifecycle,
  pairing,
}: {
  instanceId?: string;
  lifecycle: InstanceLifecycleController;
  pairing: InstancePairingController;
}) {
  const [confirm, setConfirm] = useState<LifecycleAction>();
  const [confirmText, setConfirmText] = useState('');
  const [lastAcknowledgement, setLastAcknowledgement] = useState<string>();
  const activeMutation = confirm === 'logout' ? lifecycle.logout : lifecycle.disconnect;
  const lifecyclePending = lifecycle.disconnect.isPending || lifecycle.logout.isPending;
  const confirmationTarget = confirm ? lifecycleConfirmationTarget(instanceId, confirm) : '';

  const closeConfirm = () => {
    if (lifecyclePending) return;
    setConfirm(undefined);
    setConfirmText('');
    lifecycle.disconnect.reset();
    lifecycle.logout.reset();
  };
  const openConfirm = (action: LifecycleAction) => {
    lifecycle.disconnect.reset();
    lifecycle.logout.reset();
    setLastAcknowledgement(undefined);
    setConfirmText('');
    setConfirm(action);
  };
  const submit = () => {
    if (!confirm || confirmText !== confirmationTarget || lifecyclePending) return;
    const onSuccess = () => {
      setLastAcknowledgement(confirm === 'disconnect' ? 'Disconnect' : 'Log out');
      setConfirm(undefined);
      setConfirmText('');
    };
    if (confirm === 'disconnect') lifecycle.disconnect.mutate(undefined, { onSuccess });
    else lifecycle.logout.mutate(undefined, { onSuccess });
  };

  return (
    <>
      <Panel title="Instance lifecycle" description="Disconnect drops the live connection; Log out WhatsApp unpairs this WhatsApp account.">
        <div className="grid gap-3">
          {lastAcknowledgement ? <InstanceCommandAcknowledgement action={lastAcknowledgement} /> : null}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="danger"
              disabled={!pairing.commandReady || pairing.commandPending || lifecyclePending || pairing.connected !== true}
              onClick={() => openConfirm('disconnect')}
            >
              Disconnect…
            </Button>
            <Button
              variant="danger"
              disabled={!pairing.commandReady || pairing.commandPending || lifecyclePending || pairing.loggedIn !== true}
              onClick={() => openConfirm('logout')}
            >
              Log out WhatsApp…
            </Button>
          </div>
        </div>
      </Panel>

      <Dialog
        open={Boolean(confirm)}
        onClose={closeConfirm}
        closeDisabled={lifecyclePending}
        title={confirm === 'logout' ? 'Log out WhatsApp account?' : 'Disconnect instance?'}
        footer={(
          <>
            <Button disabled={lifecyclePending} onClick={closeConfirm}>Cancel</Button>
            <Button variant="danger" disabled={confirmText !== confirmationTarget || lifecyclePending} aria-busy={lifecyclePending} onClick={submit}>
              Confirm command
            </Button>
          </>
        )}
      >
        <div className="grid gap-3">
          <p className="text-sm text-fg-2">
            {confirm === 'logout' ? 'This removes the current WhatsApp pairing.' : 'This drops the current live connection.'}
            {' '}Type the exact {instanceId ? 'instance ID' : 'confirmation phrase'} to continue. Server acknowledgement is not final refreshed state.
          </p>
          <Field label={instanceId ? 'Instance ID' : 'Confirmation phrase'}>
            {(id) => <Input id={id} value={confirmText} autoComplete="off" autoFocus disabled={lifecyclePending} onChange={(event) => setConfirmText(event.target.value)} />}
          </Field>
          {activeMutation.error ? <FailureNotice error={activeMutation.error} command /> : null}
        </div>
      </Dialog>
    </>
  );
}

export function PairingPageView({
  instanceId,
  lifecycle,
  onEndConsoleSession,
  pairing,
}: {
  instanceId?: string;
  lifecycle: InstanceLifecycleController;
  onEndConsoleSession: () => void;
  pairing: InstancePairingController;
}) {
  const status = instanceStatusPresentation({
    connected: pairing.connected,
    loggedIn: pairing.loggedIn,
    statusError: pairing.status.isError,
    statusPending: pairing.status.isPending,
    statusReady: pairing.statusReady,
  });
  const whatsappName = whatsappNameWhenLoggedIn(pairing.loggedIn, pairing.status.data?.name);
  const lifecyclePending = lifecycle.disconnect.isPending || lifecycle.logout.isPending;

  return (
    <div className="grid gap-6 p-6 max-sm:p-4">
      <PageHeader
        eyebrow="Runtime"
        title="Connection"
        description="Inspect the active runtime connection and manage WhatsApp pairing."
      />
      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div className="grid content-start gap-4">
          <Panel title="Active instance" description="Live token-scoped status; server facts remain authoritative.">
            <div className="grid gap-3">
              <Status tone={status.tone}>{status.label}</Status>
              <DescriptionList>
                <DescriptionItem label="Instance ID" mono>{instanceId ?? 'Not reported by this backend revision'}</DescriptionItem>
                <DescriptionItem label="Connection">{pairing.statusReady ? (pairing.connected === true ? 'Connected' : 'Disconnected') : status.factFallback}</DescriptionItem>
                <DescriptionItem label="Paired">{pairing.statusReady ? (pairing.loggedIn === true ? 'Yes' : 'No') : status.factFallback}</DescriptionItem>
                {whatsappName ? <DescriptionItem label="WhatsApp name">{whatsappName}</DescriptionItem> : null}
              </DescriptionList>
              <StateNotice kind="info" title="Memory-only credential" detail="Reload or end the Console session to clear this credential from memory." />
            </div>
          </Panel>
          <Panel title="Console session" description="This credential exists only in the current browser session.">
            <div className="grid gap-3">
              <p className="text-sm text-fg-2">
                End the Console session and return to Connect. WhatsApp remains connected and paired.
              </p>
              <Button className="justify-self-start" onClick={onEndConsoleSession}>End Console session</Button>
            </div>
          </Panel>
        </div>
        <div className="grid content-start gap-4">
          <ConnectionAndPairing controller={pairing} commandsDisabled={lifecyclePending} />
          <ActiveInstanceLifecycle instanceId={instanceId} lifecycle={lifecycle} pairing={pairing} />
        </div>
      </div>
    </div>
  );
}

export function PairingPage() {
  const session = useApiSession();
  const { onEndConsoleSession } = useOutletContext<ConsoleOutletContext>();
  const token = session.keyKind === 'api' ? session.apiKey : undefined;
  const queryScope = activeInstanceQueryScope(session.instanceId);
  const pairing = useInstancePairing(queryScope, token);
  const lifecycle = {
    disconnect: useDisconnectInstance(queryScope, token),
    logout: useLogoutInstance(queryScope, token),
  };

  if (!token) {
    return (
      <div className="grid gap-6 p-6 max-sm:p-4">
        <PageHeader eyebrow="Runtime" title="Connection" description="Inspect the active runtime connection and manage WhatsApp pairing." />
        <StateNotice kind="empty" title="Instance credential required" detail="Connection and pairing uses the active instance credential. No provider request was sent." />
      </div>
    );
  }

  return <PairingPageView instanceId={session.instanceId} pairing={pairing} lifecycle={lifecycle} onEndConsoleSession={onEndConsoleSession} />;
}
