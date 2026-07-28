import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

const badgeClassName = 'inline-flex items-center justify-center min-w-5 h-4 px-1 font-mono text-[11px] leading-none text-fg-2 bg-recessed border border-line';

/** Canonical non-interactive quantity chip. */
export function CountBadge({ count, className, ...props }: Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & { count: number }) {
  return (
    <span
      className={cn(badgeClassName, 'tabular-nums', className)}
      {...props}
    >
      {count.toLocaleString('en-US')}
    </span>
  );
}

/** Compact framed metadata such as an immutable resource version. */
export function MetadataBadge({ children, className, ...props }: HTMLAttributes<HTMLSpanElement> & { children: ReactNode }) {
  return <span className={cn(badgeClassName, className)} {...props}>{children}</span>;
}
