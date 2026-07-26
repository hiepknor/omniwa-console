import type { InputHTMLAttributes, ReactNode } from 'react';
import { forwardRef, useId } from 'react';
import { cn } from './cn';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          'w-full h-9 px-2.5 text-[13px] bg-recessed text-fg border border-line placeholder:text-fg-3',
          'hover:border-line-strong focus-visible:outline-none focus-visible:border-line-strong',
          'aria-[invalid=true]:border-line-strong',
          className,
        )}
        {...props}
      />
    );
  },
);

export function Field({
  label,
  error,
  children,
  className,
}: {
  label: string;
  error?: ReactNode;
  children: (id: string) => ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cn('grid gap-1.5', className)}>
      <label
        htmlFor={id}
        className="text-[11px] font-medium uppercase tracking-wider text-fg-3"
      >
        {label}
      </label>
      {children(id)}
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
