import type { ReactNode } from 'react';
import { RealtimeIndicator } from './RealtimeIndicator';
import { WorkspaceBanner } from './feedback/WorkspaceBanner';

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
    <>
      <header className="page-head">
        <div className="head-context">
          {eyebrow && <span className="crumb">{eyebrow}</span>}
          <div className="head-title-row">
            <h1>{title}</h1>
            {meta && <div className="head-meta">{meta}</div>}
          </div>
        </div>
        <div className="head-right">
          <RealtimeIndicator />
          {actions}
        </div>
      </header>
      <WorkspaceBanner />
    </>
  );
}
