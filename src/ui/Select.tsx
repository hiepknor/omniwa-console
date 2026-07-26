import type { SelectHTMLAttributes } from 'react';
import { cn } from './cn';

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={cn('relative inline-flex', className)}>
      <select
        className={cn(
          'appearance-none w-full h-9 pl-2.5 pr-8 text-[13px] bg-surface text-fg border border-line',
          'hover:border-line-strong focus-visible:outline-none focus-visible:border-line-strong',
        )}
        {...props}
      >
        {children}
      </select>
      <svg
        aria-hidden
        viewBox="0 0 16 16"
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 size-3 text-fg-3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="m4 6 4 4 4-4" />
      </svg>
    </div>
  );
}
