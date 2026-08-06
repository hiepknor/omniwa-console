import { useId, useLayoutEffect, useRef, useState, type ButtonHTMLAttributes } from 'react';
import { buttonClassName, type ButtonVariant } from './Button';
import { cn } from './cn';
import { Icon, type IconName } from './Icon';

export function IconButton({
  label,
  icon,
  variant = 'ghost',
  className,
  disabled,
  busy = false,
  type = 'button',
  ...props
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'aria-label'> & {
  label: string;
  icon: IconName;
  variant?: ButtonVariant;
  busy?: boolean;
}) {
  const tooltipId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ left: 0, top: 0 });

  useLayoutEffect(() => {
    if (!tooltipOpen || !buttonRef.current || !tooltipRef.current) return;
    const buttonRect = buttonRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const gutter = 8;
    const left = Math.min(
      window.innerWidth - tooltipRect.width - gutter,
      Math.max(gutter, buttonRect.left + (buttonRect.width - tooltipRect.width) / 2),
    );
    const below = buttonRect.bottom + gutter;
    const top = below + tooltipRect.height <= window.innerHeight - gutter
      ? below
      : buttonRect.top - tooltipRect.height - gutter;
    setTooltipPosition({ left, top });
  }, [tooltipOpen, label]);

  return (
    <span
      className="relative inline-flex shrink-0"
      onMouseEnter={() => setTooltipOpen(true)}
      onMouseLeave={() => setTooltipOpen(false)}
    >
      <button
        {...props}
        ref={buttonRef}
        type={type}
        data-variant={variant}
        aria-label={label}
        aria-describedby={tooltipId}
        aria-busy={busy || undefined}
        disabled={disabled || busy}
        onFocus={(event) => { setTooltipOpen(true); props.onFocus?.(event); }}
        onBlur={(event) => { setTooltipOpen(false); props.onBlur?.(event); }}
        className={buttonClassName(variant, cn('size-9 p-0 max-sm:size-10', className))}
      >
        <Icon name={icon} className={cn(busy && 'animate-spin motion-reduce:animate-pulse')} />
      </button>
      <span
        ref={tooltipRef}
        id={tooltipId}
        role="tooltip"
        style={tooltipPosition}
        className={cn(
          'pointer-events-none fixed z-50 whitespace-nowrap border border-line-strong bg-fg px-2 py-1 text-[11px] font-medium leading-none text-bg shadow-[2px_2px_0_var(--color-fg-3)]',
          'transition-opacity delay-500 duration-150',
          tooltipOpen ? 'visible opacity-100' : 'invisible opacity-0',
          'motion-reduce:transition-none',
        )}
      >
        {label}
      </span>
    </span>
  );
}
