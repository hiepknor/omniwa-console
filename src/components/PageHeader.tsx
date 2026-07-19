import type { ReactNode } from 'react';
import { RealtimeIndicator } from './RealtimeIndicator';
import { WorkspaceBanner } from './feedback/WorkspaceBanner';

export function PageHeader({
  title,
  eyebrow,
  meta,
  scope,
  actions,
}: {
  title: string;
  eyebrow?: string;
  meta?: ReactNode;
  scope?: ReactNode;
  actions?: ReactNode;
}) {
  const scopedLayout = scope
    ? '!grid-cols-[auto_minmax(0,1fr)_auto] max-[640px]:!grid-cols-[minmax(0,1fr)_auto] max-[640px]:!items-center'
    : '';
  return (
    <>
      <header className={['page-head', scopedLayout].filter(Boolean).join(' ')}>
        <div className="head-context">
          {eyebrow && <span className="crumb">{eyebrow}</span>}
          <div className="head-title-row">
            <h1>{title}</h1>
            {meta && <div className="head-meta">{meta}</div>}
          </div>
        </div>
        {scope && <div className="head-scope min-w-0 max-[640px]:!col-span-2 max-[640px]:!row-start-2 max-[640px]:!w-full">{scope}</div>}
        <div className={['head-right', scope ? 'max-[640px]:!col-start-2 max-[640px]:!row-start-1 max-[640px]:!justify-end' : ''].filter(Boolean).join(' ')}>
          <RealtimeIndicator />
          {actions}
        </div>
      </header>
      <WorkspaceBanner />
    </>
  );
}
