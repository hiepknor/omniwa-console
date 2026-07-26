import type { AriaAttributes, InputHTMLAttributes, ReactNode } from 'react';
import { cloneElement, forwardRef, isValidElement, useId } from 'react';
import { cn } from './cn';

export const fieldControlClassName = cn(
  'w-full border border-line bg-recessed text-[13px] text-fg placeholder:text-fg-3',
  'hover:border-line-strong focus-visible:border-line-strong focus-visible:outline-none',
  'aria-[invalid=true]:border-line-strong',
  'disabled:cursor-not-allowed disabled:bg-elevated disabled:text-fg-3 disabled:opacity-60',
);

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          fieldControlClassName,
          'h-9 px-2.5 max-sm:h-10',
          className,
        )}
        {...props}
      />
    );
  },
);

export function Field({
  label,
  description,
  error,
  required = false,
  children,
  className,
}: {
  label: string;
  description?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  children: (id: string, labelId: string) => ReactNode;
  className?: string;
}) {
  const id = useId();
  const labelId = `${id}-label`;
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const control = children(id, labelId);
  type ControlAria = {
    'aria-describedby'?: string;
    'aria-invalid'?: AriaAttributes['aria-invalid'];
    'aria-required'?: AriaAttributes['aria-required'];
  };
  const enhancedControl = isValidElement<ControlAria>(control)
    ? cloneElement(control, {
        'aria-describedby': [control.props['aria-describedby'], descriptionId, errorId].filter(Boolean).join(' ') || undefined,
        'aria-invalid': error ? true : control.props['aria-invalid'],
        'aria-required': required ? true : control.props['aria-required'],
      })
    : control;
  return (
    <div className={cn('grid gap-1.5', className)}>
      <label
        id={labelId}
        htmlFor={id}
        className="text-[11px] font-medium uppercase tracking-wider text-fg-3"
      >
        {label}
        {required ? <span aria-hidden className="ml-1 text-fg-2">/ required</span> : null}
      </label>
      {enhancedControl}
      {description ? <p id={descriptionId} className="text-xs text-fg-3">{description}</p> : null}
      {error ? <p id={errorId} className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
