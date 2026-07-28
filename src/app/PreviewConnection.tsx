import { PairingPageView, type InstanceLifecycleController } from '@/features/instances/PairingPage';
import type { InstancePairingController } from '@/features/instances/ConnectionAndPairing';

/** Dev-only: instance-scoped identity, pairing payload, and lifecycle actions. */
export function PreviewConnection() {
  const pairing = {
    commandError: null,
    commandPending: false,
    commandReady: true,
    connected: true,
    lastAcknowledgement: undefined,
    loggedIn: false,
    pairing: true,
    qr: {
      data: {
        qrcode: '/favicon.svg',
        passkeyCode: 'ABCD-EFGH',
        passkeyStage: 'code_ready',
      },
      error: null,
      refetch: async () => undefined,
    },
    reconnectSession: () => undefined,
    startPairing: () => undefined,
    status: {
      data: { connected: true, loggedIn: false },
      error: null,
      isError: false,
      isPending: false,
      refetch: async () => undefined,
    },
    statusReady: true,
  } as unknown as InstancePairingController;
  const mutation = { error: null, isPending: false, mutate: () => undefined, reset: () => undefined };
  const lifecycle = { disconnect: mutation, logout: mutation } as unknown as InstanceLifecycleController;

  return (
    <main className="min-h-dvh bg-bg">
      <PairingPageView instanceId="inst_preview_01" pairing={pairing} lifecycle={lifecycle} onEndConsoleSession={() => undefined} />
    </main>
  );
}
