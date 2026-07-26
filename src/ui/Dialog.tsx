import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/** Centered modal over a scrim. Square, flat, strong 1px border. */
export function Dialog({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 max-sm:items-end max-sm:p-0 bg-black/60"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="flex w-[min(520px,100%)] max-h-[calc(100dvh-2rem)] flex-col bg-elevated border border-line-strong"
      >
        <header className="p-4 border-b border-line">
          <h2 className="text-sm font-semibold text-fg">{title}</h2>
        </header>
        <div className="flex-1 min-h-0 overflow-y-auto p-4">{children}</div>
        {footer ? <footer className="flex justify-end gap-2 p-4 border-t border-line">{footer}</footer> : null}
      </div>
    </div>,
    document.body,
  );
}
