import { useLayoutEffect, useRef, type ReactNode, type RefObject } from 'react';
import { cn } from './cn';

function useScrollReset(ref: RefObject<HTMLDivElement | null>, key: string | undefined, position: 'start' | 'end' = 'start') {
  const previousKey = useRef<string>();
  useLayoutEffect(() => {
    if (previousKey.current !== key) {
      if (ref.current) ref.current.scrollTop = position === 'end' ? ref.current.scrollHeight : 0;
      previousKey.current = key;
    }
  }, [key, position, ref]);
}

export function SplitWorkspace({
  directory,
  detail,
  detailOpen,
  directoryLabel = 'Directory',
  detailLabel = 'Detail',
  directoryFooter,
  detailFooter,
  directoryScrollKey,
  detailScrollKey,
  detailInitialPosition = 'start',
  frame = 'standalone',
  className,
}: {
  directory: ReactNode;
  detail: ReactNode;
  detailOpen: boolean;
  directoryLabel?: string;
  detailLabel?: string;
  directoryFooter?: ReactNode;
  detailFooter?: ReactNode;
  directoryScrollKey?: string;
  detailScrollKey?: string;
  detailInitialPosition?: 'start' | 'end';
  frame?: 'standalone' | 'attached';
  className?: string;
}) {
  const directoryScrollRef = useRef<HTMLDivElement>(null);
  const detailScrollRef = useRef<HTMLDivElement>(null);
  useScrollReset(directoryScrollRef, directoryScrollKey);
  useScrollReset(detailScrollRef, detailScrollKey, detailInitialPosition);

  return (
    <div className={cn(
      'min-h-0 flex-1 grid grid-cols-[320px_minmax(0,1fr)] max-[900px]:grid-cols-1',
      frame === 'standalone' && 'border-t border-line',
      className,
    )}>
      <section
        aria-label={directoryLabel}
        className={cn('flex min-h-0 min-w-0 flex-col border-r border-line max-[900px]:border-r-0', detailOpen && 'max-[900px]:hidden')}
      >
        <div ref={directoryScrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">{directory}</div>
        {directoryFooter ? <div className="shrink-0">{directoryFooter}</div> : null}
      </section>
      <section
        aria-label={detailLabel}
        className={cn('flex min-h-0 min-w-0 flex-col', !detailOpen && 'max-[900px]:hidden')}
      >
        <div ref={detailScrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">{detail}</div>
        {detailFooter ? <div className="shrink-0">{detailFooter}</div> : null}
      </section>
    </div>
  );
}

export function WorkspacePaneHeader({
  title,
  description,
  actions,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn('sticky top-0 z-10 flex min-h-[57px] items-center justify-between gap-3 border-b border-line bg-surface px-4', className)}>
      <div className="grid min-w-0">
        <strong className="truncate text-sm font-semibold text-fg">{title}</strong>
        {description ? <span className="truncate text-xs text-fg-3">{description}</span> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}
