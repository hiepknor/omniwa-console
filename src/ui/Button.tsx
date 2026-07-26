import type { ButtonHTMLAttributes } from 'react';
import { cn } from './cn';

type Variant = 'ghost' | 'primary' | 'danger';

const base =
  'inline-flex items-center justify-center gap-2 h-9 px-3 text-[13px] font-medium leading-none whitespace-nowrap border transition-colors select-none disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent';

const variants: Record<Variant, string> = {
  // Comic inverted block for the single primary action.
  primary: 'bg-fg text-bg border-fg hover:bg-fg-2 hover:border-fg-2',
  ghost: 'bg-transparent text-fg border-line hover:bg-elevated hover:border-line-strong',
  // Hazard-stripe hatch signals danger without hue; inverts on hover.
  danger:
    'text-fg border-line-strong bg-[repeating-linear-gradient(45deg,transparent_0_6px,rgba(0,0,0,0.09)_6px_8px)] hover:bg-fg hover:text-bg',
};

export function Button({
  variant = 'ghost',
  className,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button type={type} className={cn(base, variants[variant], className)} {...props} />;
}
