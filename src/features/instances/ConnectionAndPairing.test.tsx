import { QueryClient } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { queryKeys } from '@/api/keys';
import {
  clearPairingQrCache,
  ConnectionAndPairing,
  shouldPollPairingQr,
  shouldShowPairingQr,
  type InstancePairingController,
} from './ConnectionAndPairing';

describe('connection and pairing state', () => {
  it('never presents a cached QR while disconnected or already paired', () => {
    expect(shouldShowPairingQr({ connected: false, loggedIn: false, qrcode: 'stale-qr' })).toBe(false);
    expect(shouldShowPairingQr({ connected: true, loggedIn: true, qrcode: 'stale-qr' })).toBe(false);
    expect(shouldShowPairingQr({ connected: true, loggedIn: false, qrcode: 'current-qr' })).toBe(true);
  });

  it('polls only during an idle connected unpaired session', () => {
    const ready = { token: true, statusReady: true, connected: true, loggedIn: false, commandPending: false };
    expect(shouldPollPairingQr(ready)).toBe(true);
    expect(shouldPollPairingQr({ ...ready, connected: false })).toBe(false);
    expect(shouldPollPairingQr({ ...ready, loggedIn: true })).toBe(false);
    expect(shouldPollPairingQr({ ...ready, commandPending: true })).toBe(false);
    expect(shouldPollPairingQr({ ...ready, token: false })).toBe(false);
    expect(shouldPollPairingQr({ ...ready, statusReady: false })).toBe(false);
  });

  it('removes only the selected instance QR cache', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(queryKeys.instanceQr('selected'), { qrcode: 'stale' });
    queryClient.setQueryData(queryKeys.instanceStatus('selected'), { connected: false });
    queryClient.setQueryData(queryKeys.instanceQr('other'), { qrcode: 'keep' });

    clearPairingQrCache(queryClient, 'selected');

    expect(queryClient.getQueryData(queryKeys.instanceQr('selected'))).toBeUndefined();
    expect(queryClient.getQueryData(queryKeys.instanceStatus('selected'))).toEqual({ connected: false });
    expect(queryClient.getQueryData(queryKeys.instanceQr('other'))).toEqual({ qrcode: 'keep' });
  });

  it('renders an inactive state instead of stale QR data after disconnect', () => {
    const controller = {
      commandError: null,
      commandPending: false,
      commandReady: true,
      connected: false,
      lastAcknowledgement: undefined,
      loggedIn: false,
      pairing: true,
      qr: { data: { qrcode: 'data:image/png;base64,stale' }, error: null, refetch: vi.fn() },
      reconnectSession: vi.fn(),
      startPairing: vi.fn(),
      status: { data: { connected: false, loggedIn: false }, error: null, isPending: false, refetch: vi.fn() },
      statusReady: true,
    } as unknown as InstancePairingController;

    const html = renderToStaticMarkup(<ConnectionAndPairing controller={controller} />);
    expect(html).toContain('No active QR');
    expect(html).not.toContain('data:image/png;base64,stale');
  });

  it('fails closed when live status is incomplete', () => {
    const controller = {
      commandError: null,
      commandPending: false,
      commandReady: false,
      connected: undefined,
      lastAcknowledgement: undefined,
      loggedIn: undefined,
      pairing: false,
      qr: { data: undefined, error: null, refetch: vi.fn() },
      reconnectSession: vi.fn(),
      startPairing: vi.fn(),
      status: { data: {}, error: null, isPending: false, refetch: vi.fn() },
      statusReady: false,
    } as unknown as InstancePairingController;

    const html = renderToStaticMarkup(<ConnectionAndPairing controller={controller} />);
    expect(html.match(/<button[^>]*disabled/g)).toHaveLength(2);
    expect(html).not.toContain('QR code to pair');
  });
});
