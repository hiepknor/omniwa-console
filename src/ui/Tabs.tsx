import { useRef, type KeyboardEvent } from 'react';
import { cn } from './cn';
import { CountBadge } from './Badge';

export type Tab = { id: string; label: string; count?: number; panelId?: string };

export type TabNavigationKey = 'ArrowLeft' | 'ArrowRight' | 'Home' | 'End';

export function nextTabId(tabs: readonly Tab[], currentId: string, key: TabNavigationKey): string | undefined {
  if (tabs.length === 0) return undefined;
  const currentIndex = Math.max(0, tabs.findIndex((tab) => tab.id === currentId));
  if (key === 'Home') return tabs[0]?.id;
  if (key === 'End') return tabs.at(-1)?.id;
  const direction = key === 'ArrowRight' ? 1 : -1;
  return tabs[(currentIndex + direction + tabs.length) % tabs.length]?.id;
}

function tabDomId(tab: Tab): string | undefined {
  return tab.panelId ? `${tab.panelId}-${tab.id}-tab` : undefined;
}

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
  const buttonRefs = useRef(new Map<string, HTMLButtonElement>());
  const activeExists = tabs.some((tab) => tab.id === active);
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, currentId: string) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const nextId = nextTabId(tabs, currentId, event.key as TabNavigationKey);
    if (!nextId) return;
    onChange(nextId);
    buttonRefs.current.get(nextId)?.focus();
  };
  return (
    <div className={cn('flex gap-0.5 overflow-x-auto overflow-y-hidden border-b border-line', className)} role="tablist" aria-orientation="horizontal">
      {tabs.map((tab, index) => {
        const selected = tab.id === active;
        return (
          <button
            key={tab.id}
            ref={(node) => { if (node) buttonRefs.current.set(tab.id, node); else buttonRefs.current.delete(tab.id); }}
            id={tabDomId(tab)}
            role="tab"
            type="button"
            aria-selected={selected}
            aria-controls={tab.panelId}
            tabIndex={selected || (!activeExists && index === 0) ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(event) => onKeyDown(event, tab.id)}
            className={cn(
              'inline-flex items-center gap-2 h-10 px-3 text-xs whitespace-nowrap border-b-2 -mb-px transition-colors',
              selected ? 'border-accent text-fg' : 'border-transparent text-fg-3 hover:text-fg',
            )}
          >
            {tab.label}
            {typeof tab.count === 'number' ? (
              <CountBadge count={tab.count} />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
