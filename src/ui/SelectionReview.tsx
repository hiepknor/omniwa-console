import type { ReactNode } from 'react';
import { CountBadge } from './Badge';
import { Button } from './Button';
import { Status, type Tone } from './Status';
import { cn } from './cn';

export type SelectionReviewItem = {
  id: string;
  label: ReactNode;
  meta?: ReactNode;
  detail?: ReactNode;
  status?: ReactNode;
  tone?: Tone;
};

/** Bounded review surface for selections that can outlive the current directory page. */
export function SelectionReview({
  items,
  title = 'Selected items',
  description,
  disabled = false,
  onRemove,
  className,
}: {
  items: readonly SelectionReviewItem[];
  title?: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  onRemove: (id: string) => void;
  className?: string;
}) {
  if (!items.length) return null;
  return (
    <section aria-label={typeof title === 'string' ? title : 'Selection review'} className={cn('min-w-0 border border-line-strong bg-surface', className)}>
      <header className="flex min-w-0 items-start justify-between gap-4 border-b border-line bg-recessed p-3">
        <div className="grid min-w-0 gap-1">
          <h3 className="text-sm font-semibold text-fg">{title}</h3>
          {description ? <p className="text-xs text-fg-3">{description}</p> : null}
        </div>
        <CountBadge
          count={items.length}
          aria-label={`${items.length.toLocaleString('en-US')} selected ${items.length === 1 ? 'item' : 'items'}`}
          aria-live="polite"
          aria-atomic="true"
          className="shrink-0"
        />
      </header>
      <ul className="grid max-h-56 overflow-y-auto">
        {items.map((item) => (
          <li key={item.id} className="grid min-h-14 min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-line p-3 last:border-b-0 max-sm:grid-cols-1 max-sm:items-start">
            <span className="grid min-w-0 gap-0.5">
              <strong className="truncate text-[13px] font-medium text-fg">{item.label}</strong>
              {item.meta ? <span className="truncate font-mono text-xs text-fg-3">{item.meta}</span> : null}
              {item.detail ? <small className="break-words text-xs leading-4 text-fg-3">{item.detail}</small> : null}
            </span>
            <span className="flex flex-wrap items-center justify-end gap-2 max-sm:w-full max-sm:justify-between">
              {item.status ? <Status tone={item.tone ?? 'neutral'}>{item.status}</Status> : null}
              <Button disabled={disabled} aria-label={`Remove selected item ${typeof item.label === 'string' ? item.label : item.id}`} onClick={() => onRemove(item.id)}>Remove</Button>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
