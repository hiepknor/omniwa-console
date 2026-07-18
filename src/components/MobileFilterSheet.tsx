import { useEffect, useId, useRef, type ReactNode, type RefObject } from 'react';

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
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const tabletQuery = window.matchMedia('(min-width: 641px)');
    const closeAtTablet = (event: MediaQueryListEvent) => {
      if (event.matches) onCloseRef.current();
    };
    if (tabletQuery.matches) {
      onCloseRef.current();
      return;
    }
    tabletQuery.addEventListener('change', closeAtTablet);
    return () => tabletQuery.removeEventListener('change', closeAtTablet);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
    );
    document.body.style.overflow = 'hidden';
    focusable?.[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      returnFocusRef?.current?.focus();
    };
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
          <button className="mobile-filter-close" type="button" onClick={onClose} aria-label="Close filters">✕</button>
        </header>
        <div className="mobile-filter-body">{children}</div>
      </div>
    </div>
  );
}
