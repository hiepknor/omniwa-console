import { useCallback, useEffect } from 'react';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/api/keys';
import { Button, Image, Panel, StateNotice } from '@/ui';
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
  connected: boolean;
  loggedIn: boolean;
  qrcode?: string;
}): boolean {
  return connected && !loggedIn && Boolean(qrcode);
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
  const connected = status.data?.connected ?? false;
  const loggedIn = status.data?.loggedIn ?? false;
  const statusReady = status.data !== undefined;
  const commandPending = connect.isPending || reconnect.isPending;
  const pairing = Boolean(token && statusReady && !loggedIn);
  const qrEnabled = shouldPollPairingQr({ token: Boolean(token), statusReady, connected, loggedIn, commandPending });
  const qr = useInstanceQr(instanceId, token, qrEnabled);

  const clearQr = useCallback(() => clearPairingQrCache(queryClient, instanceId), [instanceId, queryClient]);

  useEffect(() => {
    if (!qrEnabled) clearQr();
  }, [clearQr, qrEnabled]);

  const startPairing = () => {
    if (!token || commandPending || loggedIn) return;
    connect.reset();
    reconnect.reset();
    clearQr();
    (connected ? reconnect : connect).mutate();
  };

  const reconnectSession = () => {
    if (!token || commandPending || !loggedIn) return;
    connect.reset();
    reconnect.reset();
    clearQr();
    reconnect.mutate();
  };

  return {
    commandError: connect.error ?? reconnect.error,
    commandPending,
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

function Acknowledgement({ action }: { action: string }) {
  return (
    <StateNotice
      kind="info"
      title={`${action} accepted`}
      detail="Refreshed status remains authoritative; acknowledgement does not prove final connectivity or pairing."
    />
  );
}

export function ConnectionAndPairing({ controller }: { controller: InstancePairingController }) {
  const showQr = shouldShowPairingQr({
    connected: controller.connected,
    loggedIn: controller.loggedIn,
    qrcode: controller.qr.data?.qrcode,
  });

  return (
    <Panel title="Connection & pairing" description="Connected and paired are different server facts.">
      <div className="grid gap-3">
        {controller.status.isPending ? <StateNotice kind="loading" title="Reading status" detail="Reading instance status." /> : controller.status.error ? <FailureNotice error={controller.status.error} stale={controller.status.data !== undefined} onRetry={() => controller.status.refetch()} /> : null}
        {controller.lastAcknowledgement ? <Acknowledgement action={controller.lastAcknowledgement} /> : null}
        {controller.commandError ? <FailureNotice error={controller.commandError} command /> : null}
        {controller.pairing ? (
          <div className="grid gap-2">
            {controller.qr.error && controller.connected ? (
              <FailureNotice error={controller.qr.error} onRetry={() => controller.qr.refetch()} />
            ) : showQr ? (
              <Image src={controller.qr.data?.qrcode} alt="QR code to pair this OmniWA instance" aspect="square" fit="contain" className="w-52 justify-self-start" imageClassName="bg-surface p-3" />
            ) : controller.connected ? (
              <StateNotice kind="loading" title="Waiting for QR" detail="Waiting for the rotating pairing QR." />
            ) : (
              <StateNotice kind="empty" title="No active QR" detail="Start a connection to generate a new pairing QR." />
            )}
            <p className="text-xs text-fg-3">WhatsApp → Linked Devices → Link a Device. Pairing is complete only when status reports loggedIn.</p>
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" disabled={controller.commandPending || controller.loggedIn} onClick={controller.startPairing}>{controller.connected ? 'Restart pairing' : 'Connect'}</Button>
          <Button disabled={controller.commandPending || !controller.loggedIn} onClick={controller.reconnectSession}>Reconnect</Button>
        </div>
      </div>
    </Panel>
  );
}
