import type { ReactNode } from 'react';
import { cn } from './cn';

export function PageHeader({
  eyebrow,
  title,
  description,
  secondaryActions,
  primaryAction,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  secondaryActions?: ReactNode;
  primaryAction?: ReactNode;
  className?: string;
}) {
  const hasActions = Boolean(secondaryActions || primaryAction);
  const titleRow = eyebrow ? 'sm:row-start-2' : 'sm:row-start-1';
  const descriptionRow = eyebrow ? 'sm:row-start-3' : 'sm:row-start-2';
  return (
    <header
      className={cn(
        'grid min-w-0 w-full grid-cols-1 gap-x-6 gap-y-1 border-b border-line py-4 max-sm:py-2',
        'sm:grid-cols-[minmax(0,1fr)_auto]',
        className,
      )}
    >
      {eyebrow ? <span className="text-[11px] font-medium uppercase tracking-wider text-fg-3 sm:col-span-2">{eyebrow}</span> : null}
      <h1 className={cn('min-w-0 text-xl font-semibold leading-tight tracking-tight text-fg sm:col-start-1 sm:text-[22px]', titleRow)}>{title}</h1>
      {description ? <p className={cn('min-w-0 max-w-[70ch] text-sm text-fg-2 sm:col-span-2 sm:col-start-1', descriptionRow)}>{description}</p> : null}
      {hasActions ? (
        <div className={cn('mt-2 flex min-w-0 flex-wrap items-center gap-2 sm:col-start-2 sm:mt-0 sm:justify-end sm:self-center', titleRow)}>
          {secondaryActions}
          {primaryAction}
        </div>
      ) : null}
    </header>
  );
}
