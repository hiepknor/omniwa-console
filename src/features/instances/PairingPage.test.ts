import { describe, expect, it } from 'vitest';
import { whatsappNameWhenLoggedIn } from './PairingPage';

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
