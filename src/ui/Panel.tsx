import type { ReactNode } from 'react';
import { cn } from './cn';

/** Bordered panel (manga ink frame) with an optional titled header. */
export function Panel({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn('min-w-0 border border-line-strong bg-surface', className)}>
      {title || actions ? (
        <header className="flex min-w-0 items-start justify-between gap-4 p-4 border-b border-line">
          <div className="grid gap-1 min-w-0">
            {title ? <h2 className="text-sm font-semibold text-fg">{title}</h2> : null}
            {description ? <p className="text-xs text-fg-3">{description}</p> : null}
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
        </header>
      ) : null}
      <div className={cn('min-w-0 p-4', bodyClassName)}>{children}</div>
    </section>
  );
}
