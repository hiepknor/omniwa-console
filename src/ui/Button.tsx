import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

export type ButtonVariant = 'ghost' | 'primary' | 'danger';

type SharedProps = {
  children: ReactNode;
  className?: string;
  variant?: ButtonVariant;
};

const base = cn(
  'group relative isolate inline-flex h-9 items-stretch justify-center overflow-hidden border',
  'whitespace-nowrap text-[13px] font-semibold leading-none select-none',
  'transition-[color,background-color,border-color,box-shadow,transform] duration-150 motion-reduce:transition-none',
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
  'active:translate-x-px active:translate-y-px active:shadow-none',
  'disabled:pointer-events-none disabled:translate-x-0 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none',
  'aria-busy:cursor-progress',
);

const variants: Record<ButtonVariant, string> = {
  primary: cn(
    'border-fg bg-fg text-bg shadow-[2px_2px_0_var(--color-fg-3)]',
    'hover:-translate-x-px hover:-translate-y-px hover:bg-fg-2 hover:shadow-[3px_3px_0_var(--color-fg-3)]',
  ),
  ghost: cn(
    'border-line-strong bg-surface text-fg',
    'hover:-translate-x-px hover:-translate-y-px hover:bg-elevated hover:shadow-[2px_2px_0_var(--color-line-strong)]',
  ),
  danger: cn(
    'border-fg bg-[repeating-linear-gradient(45deg,var(--color-surface)_0_6px,var(--color-elevated)_6px_8px)] text-fg shadow-[2px_2px_0_var(--color-fg)]',
    'hover:-translate-x-px hover:-translate-y-px hover:bg-fg hover:text-bg hover:shadow-[3px_3px_0_var(--color-fg-3)]',
  ),
};

const rails: Record<ButtonVariant, string> = {
  primary: 'bg-bg',
  ghost: 'bg-fg',
  danger: 'bg-[repeating-linear-gradient(135deg,var(--color-fg)_0_2px,var(--color-bg)_2px_4px)]',
};

function ButtonContent({ children, variant }: { children: ReactNode; variant: ButtonVariant }) {
  return (
    <>
      <span aria-hidden className={cn('w-1 shrink-0 self-stretch border-r border-current/20', rails[variant])} />
      <span className="relative z-10 inline-flex min-w-0 items-center justify-center gap-2 px-3">
        {children}
      </span>
    </>
  );
}

export function buttonClassName(variant: ButtonVariant = 'ghost', className?: string): string {
  return cn(base, variants[variant], className);
}

export function Button({
  variant = 'ghost',
  className,
  type = 'button',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & SharedProps) {
  return (
    <button
      type={type}
      data-variant={variant}
      className={buttonClassName(variant, className)}
      {...props}
    >
      <ButtonContent variant={variant}>{children}</ButtonContent>
    </button>
  );
}

export function ButtonLink({
  variant = 'ghost',
  className,
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & SharedProps) {
  return (
    <a data-variant={variant} className={buttonClassName(variant, className)} {...props}>
      <ButtonContent variant={variant}>{children}</ButtonContent>
    </a>
  );
}
