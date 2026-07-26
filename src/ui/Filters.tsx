import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';
import { Icon } from './Icon';

export function FilterToolbar({ children, className, as: Tag = 'div', ...props }: HTMLAttributes<HTMLElement> & { children: ReactNode; as?: 'div' | 'form' }) {
  return <Tag className={cn('flex min-w-0 flex-wrap items-end gap-2 border-b border-line bg-recessed p-3', className)} {...props}>{children}</Tag>;
}

export function FilterChip({ label, value, onRemove }: { label: string; value: ReactNode; onRemove: () => void }) {
  return (
    <button type="button" onClick={onRemove} className="group inline-flex h-8 max-w-full items-center border border-line-strong bg-surface text-xs text-fg transition-colors hover:bg-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
      <span className="border-r border-line px-2 font-medium uppercase tracking-wide text-fg-3">{label}</span>
      <span className="min-w-0 truncate px-2 font-mono">{value}</span>
      <Icon name="close" size="sm" className="mr-2 text-fg-3 group-hover:text-fg" />
      <span className="sr-only">Remove filter</span>
    </button>
  );
}
