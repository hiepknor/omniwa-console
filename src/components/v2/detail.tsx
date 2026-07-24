import type { ReactNode } from 'react';
import { relativeTime } from '@/lib/format';

/** A labelled fact rendered as a `<dt>`/`<dd>` pair inside a `ui-v2-detail-list`. */
export function Fact({ label, value }: { label: string; value: ReactNode }) {
  return <div><dt>{label}</dt><dd>{value}</dd></div>;
}

/**
 * Relative timestamp with the absolute value available on hover and to assistive
 * technology via `<time title>`. Renders `fallback` when no value is reported.
 */
export function RelativeTime({ value, fallback = 'Not reported' }: { value?: string; fallback?: ReactNode }) {
  return value ? <time dateTime={value} title={value}>{relativeTime(value) || value}</time> : <>{fallback}</>;
}
