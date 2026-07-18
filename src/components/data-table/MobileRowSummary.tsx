import type { ReactNode } from 'react';

export function MobileRowSummary({
  identity,
  identifier,
  secondary,
  meta,
  selection,
  actionLabel,
}: {
  identity: ReactNode;
  identifier?: ReactNode;
  secondary?: ReactNode;
  meta?: ReactNode;
  selection?: ReactNode;
  actionLabel?: string;
}) {
  return (
    <div className={`mobile-row-summary${selection !== undefined ? ' has-selection' : ''}`}>
      {selection !== undefined && <span className="mobile-row-selection">{selection}</span>}
      <span className="mobile-row-identity">
        <span className="mobile-row-primary">{identity}</span>
        {identifier !== undefined && <span className="mobile-row-id mono">{identifier}</span>}
      </span>
      {(secondary !== undefined || meta !== undefined) && (
        <span className="mobile-row-secondary">
          {secondary}
          {meta !== undefined && <span className="mobile-row-meta">{meta}</span>}
        </span>
      )}
      {actionLabel !== undefined && (
        <span className="mobile-row-disclosure" aria-hidden="true">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
        </span>
      )}
    </div>
  );
}
