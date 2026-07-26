import { useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from './cn';
import { OverlayCloseButton } from './OverlayCloseButton';
import { useModalFocus } from './useModalFocus';

/** Right-side inspector that becomes a bottom sheet on narrow viewports. */
export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  closeDisabled = false,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  closeDisabled?: boolean;
}) {
  const titleId = useId();
  const drawerRef = useRef<HTMLElement>(null);
  useModalFocus(open, drawerRef, onClose, closeDisabled);

  if (!open) return null;
  return createPortal(
    <div
      className="fixed inset-y-0 left-0 z-50 flex h-dvh w-dvw justify-end bg-black/60 max-sm:items-end"
      onClick={() => { if (!closeDisabled) onClose(); }}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-busy={closeDisabled || undefined}
        ref={drawerRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'relative flex h-dvh min-w-0 w-[min(440px,100%)] max-w-full flex-col border-l border-line-strong bg-surface',
          'max-sm:mt-auto max-sm:h-[85dvh] max-sm:w-full max-sm:border-l-0 max-sm:border-t',
        )}
      >
        <header className="grid min-h-14 grid-cols-[minmax(0,1fr)_2.25rem] items-stretch border-b border-line-strong bg-surface max-sm:grid-cols-[minmax(0,1fr)_2.5rem]">
          <div className="grid min-w-0 content-center gap-1 px-4 py-3">
            <h2 id={titleId} className="truncate text-sm font-semibold leading-tight text-fg">{title}</h2>
            {subtitle ? <div className="truncate font-mono text-xs text-fg-2">{subtitle}</div> : null}
          </div>
          <OverlayCloseButton label="Close drawer" onClick={onClose} disabled={closeDisabled} />
        </header>
        <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto bg-surface p-4">{children}</div>
      </aside>
    </div>,
    document.body,
  );
}
