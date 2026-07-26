import { useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useModalFocus } from './useModalFocus';

/** Centered modal over a scrim. Square, flat, strong 1px border. */
export function Dialog({
  open,
  onClose,
  title,
  children,
  footer,
  closeDisabled = false,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  closeDisabled?: boolean;
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  useModalFocus(open, dialogRef, onClose, closeDisabled);

  if (!open) return null;
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 max-sm:items-end max-sm:p-0 bg-black/60"
      onClick={() => { if (!closeDisabled) onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-busy={closeDisabled || undefined}
        ref={dialogRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="flex w-[min(520px,100%)] max-h-[calc(100dvh-2rem)] flex-col bg-elevated border border-line-strong"
      >
        <header className="p-4 border-b border-line">
          <h2 id={titleId} className="text-sm font-semibold text-fg">{title}</h2>
        </header>
        <div className="flex-1 min-h-0 overflow-y-auto p-4">{children}</div>
        {footer ? <footer className="flex justify-end gap-2 p-4 border-t border-line">{footer}</footer> : null}
      </div>
    </div>,
    document.body,
  );
}
