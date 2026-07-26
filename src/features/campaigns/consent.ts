import type { CampaignRecipientConsent } from '@/api/campaigns';

export type ConsentRowIssue = { line: number; message: string };
export type ConsentInspection = {
  issues: ConsentRowIssue[];
  recipients: CampaignRecipientConsent[];
  rowCount: number;
};

export function inspectConsentRows(value: string): ConsentInspection {
  const rows = value
    .split('\n')
    .map((raw, index) => ({ line: index + 1, value: raw.trim() }))
    .filter((row) => row.value.length > 0);
  const issues: ConsentRowIssue[] = [];
  const recipients: CampaignRecipientConsent[] = [];

  for (const row of rows) {
    const parts = row.value.split('|').map((part) => part.trim());
    if (parts.length !== 4) {
      issues.push({ line: row.line, message: `Recipient line ${row.line} must contain exactly JID | source | evidence reference | ISO opt-in time.` });
      continue;
    }
    const [jid, optInSource, optInEvidenceReference, optedInAt] = parts;
    const missing = [
      !jid && 'JID',
      !optInSource && 'source',
      !optInEvidenceReference && 'evidence reference',
      !optedInAt && 'opt-in time',
    ].filter(Boolean);
    if (missing.length) {
      issues.push({ line: row.line, message: `Recipient line ${row.line} is missing ${missing.join(', ')}.` });
      continue;
    }
    if (Number.isNaN(Date.parse(optedInAt))) {
      issues.push({ line: row.line, message: `Recipient line ${row.line} has an invalid ISO opt-in time.` });
      continue;
    }
    recipients.push({ jid, optInSource, optInEvidenceReference, optedInAt: new Date(optedInAt).toISOString() });
  }

  return { issues, recipients, rowCount: rows.length };
}
