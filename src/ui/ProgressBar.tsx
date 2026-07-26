import { cn } from './cn';

export type ProgressStatus = 'active' | 'complete' | 'failed';

/** Honest progress indicator. Omit value only when the total is genuinely unknown. */
export function ProgressBar({
  label,
  value,
  max = 100,
  status = 'active',
  showValue = true,
  className,
}: {
  label: string;
  value?: number;
  max?: number;
  status?: ProgressStatus;
  showValue?: boolean;
  className?: string;
}) {
  const safeMax = max > 0 ? max : 100;
  const effectiveValue = status === 'complete' ? safeMax : value;
  const normalized = effectiveValue === undefined ? undefined : Math.min(safeMax, Math.max(0, effectiveValue));
  const percentage = normalized === undefined ? undefined : Math.round((normalized / safeMax) * 100);
  const valueText = status === 'failed' ? `Failed at ${percentage ?? 'unknown'}%` : normalized === undefined ? 'In progress' : `${percentage}%`;

  return (
    <div className={cn('grid min-w-0 gap-1.5', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs font-medium text-fg">{label}</span>
        {showValue ? <span className="font-mono text-[11px] tabular-nums text-fg-3">{valueText}</span> : null}
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={normalized}
        aria-valuetext={valueText}
        className="relative h-2 overflow-hidden border border-line-strong bg-recessed"
      >
        {normalized === undefined ? (
          <span aria-hidden className={cn('absolute inset-y-0 left-0 bg-[repeating-linear-gradient(45deg,var(--color-fg)_0_1px,transparent_1px_4px)]', status === 'failed' ? 'w-2' : 'right-0')} />
        ) : (
          <span
            aria-hidden
            className={cn(
              'block h-full bg-fg transition-[width] duration-150 motion-reduce:transition-none',
              status === 'failed' && 'bg-[repeating-linear-gradient(45deg,var(--color-fg)_0_2px,var(--color-surface)_2px_4px)]',
            )}
            style={{ width: `${percentage}%` }}
          />
        )}
      </div>
    </div>
  );
}
