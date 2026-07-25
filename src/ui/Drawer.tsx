import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from './cn';

/** Right-side inspector over a scrim. Square, flat, 1px left border. */
export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60" onClick={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'flex w-[min(440px,100%)] max-sm:w-full max-sm:mt-auto max-sm:h-[85dvh]',
          'flex-col h-dvh bg-surface border-l border-line',
        )}
      >
        <header className="flex items-start justify-between gap-3 p-4 border-b border-line">
          <div className="grid gap-1 min-w-0">
            <h2 className="text-sm font-semibold text-fg truncate">{title}</h2>
            {subtitle ? <div className="font-mono text-xs text-fg-3 truncate">{subtitle}</div> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 size-7 inline-flex items-center justify-center text-fg-3 hover:text-fg hover:bg-elevated border border-transparent hover:border-line"
          >
            <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="m4 4 8 8M12 4l-8 8" />
            </svg>
          </button>
        </header>
        <div className="flex-1 min-h-0 overflow-y-auto p-4">{children}</div>
      </aside>
    </div>,
    document.body,
  );
}
