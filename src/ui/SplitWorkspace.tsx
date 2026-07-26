import type { ReactNode } from 'react';
import { cn } from './cn';

export function SplitWorkspace({
  directory,
  detail,
  detailOpen,
  directoryLabel = 'Directory',
  detailLabel = 'Detail',
  directoryFooter,
  detailFooter,
  className,
}: {
  directory: ReactNode;
  detail: ReactNode;
  detailOpen: boolean;
  directoryLabel?: string;
  detailLabel?: string;
  directoryFooter?: ReactNode;
  detailFooter?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('min-h-0 flex-1 grid grid-cols-[320px_minmax(0,1fr)] border-t border-line max-[900px]:grid-cols-1', className)}>
      <section
        aria-label={directoryLabel}
        className={cn('flex min-h-0 min-w-0 flex-col border-r border-line max-[900px]:border-r-0', detailOpen && 'max-[900px]:hidden')}
      >
        <div className="min-h-0 flex-1 overflow-y-auto">{directory}</div>
        {directoryFooter ? <div className="shrink-0">{directoryFooter}</div> : null}
      </section>
      <section
        aria-label={detailLabel}
        className={cn('flex min-h-0 min-w-0 flex-col', !detailOpen && 'max-[900px]:hidden')}
      >
        <div className="min-h-0 flex-1 overflow-y-auto">{detail}</div>
        {detailFooter ? <div className="shrink-0">{detailFooter}</div> : null}
      </section>
    </div>
  );
}

export function WorkspacePaneHeader({
  title,
  description,
  actions,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-10 flex min-h-[57px] items-center justify-between gap-3 border-b border-line bg-surface px-4">
      <div className="grid min-w-0">
        <strong className="truncate text-sm font-semibold text-fg">{title}</strong>
        {description ? <span className="truncate text-xs text-fg-3">{description}</span> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}
