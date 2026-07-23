import { describe, expect, it } from 'vitest';
import { instanceLifecyclePresentation } from './InstanceDrawer';

describe('instance lifecycle presentation', () => {
  it('labels credential-free connection state as metadata without inferring pairing', () => {
    expect(instanceLifecyclePresentation({ tokenAvailable: false, metadataConnected: true, status: { connected: true, loggedIn: true } })).toEqual(expect.objectContaining({
      label: 'connected · metadata',
      paired: 'not verified',
      verified: false,
    }));
  });

  it('keeps token-scoped loading and errors explicit', () => {
    expect(instanceLifecyclePresentation({ tokenAvailable: true, metadataConnected: false, statusPending: true })).toEqual(expect.objectContaining({ label: 'checking status', paired: 'checking' }));
    expect(instanceLifecyclePresentation({ tokenAvailable: true, metadataConnected: true, statusError: true })).toEqual(expect.objectContaining({ label: 'status unavailable', paired: 'not verified' }));
  });

  it('distinguishes paired-but-disconnected from a live connection', () => {
    expect(instanceLifecyclePresentation({ tokenAvailable: true, metadataConnected: true, status: { connected: false, loggedIn: true } })).toEqual({
      dot: 'dot-degraded',
      label: 'paired · disconnected',
      websocket: 'disconnected',
      paired: 'yes',
      verified: true,
    });
  });

  it('reports pairing and connected only from verified status', () => {
    expect(instanceLifecyclePresentation({ tokenAvailable: true, metadataConnected: false, status: { connected: true, loggedIn: false } }).label).toBe('pairing');
    expect(instanceLifecyclePresentation({ tokenAvailable: true, metadataConnected: false, status: { connected: true, loggedIn: true } }).label).toBe('connected');
  });
});
