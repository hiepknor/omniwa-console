import type { ReactNode } from 'react';
import { cn } from './cn';

export function DescriptionList({ children, className }: { children: ReactNode; className?: string }) {
  return <dl className={cn('grid min-w-0', className)}>{children}</dl>;
}

export function DescriptionItem({
  label,
  children,
  mono = false,
  className,
  valueClassName,
}: {
  label: ReactNode;
  children: ReactNode;
  mono?: boolean;
  className?: string;
  valueClassName?: string;
}) {
  return (
    <div className={cn('grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,2fr)] items-start gap-4 border-b border-line py-1.5 last:border-b-0 max-sm:grid-cols-1 max-sm:gap-0.5', className)}>
      <dt className="text-xs text-fg-3">{label}</dt>
      <dd className={cn('min-w-0 break-words text-right text-[13px] text-fg max-sm:text-left', mono && 'font-mono text-xs', valueClassName)}>{children}</dd>
    </div>
  );
}
