import { describe, expect, it } from 'vitest';
import { parseConsentRows } from './consent';

describe('campaign consent rows', () => {
  it('normalizes explicit evidence without dropping fields', () => {
    expect(parseConsentRows('8490@s.whatsapp.net | checkout | record-1 | 2026-07-22T08:00:00Z')).toEqual([{
      jid: '8490@s.whatsapp.net', optInSource: 'checkout', optInEvidenceReference: 'record-1', optedInAt: '2026-07-22T08:00:00.000Z',
    }]);
  });

  it('rejects missing or malformed evidence', () => {
    expect(() => parseConsentRows('')).toThrow('At least one');
    expect(() => parseConsentRows('jid | source | evidence | not-a-date')).toThrow('line 1');
  });
});
