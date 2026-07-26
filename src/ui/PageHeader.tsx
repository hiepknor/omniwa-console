import type { ReactNode } from 'react';
import { cn } from './cn';

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        'flex min-w-0 w-full flex-col gap-3 py-5 border-b border-line sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className="grid gap-1 min-w-0">
        {eyebrow ? (
          <span className="text-[11px] font-medium uppercase tracking-wider text-fg-3">{eyebrow}</span>
        ) : null}
        <h1 className="text-[22px] font-semibold leading-tight tracking-tight text-fg">{title}</h1>
        {description ? <p className="max-w-prose text-sm text-fg-2">{description}</p> : null}
      </div>
      {actions ? <div className="flex min-w-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
