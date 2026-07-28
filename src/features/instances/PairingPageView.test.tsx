import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { InstancePairingController } from './ConnectionAndPairing';
import { PairingPageView, type InstanceLifecycleController } from './PairingPage';

function lifecycle(pending = false): InstanceLifecycleController {
  const idle = { error: null, isPending: false, mutate: vi.fn(), reset: vi.fn() };
  const disconnect = { ...idle, isPending: pending };
  return { disconnect, logout: idle } as unknown as InstanceLifecycleController;
}

function pairing(overrides: Partial<InstancePairingController> = {}): InstancePairingController {
  return {
    commandError: null,
    commandPending: false,
    commandReady: true,
    connected: true,
    lastAcknowledgement: undefined,
    loggedIn: true,
    pairing: false,
    qr: { data: undefined, error: null, refetch: vi.fn() },
    reconnectSession: vi.fn(),
    startPairing: vi.fn(),
    status: { data: { connected: true, loggedIn: true }, error: null, isError: false, isPending: false, refetch: vi.fn() },
    statusReady: true,
    ...overrides,
  } as unknown as InstancePairingController;
}

describe('instance-scope page view', () => {
  it('renders backend-authenticated identity and the complete lifecycle surface', () => {
    const html = renderToStaticMarkup(<PairingPageView instanceId="inst_01" pairing={pairing()} lifecycle={lifecycle()} onEndConsoleSession={vi.fn()} />);
    expect(html).toContain('Instance ID');
    expect(html).toContain('inst_01');
    expect(html).toContain('Disconnect…');
    expect(html).toContain('Log out WhatsApp…');
    expect(html).toContain('End Console session');
  });

  it('marks legacy identity as unreported instead of inferring it', () => {
    const html = renderToStaticMarkup(<PairingPageView pairing={pairing()} lifecycle={lifecycle()} onEndConsoleSession={vi.fn()} />);
    expect(html).toContain('Not reported by this backend revision');
  });

  it('renders initial status failure coherently and keeps lifecycle commands disabled', () => {
    const statusError = new Error('status unavailable');
    const html = renderToStaticMarkup(<PairingPageView
      instanceId="inst_01"
      lifecycle={lifecycle()}
      onEndConsoleSession={vi.fn()}
      pairing={pairing({
        commandReady: false,
        connected: undefined,
        loggedIn: undefined,
        status: { data: undefined, error: statusError, isError: true, isPending: false, refetch: vi.fn() } as never,
        statusReady: false,
      })}
    />);
    expect(html).toContain('Status unavailable');
    expect(html).toContain('Read failed');
    expect(html).not.toContain('Reading status');
    expect(html.match(/<button[^>]*\sdisabled=""/g)?.length).toBeGreaterThanOrEqual(4);
  });

  it('locks connect, reconnect, disconnect, and logout while a lifecycle command is pending', () => {
    const html = renderToStaticMarkup(<PairingPageView instanceId="inst_01" pairing={pairing()} lifecycle={lifecycle(true)} onEndConsoleSession={vi.fn()} />);
    expect(html.match(/<button[^>]*\sdisabled=""/g)).toHaveLength(4);
  });
});
