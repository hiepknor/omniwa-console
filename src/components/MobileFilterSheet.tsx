import { useEffect, useId, type ReactNode, type RefObject } from 'react';
import { IconButton } from '@/components/IconButton';
import { useModalDialog } from '@/components/useModalDialog';

function CloseIcon() {
  return <svg className="!h-4 !w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>;
}

export function MobileFilterSheet({
  open,
  title,
  children,
  onClose,
  returnFocusRef,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  returnFocusRef?: RefObject<HTMLElement | null>;
}) {
  const titleId = useId();
  const dialogRef = useModalDialog<HTMLDivElement>({ onClose, active: open, returnFocusRef });

  useEffect(() => {
    if (!open || !returnFocusRef?.current) return;
    const trigger = returnFocusRef.current;
    const closeWhenTriggerHides = () => {
      if (trigger.getClientRects().length === 0) onClose();
    };
    const observer = new ResizeObserver(closeWhenTriggerHides);
    observer.observe(trigger);
    return () => observer.disconnect();
  }, [open, returnFocusRef]);

  if (!open) return null;

  return (
    <div
      className="mobile-filter-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="mobile-filter-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header>
          <div><span className="eyebrow">Table controls</span><h2 id={titleId}>{title}</h2></div>
          <IconButton compact className="mobile-filter-close" label="Close filters" title="Close" onClick={onClose}><CloseIcon /></IconButton>
        </header>
        <div className="mobile-filter-body">{children}</div>
      </div>
    </div>
  );
}
