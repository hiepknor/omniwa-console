import type { ReactNode } from 'react';
import { cn } from './cn';

/** Square mono count chip. */
export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center min-w-5 h-4 px-1 font-mono text-[11px] leading-none text-fg-2 bg-recessed border border-line',
        className,
      )}
    >
      {children}
    </span>
  );
}
