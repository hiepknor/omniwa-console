import type { SelectHTMLAttributes } from 'react';
import { cn } from './cn';

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  const disabled = props.disabled ?? false;

  return (
    <div
      className={cn(
        'group relative inline-grid min-w-32 text-left focus-within:z-10',
        className,
      )}
      data-disabled={disabled || undefined}
    >
      <select
        className={cn(
          'peer col-start-1 row-start-1 h-9 w-full appearance-none border border-line bg-surface pl-3 pr-11',
          'cursor-pointer text-[13px] font-medium leading-none text-fg transition-colors',
          'hover:border-line-strong hover:bg-recessed',
          'focus-visible:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
          'disabled:cursor-not-allowed disabled:bg-elevated disabled:text-fg-3 disabled:opacity-60',
          'aria-[invalid=true]:border-line-strong aria-[invalid=true]:outline aria-[invalid=true]:outline-1 aria-[invalid=true]:outline-line-strong',
        )}
        {...props}
      >
        {children}
      </select>
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute bottom-px right-px top-px grid w-9 place-items-center border-l border-line',
          'text-fg-3 transition-colors group-hover:border-line-strong group-hover:text-fg',
          'peer-focus-visible:border-fg peer-focus-visible:bg-fg peer-focus-visible:text-bg',
          'peer-disabled:bg-elevated peer-disabled:text-fg-3 peer-disabled:opacity-60',
        )}
      >
        <svg
          viewBox="0 0 16 16"
          className="size-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="square"
          strokeLinejoin="miter"
        >
          <path d="m3.5 5.5 4.5 5 4.5-5" />
        </svg>
      </span>
    </div>
  );
}
