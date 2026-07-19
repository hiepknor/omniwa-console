import { useEffect, useRef, type RefObject } from 'react';

/** Non-modal drawer a11y: initial focus on the close control, Escape to close
 *  (suppressed while a nested dialog is open), and focus restore to the
 *  element that had focus when the drawer opened. No focus trap — drawers are
 *  deliberately non-modal (DESIGN.md management template). */
export function useDrawerFocus(options: {
  onClose: () => void;
  closeRef: RefObject<HTMLElement>;
  suppressEscape?: boolean;
}): void {
  const onCloseRef = useRef(options.onClose);
  const suppressEscapeRef = useRef(options.suppressEscape ?? false);
  onCloseRef.current = options.onClose;
  suppressEscapeRef.current = options.suppressEscape ?? false;

  useEffect(() => {
    const returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    options.closeRef.current?.focus();

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || suppressEscapeRef.current) return;
      event.preventDefault();
      onCloseRef.current();
    };

    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      if (returnFocus !== null && document.contains(returnFocus)) returnFocus.focus();
    };
  }, [options.closeRef]);
}
