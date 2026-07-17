import type { ReactNode } from 'react';

export function PageHeader({
  title,
  eyebrow,
  meta,
  actions,
}: {
  title: string;
  eyebrow?: string;
  meta?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="warp-page-header">
      <div className="warp-page-header-context">
        {eyebrow && <span className="warp-page-header-eyebrow">{eyebrow}</span>}
        <div className="warp-page-header-title-row">
          <h1>{title}</h1>
          {meta && <div className="warp-page-header-meta">{meta}</div>}
        </div>
      </div>
      {actions && <div className="warp-page-header-actions">{actions}</div>}
    </header>
  );
}
