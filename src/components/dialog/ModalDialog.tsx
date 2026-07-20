import type { FormEventHandler, ReactNode, RefObject } from 'react';
import { IconButton } from '@/components/IconButton';
import { useModalDialog } from '@/components/useModalDialog';

function CloseIcon() {
  return <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>;
}

export function ModalDialog({
  titleId,
  eyebrow = 'Command',
  title,
  context,
  children,
  footer,
  onClose,
  canClose = true,
  initialFocusRef,
  onSubmit,
  closeLabel = 'Close dialog',
  className = '',
}: {
  titleId: string;
  eyebrow?: string;
  title: ReactNode;
  context?: ReactNode;
  children: ReactNode;
  footer: ReactNode;
  onClose: () => void;
  canClose?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
  onSubmit?: FormEventHandler<HTMLFormElement>;
  closeLabel?: string;
  className?: string;
}) {
  const dialogRef = useModalDialog<HTMLDivElement>({ onClose, canClose, initialFocusRef });
  const content = (
    <>
      <div className="dialog-body min-h-0 flex-1 overflow-y-auto px-5 py-5 max-[520px]:px-4 max-[520px]:py-4">{children}</div>
      <footer className="dialog-actions flex min-h-16 shrink-0 items-center justify-end gap-2 border-t border-[var(--border-subtle)] px-5 py-3 max-[520px]:grid max-[520px]:grid-cols-2 max-[520px]:px-4 [&_.btn]:min-h-11 max-[360px]:grid-cols-1">{footer}</footer>
    </>
  );

  return (
    <div
      className="modal-backdrop fixed inset-0 z-[70] flex items-center justify-center bg-[color-mix(in_oklab,var(--bg)_76%,transparent)] p-4 max-[520px]:items-end max-[520px]:p-0"
      role="presentation"
      onMouseDown={(event) => { if (event.target === event.currentTarget && canClose) onClose(); }}
    >
      <div
        ref={dialogRef}
        className={`dialog modal-dialog flex max-h-[calc(100dvh-32px)] w-[min(520px,calc(100vw-32px))] flex-col overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--surface)] shadow-[var(--elev-raised)] max-[520px]:max-h-[calc(100dvh-16px)] max-[520px]:w-full max-[520px]:rounded-b-none ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <header className="dialog-header grid min-h-[72px] shrink-0 grid-cols-[minmax(0,1fr)_auto_44px] items-center gap-x-3 border-b border-[var(--border-subtle)] bg-[var(--bg)] px-5 py-3 max-[520px]:grid-cols-[minmax(0,1fr)_44px] max-[520px]:px-4">
          <div className="min-w-0">
            <span className="eyebrow mb-1">{eyebrow}</span>
            <h2 className="truncate text-[16px] font-medium leading-6 text-[var(--fg)]" id={titleId}>{title}</h2>
          </div>
          {context && <span className="mono min-w-0 max-w-48 truncate text-[11px] text-[var(--fg-2)] max-[520px]:col-span-2 max-[520px]:row-start-2 max-[520px]:max-w-full" title={typeof context === 'string' ? context : undefined}>{context}</span>}
          <IconButton compact className="col-start-3 justify-self-end max-[520px]:col-start-2 max-[520px]:row-start-1" label={closeLabel} title="Close" disabled={!canClose} onClick={onClose}><CloseIcon /></IconButton>
        </header>
        {onSubmit
          ? <form className="flex min-h-0 flex-1 flex-col" onSubmit={onSubmit}>{content}</form>
          : <div className="flex min-h-0 flex-1 flex-col">{content}</div>}
      </div>
    </div>
  );
}
