import type { CampaignRecipientConsent } from '@/api/campaigns';

export function parseConsentRows(value: string): CampaignRecipientConsent[] {
  const rows = value.split('\n').map((line) => line.trim()).filter(Boolean);
  if (!rows.length) throw new Error('At least one consent-backed recipient is required.');
  return rows.map((line, index) => {
    const [jid, optInSource, optInEvidenceReference, optedInAt, ...extra] = line.split('|').map((part) => part.trim());
    if (extra.length || !jid || !optInSource || !optInEvidenceReference || !optedInAt || Number.isNaN(Date.parse(optedInAt))) {
      throw new Error(`Recipient line ${index + 1} must contain JID | source | evidence reference | ISO opt-in time.`);
    }
    return { jid, optInSource, optInEvidenceReference, optedInAt: new Date(optedInAt).toISOString() };
  });
}
