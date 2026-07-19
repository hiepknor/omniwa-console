import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/** Own keyboard focus and restore it when a modal command surface closes. */
export function useModalDialog<T extends HTMLElement>({
  onClose,
  canClose = true,
  initialFocusRef,
}: {
  onClose: () => void;
  canClose?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
}) {
  const dialogRef = useRef<T>(null);
  const onCloseRef = useRef(onClose);
  const canCloseRef = useRef(canClose);
  onCloseRef.current = onClose;
  canCloseRef.current = canClose;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return;
    const returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusable = () => Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    (initialFocusRef?.current ?? focusable()[0] ?? dialog).focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && canCloseRef.current) {
        event.preventDefault();
        event.stopImmediatePropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusable();
      if (items.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.body.style.overflow = previousOverflow;
      returnFocus?.focus();
    };
  }, [initialFocusRef]);

  return dialogRef;
}
