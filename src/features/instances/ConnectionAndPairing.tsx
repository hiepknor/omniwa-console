import { useCallback, useEffect } from 'react';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/api/keys';
import { humanizeToken } from '@/lib/format';
import { Button, DescriptionItem, DescriptionList, Image, Panel, StateNotice, Status } from '@/ui';
import { useConnectInstance, useInstanceQr, useInstanceStatus, useReconnectInstance } from './hooks';
import { FailureNotice } from './ui';

export function clearPairingQrCache(queryClient: QueryClient, instanceId: string): void {
  queryClient.removeQueries({ queryKey: queryKeys.instanceQr(instanceId), exact: true });
}

export function shouldShowPairingQr({
  connected,
  loggedIn,
  qrcode,
}: {
  connected?: boolean;
  loggedIn?: boolean;
  qrcode?: string;
}): boolean {
  return connected === true && loggedIn === false && Boolean(qrcode);
}

export function shouldPollPairingQr({
  token,
  statusReady,
  connected,
  loggedIn,
  commandPending,
}: {
  token: boolean;
  statusReady: boolean;
  connected: boolean;
  loggedIn: boolean;
  commandPending: boolean;
}): boolean {
  return token && statusReady && connected && !loggedIn && !commandPending;
}

export function useInstancePairing(instanceId: string, token: string | undefined) {
  const queryClient = useQueryClient();
  const status = useInstanceStatus(instanceId, token);
  const connect = useConnectInstance(instanceId, token);
  const reconnect = useReconnectInstance(instanceId, token);
  const connected = status.data?.connected;
  const loggedIn = status.data?.loggedIn;
  const statusReady = typeof connected === 'boolean' && typeof loggedIn === 'boolean';
  const commandReady = statusReady && !status.isError;
  const commandPending = connect.isPending || reconnect.isPending;
  const pairing = Boolean(token && commandReady && loggedIn === false);
  const qrEnabled = shouldPollPairingQr({ token: Boolean(token), statusReady: commandReady, connected: connected === true, loggedIn: loggedIn === true, commandPending });
  const qr = useInstanceQr(instanceId, token, qrEnabled);

  const clearQr = useCallback(() => clearPairingQrCache(queryClient, instanceId), [instanceId, queryClient]);

  useEffect(() => {
    if (!qrEnabled) clearQr();
  }, [clearQr, qrEnabled]);

  const startPairing = () => {
    if (!token || !commandReady || commandPending || loggedIn !== false) return;
    connect.reset();
    reconnect.reset();
    clearQr();
    (connected === true ? reconnect : connect).mutate();
  };

  const reconnectSession = () => {
    if (!token || !commandReady || commandPending || loggedIn !== true) return;
    connect.reset();
    reconnect.reset();
    clearQr();
    reconnect.mutate();
  };

  return {
    commandError: connect.error ?? reconnect.error,
    commandPending,
    commandReady,
    connected,
    lastAcknowledgement: connect.data ? 'Connect' : reconnect.data ? 'Reconnect' : undefined,
    loggedIn,
    pairing,
    qr,
    reconnectSession,
    startPairing,
    status,
    statusReady,
  };
}

export type InstancePairingController = ReturnType<typeof useInstancePairing>;

export function InstanceCommandAcknowledgement({ action }: { action: string }) {
  return (
    <StateNotice
      kind="info"
      title={`${action} accepted`}
      detail="Refreshed status remains authoritative; acknowledgement does not prove final connectivity or pairing."
    />
  );
}

export function ConnectionAndPairing({
  controller,
  commandsDisabled = false,
}: {
  controller: InstancePairingController;
  commandsDisabled?: boolean;
}) {
  const showQr = shouldShowPairingQr({
    connected: controller.connected,
    loggedIn: controller.loggedIn,
    qrcode: controller.qr.error ? undefined : controller.qr.data?.qrcode,
  });
  const passkey = !controller.qr.error && controller.connected === true && controller.loggedIn === false
    ? controller.qr.data
    : undefined;
  const showPasskey = Boolean(passkey?.passkeyCode || passkey?.passkeyOpenUrl);
  const openPasskey = () => {
    if (passkey?.passkeyOpenUrl) window.open(passkey.passkeyOpenUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Panel title="Connection & pairing" description="Connected and paired are different server facts.">
      <div className="grid gap-3">
        {controller.status.isPending ? <StateNotice kind="loading" title="Reading status" detail="Reading instance status." /> : controller.status.error ? <FailureNotice error={controller.status.error} stale={controller.status.data !== undefined} onRetry={() => controller.status.refetch()} /> : !controller.statusReady ? <StateNotice kind="error" title="Status snapshot incomplete" detail="Connected and LoggedIn were not both reported. Lifecycle commands remain disabled." /> : null}
        {controller.lastAcknowledgement ? <InstanceCommandAcknowledgement action={controller.lastAcknowledgement} /> : null}
        {controller.commandError ? <FailureNotice error={controller.commandError} command /> : null}
        {controller.pairing ? (
          <div className="grid gap-2">
            {controller.qr.error && controller.connected === true ? (
              <FailureNotice error={controller.qr.error} onRetry={() => controller.qr.refetch()} />
            ) : showQr ? (
              <Image src={controller.qr.data?.qrcode} alt="QR code to pair this OmniWA instance" aspect="square" fit="contain" className="w-52 justify-self-start" imageClassName="bg-surface p-3" />
            ) : controller.connected === true && !showPasskey ? (
              <StateNotice kind="loading" title="Waiting for QR" detail="Waiting for the rotating pairing QR." />
            ) : !showPasskey ? (
              <StateNotice kind="empty" title="No active QR" detail="Start a connection to generate a new pairing QR." />
            ) : null}
            {showPasskey ? (
              <div className="grid gap-2 border border-line-strong bg-surface p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong className="text-sm font-semibold text-fg">Pair with a code</strong>
                  {passkey?.passkeyStage ? <Status tone="neutral" wrap>{humanizeToken(passkey.passkeyStage)}</Status> : null}
                </div>
                {passkey?.passkeyCode ? (
                  <DescriptionList>
                    <DescriptionItem label="Pairing code" mono>{passkey.passkeyCode}</DescriptionItem>
                  </DescriptionList>
                ) : null}
                {passkey?.passkeyOpenUrl ? <Button onClick={openPasskey}>Open secure pairing link (new tab)</Button> : null}
                <p className="text-xs text-fg-3">Use only the WhatsApp pairing flow opened from this active instance session.</p>
              </div>
            ) : null}
            {!controller.qr.error ? <p className="text-xs text-fg-3">{showQr ? 'WhatsApp → Linked Devices → Link a Device.' : 'Follow the displayed WhatsApp pairing method.'} Pairing is complete only when status reports loggedIn.</p> : null}
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" disabled={commandsDisabled || !controller.commandReady || controller.commandPending || controller.loggedIn !== false} onClick={controller.startPairing}>{controller.connected === true ? 'Restart pairing' : 'Connect'}</Button>
          <Button disabled={commandsDisabled || !controller.commandReady || controller.commandPending || controller.loggedIn !== true} onClick={controller.reconnectSession}>Reconnect</Button>
        </div>
      </div>
    </Panel>
  );
}
