import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { cn } from './cn';

export type ButtonVariant = 'ghost' | 'primary' | 'danger';

type SharedProps = {
  children: ReactNode;
  className?: string;
  variant?: ButtonVariant;
};

const base = cn(
  'group relative isolate inline-flex h-9 items-center justify-center overflow-hidden border max-sm:h-10',
  'whitespace-nowrap text-[13px] font-semibold leading-none select-none',
  'transition-[color,background-color,border-color,box-shadow,transform] duration-150 motion-reduce:transition-none',
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
  'active:translate-x-px active:translate-y-px active:shadow-none',
  'disabled:pointer-events-none disabled:translate-x-0 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none',
  'aria-busy:cursor-progress disabled:aria-busy:opacity-70',
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

function ButtonContent({ children, busy = false }: { children: ReactNode; busy?: boolean }) {
  return (
    <span className="relative z-10 inline-flex min-w-0 items-center justify-center gap-2 px-3">
      {busy ? (
        <span
          aria-hidden
          className="size-3 shrink-0 animate-spin border border-current border-r-transparent motion-reduce:animate-pulse"
        />
      ) : null}
      {children}
    </span>
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
  disabled,
  'aria-busy': ariaBusy,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & SharedProps) {
  const busy = ariaBusy === true || ariaBusy === 'true';
  return (
    <button
      type={type}
      data-variant={variant}
      aria-busy={ariaBusy}
      disabled={disabled || busy}
      className={buttonClassName(variant, className)}
      {...props}
    >
      <ButtonContent busy={busy}>{children}</ButtonContent>
    </button>
  );
}

export function ButtonLink({
  variant = 'ghost',
  className,
  children,
  ...props
}: Omit<LinkProps, 'children' | 'className'> & SharedProps) {
  return (
    <Link data-variant={variant} className={buttonClassName(variant, className)} {...props}>
      <ButtonContent>{children}</ButtonContent>
    </Link>
  );
}
