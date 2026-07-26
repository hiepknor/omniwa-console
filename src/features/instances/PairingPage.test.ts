import { describe, expect, it } from 'vitest';
import { whatsappNameWhenLoggedIn } from './PairingPage';

describe('instance-scope WhatsApp identity', () => {
  it('shows the reported WhatsApp name only after login', () => {
    expect(whatsappNameWhenLoggedIn(true, '  Nibi WhatsApp  ')).toBe('Nibi WhatsApp');
    expect(whatsappNameWhenLoggedIn(false, 'Nibi WhatsApp')).toBeUndefined();
  });

  it('does not invent an identity when the provider reports no name', () => {
    expect(whatsappNameWhenLoggedIn(true, undefined)).toBeUndefined();
    expect(whatsappNameWhenLoggedIn(true, '   ')).toBeUndefined();
  });
});
