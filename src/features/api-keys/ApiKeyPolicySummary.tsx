import type { ApiKeyResource } from '@/api/api-keys';
import { keyKindLabel } from './presentation';

export function ApiKeyPolicySummary({
  kind,
  scopes,
  instanceRefs,
  note,
}: {
  kind: ApiKeyResource['kind'];
  scopes: readonly string[];
  instanceRefs: readonly string[];
  note: string;
}) {
  return (
    <section className="rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[color-mix(in_oklab,var(--fg)_2%,transparent)] p-3" aria-label="Policy review">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="eyebrow !m-0">Policy review</span>
        <span className="text-right text-xs text-[var(--fg-2)]">{note}</span>
      </div>
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-xs">
        <dt className="text-[var(--muted)]">Kind</dt><dd className="text-right text-[var(--fg)]">{keyKindLabel(kind)}</dd>
        <dt className="text-[var(--muted)]">Scopes</dt><dd className="min-w-0 text-right font-mono text-[var(--fg)] [overflow-wrap:anywhere]">{scopes.join(', ') || 'None'}</dd>
        <dt className="text-[var(--muted)]">Instance refs</dt><dd className="min-w-0 text-right font-mono text-[var(--fg)] [overflow-wrap:anywhere]">{instanceRefs.join(', ') || 'Not submitted'}</dd>
      </dl>
    </section>
  );
}
