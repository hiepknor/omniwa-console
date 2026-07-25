import type { ButtonHTMLAttributes } from 'react';
import { cn } from './cn';

type Variant = 'ghost' | 'primary' | 'danger';

const base =
  'inline-flex items-center justify-center gap-2 h-9 px-3 text-[13px] font-medium leading-none whitespace-nowrap border transition-colors select-none disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent';

const variants: Record<Variant, string> = {
  ghost: 'bg-transparent text-fg border-line hover:bg-elevated hover:border-line-strong',
  primary: 'bg-accent text-white border-accent hover:brightness-110',
  danger: 'bg-transparent text-danger border-danger/50 hover:bg-danger/10',
};

export function Button({
  variant = 'ghost',
  className,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button type={type} className={cn(base, variants[variant], className)} {...props} />;
}
