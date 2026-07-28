import { cn } from './cn';

export type Tab = { id: string; label: string; count?: number };

export function Tabs({
  tabs,
  active,
  onChange,
  className,
}: {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={cn('flex gap-0.5 overflow-x-auto overflow-y-hidden border-b border-line', className)} role="tablist">
      {tabs.map((tab) => {
        const selected = tab.id === active;
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={cn(
              'inline-flex items-center gap-2 h-10 px-3 text-xs whitespace-nowrap border-b-2 -mb-px transition-colors',
              selected ? 'border-accent text-fg' : 'border-transparent text-fg-3 hover:text-fg',
            )}
          >
            {tab.label}
            {typeof tab.count === 'number' ? (
              <span className="font-mono text-[11px] text-fg-3 tabular-nums">{tab.count}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
