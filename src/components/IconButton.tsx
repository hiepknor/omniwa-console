import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

export const IconButton = forwardRef<HTMLButtonElement, Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label' | 'children'> & {
  label: string;
  className?: string;
  compact?: boolean;
  surfaceClassName?: string;
  children: ReactNode;
}>(function IconButton({
  label,
  className = '',
  compact = false,
  surfaceClassName = '',
  children,
  ...props
}, ref) {
  return (
    <button
      ref={ref}
      {...props}
      className={`group !inline-flex !h-11 !w-11 !min-h-11 !min-w-11 !shrink-0 !items-center !justify-center !rounded-[var(--radius-sm)] !border-0 !bg-transparent !p-0 !text-[var(--muted)] hover:!text-[var(--fg)] focus-visible:!outline-none focus-visible:!shadow-[var(--focus-ring)] disabled:!cursor-not-allowed disabled:!opacity-50 ${className}`}
      type={props.type ?? 'button'}
      aria-label={label}
    >
      <span className={`!inline-flex ${compact ? '!h-8 !w-8' : '!h-9 !w-9'} !items-center !justify-center !rounded-[var(--radius-sm)] !border !border-[var(--border-subtle)] !bg-[var(--accent)] group-hover:!bg-[var(--accent-hover)] ${surfaceClassName}`}>{children}</span>
    </button>
  );
});
