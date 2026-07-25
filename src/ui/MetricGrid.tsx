import { cn } from './cn';

export type Metric = { label: string; value: string; hint?: string };

/** One contiguous bordered grid — never separate cards. Mono values. */
export function MetricGrid({
  metrics,
  columns = 4,
  className,
}: {
  metrics: Metric[];
  columns?: 3 | 4 | 5 | 6;
  className?: string;
}) {
  const cols: Record<number, string> = {
    3: 'sm:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
    5: 'sm:grid-cols-2 lg:grid-cols-5',
    6: 'sm:grid-cols-3 lg:grid-cols-6',
  };
  return (
    <div className={cn('grid grid-cols-1 border-t border-l border-line', cols[columns], className)}>
      {metrics.map((m) => (
        <div key={m.label} className="grid gap-2 min-h-24 p-3 border-r border-b border-line">
          <span className="text-[11px] font-medium uppercase tracking-wider text-fg-3">{m.label}</span>
          <span className="font-mono text-2xl font-semibold text-fg tabular-nums">{m.value}</span>
          {m.hint ? <span className="text-xs text-fg-3">{m.hint}</span> : null}
        </div>
      ))}
    </div>
  );
}
