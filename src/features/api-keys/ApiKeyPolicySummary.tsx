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
    <section className="overflow-hidden rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[color-mix(in_oklab,var(--fg)_1%,transparent)]" aria-label="Policy review">
      <div className="flex min-h-11 items-center justify-between gap-3 border-b border-[var(--border-subtle)] !px-4 !py-2.5">
        <span className="eyebrow !m-0 !text-[var(--fg-2)]">Policy review</span>
        <span className="text-right text-xs text-[var(--fg-2)]">{note}</span>
      </div>
      <dl className="!px-4 text-xs">
        <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-4 border-b border-[var(--border-subtle)] !py-2.5 max-[520px]:grid-cols-1 max-[520px]:gap-1"><dt className="text-[var(--muted)]">Kind</dt><dd className="text-right text-[var(--fg)] max-[520px]:text-left">{keyKindLabel(kind)}</dd></div>
        <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-4 border-b border-[var(--border-subtle)] !py-2.5 max-[520px]:grid-cols-1 max-[520px]:gap-1"><dt className="text-[var(--muted)]">Scopes</dt><dd className="min-w-0 text-right font-mono text-[var(--fg)] [overflow-wrap:anywhere] max-[520px]:text-left">{scopes.join(', ') || 'Not configured'}</dd></div>
        <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-4 !py-2.5 max-[520px]:grid-cols-1 max-[520px]:gap-1"><dt className="text-[var(--muted)]">Instance access</dt><dd className="min-w-0 text-right font-mono text-[var(--fg)] [overflow-wrap:anywhere] max-[520px]:text-left">{instanceRefs.join(', ') || 'No restriction submitted'}</dd></div>
      </dl>
    </section>
  );
}
