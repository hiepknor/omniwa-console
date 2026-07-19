import type { ReactNode } from 'react';
import { WorkspaceBanner } from './feedback/WorkspaceBanner';

export function PageHeader({
  title,
  breadcrumb,
  meta,
  scope,
  status,
  actions,
}: {
  title: string;
  breadcrumb?: ReactNode;
  meta?: ReactNode;
  scope?: ReactNode;
  status?: ReactNode;
  actions?: ReactNode;
}) {
  const hasSecondaryRow = scope !== undefined || actions !== undefined;
  const scopedLayout = scope
    ? '!grid-cols-[auto_minmax(0,1fr)_auto] max-[640px]:!grid-cols-[minmax(0,1fr)_auto] max-[640px]:!items-center'
    : status !== undefined || actions !== undefined
      ? 'max-[640px]:!grid-cols-[minmax(0,1fr)_auto] max-[640px]:!items-center'
      : '';
  const mobileDensity = hasSecondaryRow ? 'max-[640px]:!py-3' : 'max-[640px]:!min-h-16 max-[640px]:!py-2';
  return (
    <>
      <header className={['page-head', scopedLayout, mobileDensity].filter(Boolean).join(' ')}>
        <div className="head-context">
          {breadcrumb && <div className="crumb">{breadcrumb}</div>}
          <div className="head-title-row">
            <h1>{title}</h1>
            {meta && <div className="head-meta">{meta}</div>}
          </div>
        </div>
        {scope && <div className="head-scope min-w-0 max-[640px]:!col-span-2 max-[640px]:!row-start-2 max-[640px]:!w-full">{scope}</div>}
        {(status !== undefined || actions !== undefined) && <div className="head-right max-[640px]:!contents">
          {status && <div className="head-status flex min-w-0 items-center justify-end max-[640px]:!col-start-2 max-[640px]:!row-start-1">{status}</div>}
          {actions && <div className={['head-actions flex min-w-0 items-center justify-end gap-2 max-[640px]:!col-span-2 max-[640px]:!w-full', scope ? 'max-[640px]:!row-start-3' : 'max-[640px]:!row-start-2'].join(' ')}>{actions}</div>}
        </div>}
      </header>
      <WorkspaceBanner />
    </>
  );
}
