import type { ReactNode } from 'react';

export function MobileRowSummary({
  identity,
  identifier,
  secondary,
  meta,
  actionLabel,
}: {
  identity: ReactNode;
  identifier?: ReactNode;
  secondary: ReactNode;
  meta?: ReactNode;
  actionLabel?: string;
}) {
  return (
    <div className="mobile-row-summary">
      <span className="mobile-row-identity">
        <span className="mobile-row-primary">{identity}</span>
        {identifier !== undefined && <span className="mobile-row-id mono">{identifier}</span>}
      </span>
      <span className="mobile-row-secondary">
        {secondary}
        {meta !== undefined && <span className="mobile-row-meta">{meta}</span>}
      </span>
      {actionLabel !== undefined && (
        <span className="mobile-row-disclosure" aria-label={actionLabel}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
        </span>
      )}
    </div>
  );
}
