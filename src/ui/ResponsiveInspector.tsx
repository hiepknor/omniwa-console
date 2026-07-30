import { useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { CloseButton } from './CloseButton';
import { Drawer } from './Drawer';

export const DOCKED_INSPECTOR_MIN_WIDTH = 1560;

export function isDockedInspectorWidth(width: number): boolean {
  return width >= DOCKED_INSPECTOR_MIN_WIDTH;
}

function useDockedInspector(containerRef: React.RefObject<HTMLDivElement | null>) {
  const [docked, setDocked] = useState(false);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const update = () => setDocked(isDockedInspectorWidth(container.getBoundingClientRect().width));
    update();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', update);
      return () => window.removeEventListener('resize', update);
    }

    const observer = new ResizeObserver(update);
    observer.observe(container);
    return () => observer.disconnect();
  }, [containerRef]);

  return docked;
}

/**
 * Responsive operations inspector. It docks as a non-modal third column when
 * the owning workspace is wide enough and otherwise preserves Drawer behavior.
 */
export function ResponsiveInspector({
  children,
  open,
  persistent,
  onClose,
  title,
  subtitle,
  inspector,
  focusKey,
  dockedClose = false,
}: {
  children: ReactNode;
  open: boolean;
  persistent: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  inspector: ReactNode;
  focusKey?: string;
  dockedClose?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previousFocusKey = useRef(focusKey);
  const titleId = useId();
  const docked = useDockedInspector(containerRef);
  const dockedVisible = docked && (persistent || open);

  useLayoutEffect(() => {
    const previous = previousFocusKey.current;
    previousFocusKey.current = focusKey;
    if (dockedVisible && previous !== focusKey && (previous || focusKey)) headingRef.current?.focus();
  }, [dockedVisible, focusKey]);

  return (
    <div ref={containerRef} className="@container/responsive-inspector flex min-h-0 min-w-0 flex-1">
      <div className="flex min-h-0 min-w-0 flex-1">{children}</div>

      {dockedVisible ? (
        <aside aria-labelledby={titleId} className="flex h-full w-[440px] shrink-0 flex-col border-l border-line-strong bg-surface">
          <header className="grid min-h-14 grid-cols-[minmax(0,1fr)_auto] items-stretch border-b border-line-strong bg-surface">
            <div className="grid min-w-0 content-center gap-1 px-4 py-3">
              <h2 ref={headingRef} id={titleId} tabIndex={-1} className="truncate text-sm font-semibold leading-tight text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg">{title}</h2>
              {subtitle ? <div className="truncate font-mono text-xs text-fg-2">{subtitle}</div> : null}
            </div>
            {dockedClose ? <div className="grid w-11 place-items-center"><CloseButton label="Close inspector" onClick={onClose} /></div> : null}
          </header>
          <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain bg-surface p-4">{inspector}</div>
        </aside>
      ) : null}

      {!docked ? (
        <Drawer open={open} onClose={onClose} title={title} subtitle={subtitle}>
          {inspector}
        </Drawer>
      ) : null}
    </div>
  );
}
