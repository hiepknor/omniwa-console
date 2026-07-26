import { describe, expect, it } from 'vitest';
import { inspectConsentRows } from './consent';

describe('campaign consent rows', () => {
  it('normalizes explicit evidence without dropping fields', () => {
    expect(inspectConsentRows('8490@s.whatsapp.net | checkout | record-1 | 2026-07-22T08:00:00Z')).toEqual({
      rowCount: 1,
      issues: [],
      recipients: [{
        jid: '8490@s.whatsapp.net', optInSource: 'checkout', optInEvidenceReference: 'record-1', optedInAt: '2026-07-22T08:00:00.000Z',
      }],
    });
  });

  it('rejects missing or malformed evidence', () => {
    expect(inspectConsentRows('')).toEqual({ rowCount: 0, issues: [], recipients: [] });
    expect(inspectConsentRows('jid | source | evidence | not-a-date').issues[0]?.line).toBe(1);
  });

  it('reports every invalid source line while retaining valid preview rows', () => {
    expect(inspectConsentRows([
      'valid@s.whatsapp.net | checkout | record-1 | 2026-07-22T08:00:00Z',
      '',
      'missing-fields | checkout',
      'bad-time@s.whatsapp.net | crm | record-3 | yesterday-ish',
    ].join('\n'))).toEqual({
      rowCount: 3,
      recipients: [{
        jid: 'valid@s.whatsapp.net',
        optInSource: 'checkout',
        optInEvidenceReference: 'record-1',
        optedInAt: '2026-07-22T08:00:00.000Z',
      }],
      issues: [
        { line: 3, message: 'Recipient line 3 must contain exactly JID | source | evidence reference | ISO opt-in time.' },
        { line: 4, message: 'Recipient line 4 has an invalid ISO opt-in time.' },
      ],
    });
  });

  it('identifies missing values without collapsing them into a generic format error', () => {
    expect(inspectConsentRows('jid | | | 2026-07-22T08:00:00Z').issues).toEqual([
      { line: 1, message: 'Recipient line 1 is missing source, evidence reference.' },
    ]);
  });
});
