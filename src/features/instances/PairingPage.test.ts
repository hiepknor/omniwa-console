import { describe, expect, it } from 'vitest';
import { activeInstanceQueryScope, instanceStatusPresentation, lifecycleConfirmationTarget, whatsappNameWhenLoggedIn } from './PairingPage';

describe('instance-scope WhatsApp identity', () => {
  it('shows and normalizes the reported WhatsApp name only after login', () => {
    expect(whatsappNameWhenLoggedIn(true, '  Nibi WhatsApp  ')).toBe('Nibi WhatsApp');
  });

  it.each([
    { loggedIn: false, name: 'Nibi WhatsApp', state: 'logged out' },
    { loggedIn: false, name: undefined, state: 'status not ready' },
    { loggedIn: true, name: undefined, state: 'name omitted' },
    { loggedIn: true, name: '   ', state: 'name empty after trimming' },
  ])('omits the identity row when $state', ({ loggedIn, name }) => {
    expect(whatsappNameWhenLoggedIn(loggedIn, name)).toBeUndefined();
  });
});

describe('instance-scope status presentation', () => {
  it('separates loading, failed, incomplete, stale, and ready status', () => {
    expect(instanceStatusPresentation({ statusPending: true, statusError: false, statusReady: false })).toEqual(expect.objectContaining({ label: 'Reading status', factFallback: 'Reading' }));
    expect(instanceStatusPresentation({ statusPending: false, statusError: true, statusReady: false })).toEqual(expect.objectContaining({ label: 'Status unavailable', factFallback: 'Unavailable' }));
    expect(instanceStatusPresentation({ statusPending: false, statusError: false, statusReady: false })).toEqual(expect.objectContaining({ label: 'Status incomplete', factFallback: 'Not reported' }));
    expect(instanceStatusPresentation({ connected: true, loggedIn: true, statusPending: false, statusError: true, statusReady: true })).toEqual(expect.objectContaining({ label: 'Paired · stale', tone: 'degraded' }));
    expect(instanceStatusPresentation({ connected: true, loggedIn: false, statusPending: false, statusError: false, statusReady: true })).toEqual(expect.objectContaining({ label: 'Pairing', tone: 'pending' }));
  });

  it('uses authenticated identity for confirmation and explicit legacy phrases otherwise', () => {
    expect(activeInstanceQueryScope('inst_01')).toBe('inst_01');
    expect(activeInstanceQueryScope(undefined)).toBe('session');
    expect(lifecycleConfirmationTarget('inst_01', 'disconnect')).toBe('inst_01');
    expect(lifecycleConfirmationTarget(undefined, 'disconnect')).toBe('DISCONNECT');
    expect(lifecycleConfirmationTarget(undefined, 'logout')).toBe('LOG OUT');
  });
});
