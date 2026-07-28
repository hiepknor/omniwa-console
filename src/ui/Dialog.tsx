import { useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CloseButton } from './CloseButton';
import { useModalFocus } from './useModalFocus';

/** Framed command surface centered on desktop and docked on narrow viewports. */
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
      className="fixed inset-y-0 left-0 z-50 flex h-dvh w-dvw items-center justify-center bg-black/60 p-4 max-sm:items-end max-sm:p-0"
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
        className={[
          'relative flex max-h-[calc(100dvh-2rem)] w-[min(560px,100%)] flex-col',
          'border border-line-strong bg-surface',
          'max-sm:max-h-[90dvh] max-sm:w-full max-sm:border-x-0 max-sm:border-b-0',
        ].join(' ')}
      >
        <header className="grid min-h-11 grid-cols-[minmax(0,1fr)_2.75rem] items-stretch border-b border-line-strong bg-surface max-sm:grid-cols-[minmax(0,1fr)_3rem]">
          <div className="flex min-w-0 items-center px-4 py-3">
            <h2 id={titleId} className="truncate text-sm font-semibold leading-tight text-fg">{title}</h2>
          </div>
          <div className="grid place-items-center">
            <CloseButton label="Close dialog" onClick={onClose} disabled={closeDisabled} />
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain bg-surface p-4">{children}</div>
        {footer ? (
          <footer className="flex flex-wrap justify-end gap-2 border-t border-line-strong bg-elevated p-3 max-sm:[&>*]:min-w-[calc(50%_-_0.25rem)] max-sm:[&>*]:flex-1">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
