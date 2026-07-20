import type { ReactNode } from 'react';

export function StatusIndicator({
  children,
  dotClass = 'dot-info',
  size = 'default',
  className = '',
}: {
  children: ReactNode;
  dotClass?: string;
  size?: 'default' | 'small';
  className?: string;
}) {
  return (
    <span data-indicator="status" className={`status${size === 'small' ? ' sm' : ''}${className ? ` ${className}` : ''}`}>
      <span className={`dot ${dotClass}`} aria-hidden="true" />
      {children}
    </span>
  );
}

export function CategoryPill({
  children,
  title,
  compact = false,
  className = '',
}: {
  children: ReactNode;
  title?: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <span
      data-badge="category"
      className={`inline-flex min-w-0 max-w-full cursor-default items-center rounded-full border border-[var(--border-subtle)] bg-[color-mix(in_oklab,var(--fg)_4%,transparent)] font-medium text-[var(--fg-2)] ${compact ? 'min-h-5 text-[11px] leading-[18px]' : 'min-h-6 text-xs leading-[18px]'} ${className}`}
      title={title}
    >
      <span className={`min-w-0 overflow-hidden text-ellipsis whitespace-nowrap ${compact ? '!px-2' : '!px-2.5'}`}>{children}</span>
    </span>
  );
}

export function RowStateBadge({ children }: { children: ReactNode }) {
  return (
    <span data-badge="row-state" className="ml-2 inline-flex min-h-5 items-center rounded-[var(--radius-sm)] border border-[var(--border-subtle)] text-[10px] uppercase leading-4 tracking-[1.2px] text-[var(--muted)]">
      <span className="!px-2">{children}</span>
    </span>
  );
}

export function OverflowCountBadge({
  count,
  label,
}: {
  count: number;
  label: string;
}) {
  return (
    <CategoryPill compact className="num shrink-0" title={`${count} additional ${label}`}>
      <span aria-hidden="true">+{count}</span>
      <span className="visually-hidden">{count} additional {label}</span>
    </CategoryPill>
  );
}

export function CategorySummary({
  values,
  label,
  visibleCount = 1,
  itemClassName = '',
  className = '',
}: {
  values: readonly string[];
  label: string;
  visibleCount?: number;
  itemClassName?: string;
  className?: string;
}) {
  if (values.length === 0) return <span>—</span>;

  const visible = values.slice(0, Math.max(1, visibleCount));
  const remaining = values.length - visible.length;
  return (
    <span
      className={`inline-flex min-w-0 max-w-full items-center gap-1 overflow-hidden ${className}`}
      aria-label={`${label}: ${values.join(', ')}`}
    >
      {visible.map((value) => (
        <CategoryPill className={`shrink ${itemClassName}`} title={value} key={value}>{value}</CategoryPill>
      ))}
      {remaining > 0 && <OverflowCountBadge count={remaining} label={remaining === 1 ? label.replace(/s$/, '') : label} />}
    </span>
  );
}
